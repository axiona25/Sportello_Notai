"""
Serializers for authentication and user management.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, UserRole, SessionToken, Cliente, Notaio, Partner,
    StatoCivile, RegimePatrimoniale, Sesso, TipologiaNotaio, TipologiaPartner
)
from notaries.models import Notary, Client, Collaborator


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer with profile data."""
    
    notary_profile = serializers.SerializerMethodField()
    cliente_profile = serializers.SerializerMethodField()
    admin_profile = serializers.SerializerMethodField()
    partner_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'status', 'mfa_enabled', 'email_verified', 
                  'created_at', 'last_login', 'notary_profile', 'cliente_profile', 
                  'admin_profile', 'partner_profile']
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_notary_profile(self, obj):
        """Get notary profile data if user is a notary."""
        if obj.role == UserRole.NOTAIO and hasattr(obj, 'notary_profile'):
            from notaries.serializers import NotarySerializer
            return NotarySerializer(obj.notary_profile).data
        return None
    
    def get_cliente_profile(self, obj):
        """Get client profile data if user is a client."""
        if obj.role == UserRole.CLIENTE and hasattr(obj, 'client_profile'):
            # Usa il modello Client nuovo (notaries.models.Client)
            from notaries.serializers import ClientSerializer
            return ClientSerializer(obj.client_profile).data
        return None
    
    def get_admin_profile(self, obj):
        """Get admin profile data if user is admin."""
        if obj.role == UserRole.ADMIN:
            # Admin doesn't have a separate profile model yet
            return None
        return None
    
    def get_partner_profile(self, obj):
        """Get partner profile data if user is a partner."""
        if obj.role == UserRole.PARTNER:
            # Partner profile TODO
            return None
        return None


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True, min_length=12)
    role = serializers.ChoiceField(choices=UserRole.choices)
    
    # Optional profile data
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    studio_name = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Le password non coincidono")
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email già registrata")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        role = validated_data['role']
        
        # Extract profile data
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        studio_name = validated_data.pop('studio_name', '')
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            role=role
        )
        
        # Create profile based on role
        if role == UserRole.NOTAIO:
            Notary.objects.create(
                user=user,
                studio_name=studio_name or f"Studio {user.email}"
            )
        elif role == UserRole.CLIENTE:
            Client.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name
            )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email e password sono obbligatorie")
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Credenziali non valide")
        
        # Check if account is locked
        if user.is_account_locked():
            raise serializers.ValidationError("Account bloccato per troppi tentativi di login falliti")
        
        # Authenticate
        user = authenticate(email=email, password=password)
        
        if not user:
            # Increment failed attempts
            try:
                user = User.objects.get(email=email)
                user.increment_failed_login()
            except User.DoesNotExist:
                pass
            raise serializers.ValidationError("Credenziali non valide")
        
        # Reset failed attempts on successful login
        user.reset_failed_login()
        
        data['user'] = user
        return data


class MFASetupSerializer(serializers.Serializer):
    """Serializer for MFA setup."""
    
    def validate(self, data):
        user = self.context['request'].user
        if user.mfa_enabled:
            raise serializers.ValidationError("MFA già abilitato")
        return data


class MFAVerifySerializer(serializers.Serializer):
    """Serializer for MFA token verification."""
    
    token = serializers.CharField(min_length=6, max_length=6)
    
    def validate(self, data):
        user = self.context['request'].user
        
        if not user.mfa_enabled:
            raise serializers.ValidationError("MFA non abilitato")
        
        if not user.verify_mfa_token(data['token']):
            raise serializers.ValidationError("Token non valido")
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=12)
    new_password_confirm = serializers.CharField(write_only=True, min_length=12)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Le nuove password non coincidono")
        
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError("Password attuale non corretta")
        
        return data


# ============================================
# SERIALIZERS PER CLIENTI, NOTAI E PARTNERS
# ============================================

class ClienteSerializer(serializers.ModelSerializer):
    """Serializer per il modello Cliente."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    nome_completo = serializers.CharField(read_only=True)
    indirizzo_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'user', 'user_email', 'nome', 'cognome', 'nome_completo',
            'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale',
            'indirizzo', 'civico', 'cap', 'citta', 'nazione', 'indirizzo_completo',
            'stato_civile', 'regime_patrimoniale',
            'cellulare', 'mail',
            'carta_identita', 'documento_codice_fiscale', 'carta_sanitaria', 'passaporto',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'nome_completo', 'indirizzo_completo']
    
    def validate_codice_fiscale(self, value):
        """Valida il codice fiscale."""
        if len(value) != 16:
            raise serializers.ValidationError("Il codice fiscale deve essere di 16 caratteri")
        return value.upper()


class ClienteCreateSerializer(serializers.ModelSerializer):
    """Serializer per la creazione di un cliente con utente."""
    
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=12)
    
    class Meta:
        model = Cliente
        fields = [
            'email', 'password',
            'nome', 'cognome', 'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale',
            'indirizzo', 'civico', 'cap', 'citta', 'nazione',
            'stato_civile', 'regime_patrimoniale',
            'cellulare', 'mail',
            'carta_identita', 'documento_codice_fiscale', 'carta_sanitaria', 'passaporto'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email già registrata")
        return value
    
    def validate_codice_fiscale(self, value):
        if len(value) != 16:
            raise serializers.ValidationError("Il codice fiscale deve essere di 16 caratteri")
        value = value.upper()
        if Cliente.objects.filter(codice_fiscale=value).exists():
            raise serializers.ValidationError("Codice fiscale già registrato")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Crea l'utente
        user = User.objects.create_user(
            email=email,
            password=password,
            role=UserRole.CLIENTE
        )
        
        # Crea il profilo cliente
        cliente = Cliente.objects.create(user=user, **validated_data)
        return cliente


class NotaioSerializer(serializers.ModelSerializer):
    """Serializer per il modello Notaio."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    nome_completo = serializers.CharField(read_only=True)
    indirizzo_completo_studio = serializers.CharField(read_only=True)
    
    class Meta:
        model = Notaio
        fields = [
            'id', 'user', 'user_email', 'nome', 'cognome', 'nome_completo',
            'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale',
            'numero_iscrizione_albo', 'distretto_notarile', 'data_iscrizione_albo',
            'sede_notarile', 'tipologia',
            'denominazione_studio', 'partita_iva',
            'indirizzo_studio', 'civico', 'cap', 'citta', 'provincia', 'nazione',
            'indirizzo_completo_studio',
            'telefono_studio', 'cellulare', 'email_studio', 'pec', 'sito_web',
            'latitudine', 'longitudine', 'orari_ricevimento',
            'documento_identita', 'certificato_iscrizione_albo', 'visura_camerale',
            'is_active', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'nome_completo', 'indirizzo_completo_studio']
    
    def validate_codice_fiscale(self, value):
        if len(value) != 16:
            raise serializers.ValidationError("Il codice fiscale deve essere di 16 caratteri")
        return value.upper()
    
    def validate_partita_iva(self, value):
        if len(value) != 11:
            raise serializers.ValidationError("La partita IVA deve essere di 11 cifre")
        return value


