"""
Models for user accounts and authentication.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
import pyotp


class UserRole(models.TextChoices):
    """User roles for RBAC."""
    NOTAIO = 'notaio', 'Notaio'
    COLLABORATORE = 'collaboratore', 'Collaboratore'
    CLIENTE = 'cliente', 'Cliente'
    PARTNER = 'partner', 'Partner'
    ADMIN = 'admin', 'Admin'


class UserStatus(models.TextChoices):
    """User account status."""
    ACTIVE = 'active', 'Attivo'
    SUSPENDED = 'suspended', 'Sospeso'
    PENDING_VERIFICATION = 'pending_verification', 'In attesa di verifica'
    DELETED = 'deleted', 'Cancellato'


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('Email è obbligatoria')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('status', UserStatus.ACTIVE)
        extra_fields.setdefault('email_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    status = models.CharField(
        max_length=30,
        choices=UserStatus.choices,
        default=UserStatus.PENDING_VERIFICATION
    )
    
    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=255, blank=True, null=True)
    
    # Verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    
    # Security
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Django required fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    def is_account_locked(self):
        """Check if account is locked."""
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False
    
    def generate_mfa_secret(self):
        """Generate a new MFA secret."""
        self.mfa_secret = pyotp.random_base32()
        self.save()
        return self.mfa_secret
    
    def get_mfa_uri(self, issuer_name="Sportello Notai"):
        """Get MFA provisioning URI for QR code."""
        if not self.mfa_secret:
            self.generate_mfa_secret()
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.provisioning_uri(name=self.email, issuer_name=issuer_name)
    
    def verify_mfa_token(self, token):
        """Verify MFA token."""
        if not self.mfa_enabled or not self.mfa_secret:
            return False
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.verify(token, valid_window=1)
    
    def increment_failed_login(self):
        """Increment failed login attempts."""
        from django.conf import settings
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            self.locked_until = timezone.now() + timezone.timedelta(
                seconds=settings.LOGIN_ATTEMPT_TIMEOUT
            )
        self.save()
    
    def reset_failed_login(self):
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.locked_until = None
        self.save()


class SessionToken(models.Model):
    """JWT refresh tokens storage."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='session_tokens')
    
    token_hash = models.CharField(max_length=255, unique=True)
    
    expires_at = models.DateTimeField()
    revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(blank=True, null=True)
    
    # Device info
    device_info = models.JSONField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'session_tokens'
        verbose_name = 'Session Token'
        verbose_name_plural = 'Session Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token for {self.user.email}"
    
    def revoke(self):
        """Revoke the token."""
        self.revoked = True
        self.revoked_at = timezone.now()
        self.save()
    
    def is_valid(self):
        """Check if token is still valid."""
        if self.revoked:
            return False
        if self.expires_at < timezone.now():
            return False
        return True


class StatoCivile(models.TextChoices):
    """Stato civile choices."""
    CELIBE_NUBILE = 'celibe_nubile', 'Celibe/Nubile'
    CONIUGATO = 'coniugato', 'Coniugato/a'
    DIVORZIATO = 'divorziato', 'Divorziato/a'
    VEDOVO = 'vedovo', 'Vedovo/a'
    SEPARATO = 'separato', 'Separato/a'
    UNIONE_CIVILE = 'unione_civile', 'Unione Civile'


class RegimePatrimoniale(models.TextChoices):
    """Regime patrimoniale choices."""
    COMUNIONE_BENI = 'comunione_beni', 'Comunione dei beni'
    SEPARAZIONE_BENI = 'separazione_beni', 'Separazione dei beni'
    FONDO_PATRIMONIALE = 'fondo_patrimoniale', 'Fondo patrimoniale'
    NON_APPLICABILE = 'non_applicabile', 'Non applicabile'


class Sesso(models.TextChoices):
    """Sesso choices."""
    MASCHIO = 'M', 'Maschio'
    FEMMINA = 'F', 'Femmina'
    ALTRO = 'A', 'Altro'


