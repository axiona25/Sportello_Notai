from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SessionToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'role', 'status', 'mfa_enabled', 'email_verified', 'created_at']
    list_filter = ['role', 'status', 'mfa_enabled', 'email_verified']
    search_fields = ['email']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('role', 'status')}),
        ('MFA', {'fields': ('mfa_enabled', 'mfa_secret')}),
        ('Verification', {'fields': ('email_verified', 'email_verification_token')}),
        ('Security', {'fields': ('failed_login_attempts', 'locked_until')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']


@admin.register(SessionToken)
class SessionTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'revoked']
    list_filter = ['revoked']
    search_fields = ['user__email']
    ordering = ['-created_at']

