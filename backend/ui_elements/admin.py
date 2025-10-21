from django.contrib import admin
from .models import AppointmentTypeTemplate


@admin.register(AppointmentTypeTemplate)
class AppointmentTypeTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'default_duration_minutes', 'icon', 'order', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('order', 'name')
    
    fieldsets = (
        ('Informazioni Base', {
            'fields': ('code', 'name', 'description')
        }),
        ('Configurazione', {
            'fields': ('default_duration_minutes', 'icon', 'color', 'order')
        }),
        ('Stato', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

