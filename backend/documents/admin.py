from django.contrib import admin
from .models import ActDocument, DocumentPermission


@admin.register(ActDocument)
class ActDocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'act', 'category', 'version', 'is_latest', 'is_signed', 'uploaded_at']
    list_filter = ['category', 'is_signed', 'is_latest', 'uploaded_at']
    search_fields = ['filename', 'act__title']


@admin.register(DocumentPermission)
class DocumentPermissionAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'can_read', 'can_write', 'can_delete', 'granted_by']
    list_filter = ['can_read', 'can_write', 'can_delete']