class Cliente(models.Model):
    """Modello per i dati dettagliati dei clienti."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='cliente_profile',
        limit_choices_to={'role': UserRole.CLIENTE}
    )
    
    # Dati anagrafici
    nome = models.CharField(max_length=100)
    cognome = models.CharField(max_length=100)
    sesso = models.CharField(max_length=1, choices=Sesso.choices)
    data_nascita = models.DateField()
    luogo_nascita = models.CharField(max_length=200)
    codice_fiscale = models.CharField(max_length=16, unique=True)
    
    # Residenza
    indirizzo = models.CharField(max_length=255)
    civico = models.CharField(max_length=10)
    cap = models.CharField(max_length=10)
    citta = models.CharField(max_length=100)
    nazione = models.CharField(max_length=100, default='Italia')
    
    # Stato civile e patrimoniale
    stato_civile = models.CharField(max_length=30, choices=StatoCivile.choices)
    regime_patrimoniale = models.CharField(
        max_length=30, 
        choices=RegimePatrimoniale.choices,
        blank=True,
        null=True
    )
    
    # Contatti
    cellulare = models.CharField(max_length=20)
    mail = models.EmailField()
    
    # Allegati (documenti)
    carta_identita = models.FileField(
        upload_to='clienti/documenti/carta_identita/',
        blank=True,
        null=True
    )
    documento_codice_fiscale = models.FileField(
        upload_to='clienti/documenti/codice_fiscale/',
        blank=True,
        null=True
    )
    carta_sanitaria = models.FileField(
        upload_to='clienti/documenti/carta_sanitaria/',
        blank=True,
        null=True
    )
    passaporto = models.FileField(
        upload_to='clienti/documenti/passaporto/',
        blank=True,
        null=True
    )
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clienti'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clienti'
        ordering = ['cognome', 'nome']
    
    def __str__(self):
        return f"{self.cognome} {self.nome} - {self.codice_fiscale}"
    
    @property
    def nome_completo(self):
        return f"{self.nome} {self.cognome}"
    
    @property
    def indirizzo_completo(self):
        return f"{self.indirizzo}, {self.civico} - {self.cap} {self.citta} ({self.nazione})"


class TipologiaNotaio(models.TextChoices):
    """Tipologia di notaio."""
    NOTAIO_SINGOLO = 'notaio_singolo', 'Notaio Singolo'
    STUDIO_ASSOCIATO = 'studio_associato', 'Studio Associato'
    SOCIETA_NOTARILE = 'societa_notarile', 'Società Notarile'


class Notaio(models.Model):
    """Modello per i dati dettagliati dei notai."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notaio_profile',
        limit_choices_to={'role': UserRole.NOTAIO}
    )
    
    # Dati anagrafici
    nome = models.CharField(max_length=100)
    cognome = models.CharField(max_length=100)
    sesso = models.CharField(max_length=1, choices=Sesso.choices)
    data_nascita = models.DateField()
    luogo_nascita = models.CharField(max_length=200)
    codice_fiscale = models.CharField(max_length=16, unique=True)
    
    # Dati professionali
    numero_iscrizione_albo = models.CharField(max_length=50, unique=True)
    distretto_notarile = models.CharField(max_length=100)
    data_iscrizione_albo = models.DateField()
    sede_notarile = models.CharField(max_length=100)
    tipologia = models.CharField(
        max_length=30,
        choices=TipologiaNotaio.choices,
        default=TipologiaNotaio.NOTAIO_SINGOLO
    )
    
    # Studio notarile
    denominazione_studio = models.CharField(max_length=255, blank=True)
    partita_iva = models.CharField(max_length=11, blank=True, null=True, unique=True)
    
    # Indirizzo studio
    indirizzo_studio = models.CharField(max_length=255)
    civico = models.CharField(max_length=10)
    cap = models.CharField(max_length=10)
    citta = models.CharField(max_length=100)
    provincia = models.CharField(max_length=2)
    nazione = models.CharField(max_length=100, default='Italia')
    
    # Contatti
    telefono_studio = models.CharField(max_length=20)
    cellulare = models.CharField(max_length=20, blank=True)
    email_studio = models.EmailField()
    pec = models.EmailField(unique=True)
    sito_web = models.URLField(blank=True, null=True)
    
    # Coordinate geografiche
    latitudine = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True
    )
    longitudine = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True
    )
    
    # Orari ricevimento
    orari_ricevimento = models.JSONField(
        blank=True,
        null=True,
        help_text="Orari di ricevimento in formato JSON"
    )
    
    # Documenti
    documento_identita = models.FileField(
        upload_to='notai/documenti/identita/',
        blank=True,
        null=True
    )
    certificato_iscrizione_albo = models.FileField(
        upload_to='notai/documenti/albo/',
        blank=True,
        null=True
    )
    visura_camerale = models.FileField(
        upload_to='notai/documenti/visura/',
        blank=True,
        null=True
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notai'
        verbose_name = 'Notaio'
        verbose_name_plural = 'Notai'
        ordering = ['cognome', 'nome']
    
    def __str__(self):
        return f"Notaio {self.cognome} {self.nome} - {self.distretto_notarile}"
    
    @property
    def nome_completo(self):
        return f"{self.nome} {self.cognome}"
    
    @property
    def indirizzo_completo_studio(self):
        return f"{self.indirizzo_studio}, {self.civico} - {self.cap} {self.citta} ({self.provincia})"


class TipologiaPartner(models.TextChoices):
    """Tipologia di partner."""
    AGENZIA_IMMOBILIARE = 'agenzia_immobiliare', 'Agenzia Immobiliare'
    GEOMETRA = 'geometra', 'Geometra'
    ARCHITETTO = 'architetto', 'Architetto'
    CONSULENTE_LAVORO = 'consulente_lavoro', 'Consulente del Lavoro'
    COMMERCIALISTA = 'commercialista', 'Commercialista'
    PERITO = 'perito', 'Perito'


class Partner(models.Model):
    """Modello per i dati dettagliati dei partner."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='partner_profile',
        limit_choices_to={'role': UserRole.PARTNER}
    )
    
    # Tipologia
    tipologia = models.CharField(
        max_length=30,
        choices=TipologiaPartner.choices
    )
    
    # Dati aziendali
    ragione_sociale = models.CharField(max_length=255)
    partita_iva = models.CharField(max_length=11, blank=True, null=True, unique=True)
    codice_fiscale = models.CharField(max_length=16)
    
    # Indirizzo completo
    indirizzo = models.CharField(max_length=255)
    civico = models.CharField(max_length=10)
    cap = models.CharField(max_length=10)
    citta = models.CharField(max_length=100)
    provincia = models.CharField(max_length=2, blank=True)
    nazione = models.CharField(max_length=100, default='Italia')
    
    # Referente
    nome_referente = models.CharField(max_length=100)
    cognome_referente = models.CharField(max_length=100)
    
    # Contatti
    cellulare = models.CharField(max_length=20)
    telefono = models.CharField(max_length=20, blank=True)
    mail = models.EmailField()
    pec = models.EmailField(blank=True, null=True)
    sito_web = models.URLField(blank=True, null=True)
    
    # Allegati (documenti)
    visura_camera_commercio = models.FileField(
        upload_to='partners/documenti/camera_commercio/',
        blank=True,
        null=True
    )
    certificato_iscrizione_albo = models.FileField(
        upload_to='partners/documenti/albo/',
        blank=True,
        null=True
    )
    documento_identita_referente = models.FileField(
        upload_to='partners/documenti/identita/',
        blank=True,
        null=True
    )
    altri_documenti = models.FileField(
        upload_to='partners/documenti/altri/',
        blank=True,
        null=True
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'partners'
        verbose_name = 'Partner'
        verbose_name_plural = 'Partners'
        ordering = ['ragione_sociale']
    
    def __str__(self):
        return f"{self.ragione_sociale} - {self.get_tipologia_display()}"
    
    @property
    def referente_completo(self):
        return f"{self.nome_referente} {self.cognome_referente}"
    
    @property
    def indirizzo_completo(self):
        prov = f" ({self.provincia})" if self.provincia else ""
        return f"{self.indirizzo}, {self.civico} - {self.cap} {self.citta}{prov}, {self.nazione}"

