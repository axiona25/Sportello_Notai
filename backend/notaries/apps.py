from django.apps import AppConfig


class NotariesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notaries'
    verbose_name = 'Notaries'
    
    def ready(self):
        """Import signals when the app is ready."""
        import notaries.signals  # noqa

