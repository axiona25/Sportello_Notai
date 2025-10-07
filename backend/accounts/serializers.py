"""
Serializers for authentication and user management.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserRole, SessionToken
from notaries.models import Notary, Client, Collaborator


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'mfa_enabled', 'email_verified', 
                  'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True, min_length=12)
    role = serializers.ChoiceField(choices=UserRole.choices)
    
    # Optional profile data
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    studio_name = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Le password non coincidono")
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email già registrata")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data['role']
        
        # Extract profile data
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        studio_name = validated_data.pop('studio_name', '')
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            role=role
        )
        
        # Create profile based on role
        if role == UserRole.NOTAIO:
            Notary.objects.create(
                user=user,
                studio_name=studio_name or f"Studio {user.email}"
            )
        elif role == UserRole.CLIENTE:
            Client.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name
            )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email e password sono obbligatorie")
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Credenziali non valide")
        
        # Check if account is locked
        if user.is_account_locked():
            raise serializers.ValidationError("Account bloccato per troppi tentativi di login falliti")
        
        # Authenticate
        user = authenticate(email=email, password=password)
        
        if not user:
            # Increment failed attempts
            try:
                user = User.objects.get(email=email)
                user.increment_failed_login()
            except User.DoesNotExist:
                pass
            raise serializers.ValidationError("Credenziali non valide")
        
        # Reset failed attempts on successful login
        user.reset_failed_login()
        
        data['user'] = user
        return data


class MFASetupSerializer(serializers.Serializer):
    """Serializer for MFA setup."""
    
    def validate(self, data):
        user = self.context['request'].user
        if user.mfa_enabled:
            raise serializers.ValidationError("MFA già abilitato")
        return data


class MFAVerifySerializer(serializers.Serializer):
    """Serializer for MFA token verification."""
    
    token = serializers.CharField(min_length=6, max_length=6)
    
    def validate(self, data):
        user = self.context['request'].user
        
        if not user.mfa_enabled:
            raise serializers.ValidationError("MFA non abilitato")
        
        if not user.verify_mfa_token(data['token']):
            raise serializers.ValidationError("Token non valido")
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=12)
    new_password_confirm = serializers.CharField(write_only=True, min_length=12)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Le nuove password non coincidono")
        
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError("Password attuale non corretta")
        
        return data

