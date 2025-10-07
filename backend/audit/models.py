"""
Models for audit logging and security events.
"""
import uuid
from django.db import models
from accounts.models import User, UserRole


class AuditAction(models.TextChoices):
    """Audit action types."""
    LOGIN = 'login', 'Login'
    LOGOUT = 'logout', 'Logout'
    LOGIN_FAILED = 'login_failed', 'Login Failed'
    CREATE = 'create', 'Create'
    READ = 'read', 'Read'
    UPDATE = 'update', 'Update'
    DELETE = 'delete', 'Delete'
    UPLOAD = 'upload', 'Upload'
    DOWNLOAD = 'download', 'Download'
    SHARE = 'share', 'Share'
    SIGN = 'sign', 'Sign'
    TIMESTAMP = 'timestamp', 'Timestamp'
    STAMP = 'stamp', 'Stamp'
    SEND_PEC = 'send_pec', 'Send PEC'
    EXPORT = 'export', 'Export'
    MFA_ENABLED = 'mfa_enabled', 'MFA Enabled'
    MFA_DISABLED = 'mfa_disabled', 'MFA Disabled'
    PERMISSION_GRANTED = 'permission_granted', 'Permission Granted'
    PERMISSION_REVOKED = 'permission_revoked', 'Permission Revoked'


class AuditLog(models.Model):
    """Comprehensive audit log for all actions."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Actor
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='audit_logs'
    )
    user_email = models.EmailField(blank=True)
    user_role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        blank=True,
        null=True
    )
    
    # Action
    action = models.CharField(max_length=30, choices=AuditAction.choices)
    resource_type = models.CharField(max_length=100, blank=True)  # "act", "document", "user"
    resource_id = models.UUIDField(blank=True, null=True)
    
    # Details
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Context
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Result
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.user_email or 'Unknown'} at {self.created_at}"
    
    @classmethod
    def log(cls, action, user=None, resource_type='', resource_id=None, 
            description='', metadata=None, request=None, success=True, error_message=''):
        """Utility method to create audit log entry."""
        
        ip_address = None
        user_agent = ''
        
        if request:
            # Get IP from request
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        return cls.objects.create(
            user=user,
            user_email=user.email if user else '',
            user_role=user.role if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )


class SecurityEvent(models.Model):
    """Security events and incidents."""
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    event_type = models.CharField(
        max_length=100,
        help_text='es. "brute_force", "unauthorized_access", "data_breach_attempt"'
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='security_events'
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    description = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    
    # Response
    action_taken = models.TextField(blank=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_events'
        verbose_name = 'Security Event'
        verbose_name_plural = 'Security Events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['severity', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} ({self.severity}) - {self.created_at}"
    
    @classmethod
    def log_event(cls, event_type, severity, description, user=None, 
                   ip_address=None, details=None):
        """Utility method to log security event."""
        return cls.objects.create(
            event_type=event_type,
            severity=severity,
            user=user,
            ip_address=ip_address,
            description=description,
            details=details or {}
        )

