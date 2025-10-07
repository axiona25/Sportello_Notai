"""
Models for user accounts and authentication.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
import pyotp


class UserRole(models.TextChoices):
    """User roles for RBAC."""
    NOTAIO = 'notaio', 'Notaio'
    COLLABORATORE = 'collaboratore', 'Collaboratore'
    CLIENTE = 'cliente', 'Cliente'
    PARTNER = 'partner', 'Partner'
    ADMIN = 'admin', 'Admin'


class UserStatus(models.TextChoices):
    """User account status."""
    ACTIVE = 'active', 'Attivo'
    SUSPENDED = 'suspended', 'Sospeso'
    PENDING_VERIFICATION = 'pending_verification', 'In attesa di verifica'
    DELETED = 'deleted', 'Cancellato'


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('Email è obbligatoria')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('status', UserStatus.ACTIVE)
        extra_fields.setdefault('email_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    status = models.CharField(
        max_length=30,
        choices=UserStatus.choices,
        default=UserStatus.PENDING_VERIFICATION
    )
    
    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=255, blank=True, null=True)
    
    # Verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    
    # Security
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Django required fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    def is_account_locked(self):
        """Check if account is locked."""
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False
    
    def generate_mfa_secret(self):
        """Generate a new MFA secret."""
        self.mfa_secret = pyotp.random_base32()
        self.save()
        return self.mfa_secret
    
    def get_mfa_uri(self, issuer_name="Sportello Notai"):
        """Get MFA provisioning URI for QR code."""
        if not self.mfa_secret:
            self.generate_mfa_secret()
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.provisioning_uri(name=self.email, issuer_name=issuer_name)
    
    def verify_mfa_token(self, token):
        """Verify MFA token."""
        if not self.mfa_enabled or not self.mfa_secret:
            return False
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(token, valid_window=1)
    
    def increment_failed_login(self):
        """Increment failed login attempts."""
        from django.conf import settings
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            self.locked_until = timezone.now() + timezone.timedelta(
                seconds=settings.LOGIN_ATTEMPT_TIMEOUT
            )
        self.save()
    
    def reset_failed_login(self):
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save()


class SessionToken(models.Model):
    """JWT refresh tokens storage."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_tokens')
    
    token_hash = models.CharField(max_length=255, unique=True)
    
    expires_at = models.DateTimeField()
    revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(blank=True, null=True)
    
    # Device info
    device_info = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'session_tokens'
        verbose_name = 'Session Token'
        verbose_name_plural = 'Session Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token for {self.user.email}"
    
    def revoke(self):
        """Revoke the token."""
        self.revoked = True
        self.revoked_at = timezone.now()
        self.save()
    
    def is_valid(self):
        """Check if token is still valid."""
        if self.revoked:
            return False
        if self.expires_at < timezone.now():
            return False
        return True

