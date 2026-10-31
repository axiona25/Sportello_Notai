"""
Custom authentication backends for email-based authentication.
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailAuthBackend(ModelBackend):
    """
    Custom authentication backend that uses email instead of username.
    """
    
    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Authenticate a user using email and password.
        
        Args:
            request: The HTTP request
            email: User email
            password: User password
            **kwargs: Additional keyword arguments
            
        Returns:
            User object if authentication succeeds, None otherwise
        """
        if email is None:
            email = kwargs.get('username')  # Fallback per compatibilità
        
        if email is None or password is None:
            return None
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None
        
        # Check if account is active
        if not user.is_active:
            return None
        
        # Check password
        if user.check_password(password):
            return user
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID.
        
        Args:
            user_id: User UUID
            
        Returns:
            User object if found, None otherwise
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

