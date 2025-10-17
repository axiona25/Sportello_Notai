from django.contrib import admin
from .models import Element


@admin.register(Element)
class ElementAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'width', 'height', 'location', 'is_active', 'created_at')
    list_filter = ('type', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'location')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'type', 'description', 'location')
        }),
        ('Content', {
            'fields': ('svg_content', 'image_url')
        }),
        ('Dimensions', {
            'fields': ('width', 'height')
        }),
        ('Colors', {
            'fields': ('primary_color', 'secondary_color')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

