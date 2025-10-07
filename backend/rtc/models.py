"""
Models for real-time communication (audio/video/co-authoring).
"""
import uuid
from django.db import models
from accounts.models import User
from acts.models import Act
from documents.models import ActDocument


class RtcSessionType(models.TextChoices):
    """RTC session types."""
    VIDEO_1TO1 = 'video_1to1', 'Video 1:1'
    VIDEO_GROUP = 'video_group', 'Video Group'
    SCREEN_SHARE = 'screen_share', 'Screen Share'
    DOCUMENT_SHARE = 'document_share', 'Document Share'


class RtcSessionStatus(models.TextChoices):
    """RTC session status."""
    ACTIVE = 'active', 'Active'
    ENDED = 'ended', 'Ended'
    FAILED = 'failed', 'Failed'


class RtcSession(models.Model):
    """Real-time communication session."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    session_type = models.CharField(max_length=20, choices=RtcSessionType.choices)
    status = models.CharField(
        max_length=20,
        choices=RtcSessionStatus.choices,
        default=RtcSessionStatus.ACTIVE
    )
    
    # Host
    host = models.ForeignKey(User, on_delete=models.PROTECT, related_name='hosted_sessions')
    
    # Atto collegato (opzionale)
    act = models.ForeignKey(
        Act,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='rtc_sessions'
    )
    
    # SFU/Server details
    server_url = models.TextField(blank=True)
    room_id = models.CharField(max_length=255, blank=True)
    
    # Documento condiviso
    shared_document = models.ForeignKey(
        ActDocument,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='rtc_sessions'
    )
    
    # CRDT/OT state (per co-authoring)
    collaboration_state = models.JSONField(default=dict, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'rtc_sessions'
        verbose_name = 'RTC Session'
        verbose_name_plural = 'RTC Sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['host', '-started_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.get_session_type_display()} - {self.room_id or self.id}"
    
    def end_session(self):
        """End the session."""
        from django.utils import timezone
        self.status = RtcSessionStatus.ENDED
        self.ended_at = timezone.now()
        self.save()
    
    def get_duration_seconds(self):
        """Get session duration in seconds."""
        if not self.ended_at:
            from django.utils import timezone
            end = timezone.now()
        else:
            end = self.ended_at
        
        delta = end - self.started_at
        return int(delta.total_seconds())


class RtcParticipant(models.Model):
    """Participant in RTC session."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(RtcSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rtc_participations')
    
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)
    
    # Permissions
    can_share_screen = models.BooleanField(default=True)
    can_edit_document = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'rtc_participants'
        verbose_name = 'RTC Participant'
        verbose_name_plural = 'RTC Participants'
        unique_together = ['session', 'user']
        ordering = ['session', 'joined_at']
    
    def __str__(self):
        return f"{self.user.email} in {self.session.room_id}"
    
    def leave_session(self):
        """Mark participant as left."""
        from django.utils import timezone
        self.left_at = timezone.now()
        self.save()

