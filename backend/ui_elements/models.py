import uuid
from django.db import models


class ElementType(models.TextChoices):
    """Types of UI elements."""
    LOGO = 'logo', 'Logo'
    ICON = 'icon', 'Icon'
    DECORATIVE = 'decorative', 'Decorative'
    SVG = 'svg', 'SVG'
    IMAGE = 'image', 'Image'


class Element(models.Model):
    """UI Elements storage - logos, icons, decorative elements."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=ElementType.choices)
    description = models.TextField(blank=True, null=True)
    
    # SVG or Image data
    svg_content = models.TextField(blank=True, null=True, help_text="SVG markup")
    image_url = models.URLField(blank=True, null=True, help_text="Image URL or path")
    
    # Dimensions
    width = models.IntegerField(help_text="Width in pixels")
    height = models.IntegerField(help_text="Height in pixels")
    
    # Colors
    primary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Hex color code")
    secondary_color = models.CharField(max_length=7, blank=True, null=True, help_text="Hex color code")
    
    # Metadata
    location = models.CharField(max_length=255, blank=True, null=True, help_text="Where it's used (e.g., 'sidebar.logo')")
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'elements'
        verbose_name = 'UI Element'
        verbose_name_plural = 'UI Elements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

