from django.contrib import admin
from .models import Act


@admin.register(Act)
class ActAdmin(admin.ModelAdmin):
    list_display = ['title', 'protocol_number', 'category', 'status', 'notary', 'client', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['title', 'protocol_number', 'notary__studio_name', 'client__first_name', 'client__last_name']
    readonly_fields = ['created_at', 'updated_at', 'closed_at']

