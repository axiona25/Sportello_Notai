from django.contrib import admin
from .models import Notary, Client, Collaborator, NotaryAvailability


@admin.register(Notary)
class NotaryAdmin(admin.ModelAdmin):
    list_display = ['studio_name', 'address_city', 'average_rating', 'total_reviews', 'total_acts']
    search_fields = ['studio_name', 'user__email']
    list_filter = ['address_city', 'address_province']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['get_full_name', 'user', 'fiscal_code', 'phone']
    search_fields = ['first_name', 'last_name', 'user__email', 'fiscal_code']


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    list_display = ['get_full_name', 'notary', 'position']
    search_fields = ['first_name', 'last_name', 'notary__studio_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


@admin.register(NotaryAvailability)
class NotaryAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['notary', 'day_of_week', 'start_time', 'end_time', 'is_available']
    list_filter = ['day_of_week', 'is_available']

