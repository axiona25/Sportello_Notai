"""
Models for reviews and ratings.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from acts.models import Act
from notaries.models import Notary, Client


class Review(models.Model):
    """Review for a notary after act completion."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Una review per atto (obbligatoria per chiusura)
    act = models.OneToOneField(Act, on_delete=models.CASCADE, related_name='review')
    notary = models.ForeignKey(Notary, on_delete=models.CASCADE, related_name='reviews')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='reviews')
    
    # Rating (1-5 stelle)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Feedback
    title = models.CharField(max_length=255, blank=True)
    comment = models.TextField(blank=True)
    
    # Moderazione
    is_approved = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)
    moderation_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notary', '-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['is_approved', 'is_visible']),
        ]
    
    def __str__(self):
        return f"Review by {self.client.get_full_name()} - {self.rating}★"
    
    def save(self, *args, **kwargs):
        """Override save to update notary rating."""
        super().save(*args, **kwargs)
        # Update notary rating
        if self.is_approved:
            self.notary.update_rating()

