"""
Views for authentication and user management.
"""
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import User
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    MFASetupSerializer, MFAVerifySerializer, ChangePasswordSerializer
)
from audit.models import AuditLog, AuditAction


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    @extend_schema(
        responses={
            201: UserSerializer,
            400: OpenApiResponse(description="Validation error")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log registration
        AuditLog.log(
            action=AuditAction.CREATE,
            user=user,
            resource_type='user',
            resource_id=user.id,
            description=f"User registered: {user.email}",
            request=request
        )
        
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [permissions.AllowAny]
    throttle_classes = ['core.throttles.LoginRateThrottle']
    
    @extend_schema(
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description="Login successful"),
            400: OpenApiResponse(description="Invalid credentials")
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Update last login
        user.last_login = timezone.now()
        user.save()
        
        # Check if MFA is required
        if user.mfa_enabled:
            # Return temporary token for MFA verification
            return Response({
                'mfa_required': True,
                'user_id': str(user.id),
                'message': 'MFA token richiesto'
            })
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Log successful login
        AuditLog.log(
            action=AuditAction.LOGIN,
            user=user,
            description=f"User logged in: {user.email}",
            request=request
        )
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })


class MFASetupView(APIView):
    """MFA setup endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=MFASetupSerializer,
        responses={
            200: OpenApiResponse(description="MFA setup data"),
        }
    )
    def post(self, request):
        serializer = MFASetupSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        secret = user.generate_mfa_secret()
        uri = user.get_mfa_uri()
        
        return Response({
            'secret': secret,
            'qr_code_uri': uri,
            'message': 'Scansiona il QR code con la tua app di autenticazione'
        })


class MFAEnableView(APIView):
    """Enable MFA after verification."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=MFAVerifySerializer,
        responses={
            200: OpenApiResponse(description="MFA enabled"),
        }
    )
    def post(self, request):
        user = request.user
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token obbligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.verify_mfa_token(token):
            user.mfa_enabled = True
            user.save()
            
            # Log MFA enabled
            AuditLog.log(
                action=AuditAction.MFA_ENABLED,
                user=user,
                description="MFA enabled",
                request=request
            )
            
            return Response({'message': 'MFA abilitato con successo'})
        
        return Response(
            {'error': 'Token non valido'},
            status=status.HTTP_400_BAD_REQUEST
        )


class MFADisableView(APIView):
    """Disable MFA."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: OpenApiResponse(description="MFA disabled")}
    )
    def post(self, request):
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'error': 'Password obbligatoria'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Password non corretta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.mfa_enabled = False
        user.mfa_secret = None
        user.save()
        
        # Log MFA disabled
        AuditLog.log(
            action=AuditAction.MFA_DISABLED,
            user=user,
            description="MFA disabled",
            request=request
        )
        
        return Response({'message': 'MFA disabilitato con successo'})


class MFAVerifyView(APIView):
    """Verify MFA token during login."""
    
    permission_classes = [permissions.AllowAny]
    
    @extend_schema(
        request=MFAVerifySerializer,
        responses={
            200: OpenApiResponse(description="MFA verified, tokens returned"),
        }
    )
    def post(self, request):
        user_id = request.data.get('user_id')
        token = request.data.get('token')
        
        if not user_id or not token:
            return Response(
                {'error': 'user_id e token obbligatori'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Utente non trovato'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.verify_mfa_token(token):
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Log successful login with MFA
            AuditLog.log(
                action=AuditAction.LOGIN,
                user=user,
                description=f"User logged in with MFA: {user.email}",
                request=request
            )
            
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        
        return Response(
            {'error': 'Token MFA non valido'},
            status=status.HTTP_400_BAD_REQUEST
        )


class LogoutView(APIView):
    """User logout endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={200: OpenApiResponse(description="Logged out successfully")}
    )
    def post(self, request):
        try:
            # Blacklist refresh token
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception as e:
            # Log error but don't fail logout
            pass
        
        # Log logout
        AuditLog.log(
            action=AuditAction.LOGOUT,
            user=request.user,
            description=f"User logged out: {request.user.email}",
            request=request
        )
        
        return Response({'message': 'Logout effettuato con successo'})


class ChangePasswordView(APIView):
    """Change password endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="Password changed")}
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Log password change
        AuditLog.log(
            action=AuditAction.UPDATE,
            user=user,
            resource_type='user',
            resource_id=user.id,
            description="Password changed",
            request=request
        )
        
        return Response({'message': 'Password modificata con successo'})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