class NotaioCreateSerializer(serializers.ModelSerializer):
    """Serializer per la creazione di un notaio con utente."""
    
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=12)
    
    class Meta:
        model = Notaio
        fields = [
            'email', 'password',
            'nome', 'cognome', 'sesso', 'data_nascita', 'luogo_nascita', 'codice_fiscale',
            'numero_iscrizione_albo', 'distretto_notarile', 'data_iscrizione_albo',
            'sede_notarile', 'tipologia',
            'denominazione_studio', 'partita_iva',
            'indirizzo_studio', 'civico', 'cap', 'citta', 'provincia', 'nazione',
            'telefono_studio', 'cellulare', 'email_studio', 'pec', 'sito_web',
            'latitudine', 'longitudine', 'orari_ricevimento',
            'documento_identita', 'certificato_iscrizione_albo', 'visura_camerale'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email già registrata")
        return value
    
    def validate_codice_fiscale(self, value):
        if len(value) != 16:
            raise serializers.ValidationError("Il codice fiscale deve essere di 16 caratteri")
        value = value.upper()
        if Notaio.objects.filter(codice_fiscale=value).exists():
            raise serializers.ValidationError("Codice fiscale già registrato")
        return value
    
    def validate_partita_iva(self, value):
        if len(value) != 11:
            raise serializers.ValidationError("La partita IVA deve essere di 11 cifre")
        if Notaio.objects.filter(partita_iva=value).exists():
            raise serializers.ValidationError("Partita IVA già registrata")
        return value
    
    def validate_numero_iscrizione_albo(self, value):
        if Notaio.objects.filter(numero_iscrizione_albo=value).exists():
            raise serializers.ValidationError("Numero iscrizione albo già registrato")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Crea l'utente
        user = User.objects.create_user(
            email=email,
            password=password,
            role=UserRole.NOTAIO
        )
        
        # Crea il profilo notaio
        notaio = Notaio.objects.create(user=user, **validated_data)
        return notaio


class PartnerSerializer(serializers.ModelSerializer):
    """Serializer per il modello Partner."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    referente_completo = serializers.CharField(read_only=True)
    indirizzo_completo = serializers.CharField(read_only=True)
    tipologia_display = serializers.CharField(source='get_tipologia_display', read_only=True)
    
    class Meta:
        model = Partner
        fields = [
            'id', 'user', 'user_email',
            'tipologia', 'tipologia_display',
            'ragione_sociale', 'partita_iva', 'codice_fiscale',
            'indirizzo', 'civico', 'cap', 'citta', 'provincia', 'nazione', 'indirizzo_completo',
            'nome_referente', 'cognome_referente', 'referente_completo',
            'cellulare', 'telefono', 'mail', 'pec', 'sito_web',
            'visura_camera_commercio', 'certificato_iscrizione_albo',
            'documento_identita_referente', 'altri_documenti',
            'is_active', 'is_verified',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'referente_completo', 'indirizzo_completo']
    
    def validate_partita_iva(self, value):
        if len(value) != 11:
            raise serializers.ValidationError("La partita IVA deve essere di 11 cifre")
        return value


class PartnerCreateSerializer(serializers.ModelSerializer):
    """Serializer per la creazione di un partner con utente."""
    
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=12)
    
    class Meta:
        model = Partner
        fields = [
            'email', 'password',
            'tipologia',
            'ragione_sociale', 'partita_iva', 'codice_fiscale',
            'indirizzo', 'civico', 'cap', 'citta', 'provincia', 'nazione',
            'nome_referente', 'cognome_referente',
            'cellulare', 'telefono', 'mail', 'pec', 'sito_web',
            'visura_camera_commercio', 'certificato_iscrizione_albo',
            'documento_identita_referente', 'altri_documenti'
        ]
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email già registrata")
        return value
    
    def validate_partita_iva(self, value):
        if len(value) != 11:
            raise serializers.ValidationError("La partita IVA deve essere di 11 cifre")
        if Partner.objects.filter(partita_iva=value).exists():
            raise serializers.ValidationError("Partita IVA già registrata")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Crea l'utente
        user = User.objects.create_user(
            email=email,
            password=password,
            role=UserRole.PARTNER
        )
        
        # Crea il profilo partner
        partner = Partner.objects.create(user=user, **validated_data)
        return partner

