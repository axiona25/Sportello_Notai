from django.contrib import admin
from .models import ActDocument, DocumentPermission, PDFAnnotation


@admin.register(ActDocument)
class ActDocumentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'act', 'category', 'version', 'is_latest', 'is_signed', 'uploaded_at']
    list_filter = ['category', 'is_signed', 'is_latest', 'uploaded_at']
    search_fields = ['filename', 'act__title']


@admin.register(DocumentPermission)
class DocumentPermissionAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'can_read', 'can_write', 'can_delete', 'granted_by']
    list_filter = ['can_read', 'can_write', 'can_delete']


@admin.register(PDFAnnotation)
class PDFAnnotationAdmin(admin.ModelAdmin):
    list_display = ['id', 'document', 'page_number', 'object_type', 'created_by', 'created_at', 'z_index']
    list_filter = ['object_type', 'page_number', 'created_at']
    search_fields = ['document__filename', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['document', 'page_number', 'z_index', 'created_at']
    
    fieldsets = (
        ('Documento e Posizione', {
            'fields': ('id', 'document', 'page_number', 'z_index')
        }),
        ('Dati Annotazione', {
            'fields': ('object_type', 'fabric_object')
        }),
        ('Metadati', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )

