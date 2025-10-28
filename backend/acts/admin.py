from django.contrib import admin
from .models import Act, NotarialActMainCategory, NotarialActCategory, DocumentType, NotarialActCategoryDocument

# Import admin per protocolli
from .admin_protocollo import ProtocolloAttoNotarialeAdmin


@admin.register(NotarialActMainCategory)
class NotarialActMainCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', 'name']


@admin.register(NotarialActCategory)
class NotarialActCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'main_category', 'code', 'order', 'requires_property', 'requires_bank', 'is_active']
    list_filter = ['main_category', 'is_active', 'requires_property', 'requires_bank']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['main_category__order', 'order', 'name']


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'required_from', 'is_mandatory', 'is_active']
    list_filter = ['category', 'required_from', 'is_mandatory', 'is_active']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['category', 'name']


@admin.register(NotarialActCategoryDocument)
class NotarialActCategoryDocumentAdmin(admin.ModelAdmin):
    list_display = ['act_category', 'document_type', 'is_mandatory', 'order']
    list_filter = ['is_mandatory', 'act_category__main_category']
    search_fields = ['act_category__name', 'document_type__name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['act_category__main_category__order', 'act_category__order', 'order']
    autocomplete_fields = ['act_category', 'document_type']


@admin.register(Act)
class ActAdmin(admin.ModelAdmin):
    list_display = ['title', 'protocol_number', 'category', 'status', 'notary', 'client', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['title', 'protocol_number', 'notary__studio_name', 'client__first_name', 'client__last_name']
    readonly_fields = ['created_at', 'updated_at', 'closed_at']

