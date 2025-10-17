"""
Django settings for Sportello Notai project.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',  # Per supporto geospaziale (coordinates)
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # JWT blacklist
    'corsheaders',
    'drf_spectacular',
    'django_redis',
    'storages',
    'defender',  # Brute force protection
    
    # Local apps
    'accounts.apps.AccountsConfig',
    'notaries.apps.NotariesConfig',
    'acts.apps.ActsConfig',
    'documents.apps.DocumentsConfig',
    'appointments.apps.AppointmentsConfig',
    'reviews.apps.ReviewsConfig',
    'pec.apps.PecConfig',
    'rtc.apps.RtcConfig',
    'signatures.apps.SignaturesConfig',
    'conservation.apps.ConservationConfig',
    'audit.apps.AuditConfig',
    'ui_elements.apps.UiElementsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.gzip.GZipMiddleware',  # Response compression
    'corsheaders.middleware.CorsMiddleware',  # CORS deve essere prima di CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'defender.middleware.FailedLoginMiddleware',  # Brute force protection
    'audit.middleware.AuditMiddleware',  # Custom middleware per audit logging
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # PostGIS per supporto geospaziale
        'NAME': os.getenv('DB_NAME', 'sportello_notai'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'options': '-c search_path=public'
        }
    }
}

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Password Hashing - Argon2
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Internationalization
LANGUAGE_CODE = 'it-it'
TIME_ZONE = 'Europe/Rome'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================
# REST FRAMEWORK
# ============================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '10/minute',
        'upload': '20/hour',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# ============================================
# JWT SETTINGS
# ============================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', 30))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRE_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': os.getenv('JWT_ALGORITHM', 'HS256'),
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', SECRET_KEY),
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': 'sportello-notai',
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# ============================================
# CORS SETTINGS
# ============================================

CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3001,http://localhost:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# ============================================
# CACHE & REDIS
# ============================================

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session storage in Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ============================================
# CELERY
# ============================================

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# ============================================
# EMAIL SETTINGS
# ============================================

EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@sportello-notai.com')

# ============================================
# AWS S3 / STORAGE SETTINGS
# ============================================

USE_S3 = os.getenv('USE_S3', 'False') == 'True'

if USE_S3:
    # AWS Settings
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'eu-west-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    
    # S3 File Upload Settings
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'private'
    AWS_S3_ENCRYPTION = True
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# ============================================
# KMS (Key Management Service)
# ============================================

AWS_KMS_KEY_ID = os.getenv('AWS_KMS_KEY_ID', '')

# ============================================
# PEC SETTINGS
# ============================================

PEC_PROVIDER_API_URL = os.getenv('PEC_PROVIDER_API_URL', '')
PEC_PROVIDER_API_KEY = os.getenv('PEC_PROVIDER_API_KEY', '')
PEC_SENDER_EMAIL = os.getenv('PEC_SENDER_EMAIL', '')
PEC_MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024  # 50MB

# ============================================
# FIRMA DIGITALE SETTINGS
# ============================================

SIGNATURE_PROVIDER = os.getenv('SIGNATURE_PROVIDER', 'infocert')
SIGNATURE_PROVIDER_API_URL = os.getenv('SIGNATURE_PROVIDER_API_URL', '')
SIGNATURE_PROVIDER_API_KEY = os.getenv('SIGNATURE_PROVIDER_API_KEY', '')

# ============================================
# RTC (Real-Time Communication) SETTINGS
# ============================================

RTC_SERVER_URL = os.getenv('RTC_SERVER_URL', '')
RTC_SERVER_API_KEY = os.getenv('RTC_SERVER_API_KEY', '')

# ============================================
# CONSERVAZIONE SOSTITUTIVA
# ============================================

CONSERVATOR_PROVIDER = os.getenv('CONSERVATOR_PROVIDER', '')
CONSERVATOR_API_URL = os.getenv('CONSERVATOR_API_URL', '')
CONSERVATOR_API_KEY = os.getenv('CONSERVATOR_API_KEY', '')

# ============================================
# SECURITY SETTINGS
# ============================================

# HTTPS
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

# HSTS
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# CSRF
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# Session
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 3600  # 1 hour

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'",)

# ============================================
# AUDIT & LOGGING
# ============================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose'
        },
        'security': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'security': {
            'handlers': ['security'],
            'level': 'WARNING',
            'propagate': False,
        },
        'audit': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Crea directory logs se non esiste
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# ============================================
# DRF SPECTACULAR (API Documentation)
# ============================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'Sportello Notai API',
    'DESCRIPTION': 'API completa per la piattaforma Sportello Notai',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api',
}

# ============================================
# RATE LIMITING
# ============================================

# Login attempt limits
MAX_LOGIN_ATTEMPTS = 5
LOGIN_ATTEMPT_TIMEOUT = 300  # 5 minutes

# API Rate Limits (requests per minute)
API_RATE_LIMIT_AUTH = '10/min'  # Auth endpoints
API_RATE_LIMIT_DEFAULT = '60/min'  # Default endpoints
API_RATE_LIMIT_UPLOAD = '20/min'  # Upload endpoints

# ============================================
# MFA SETTINGS
# ============================================

MFA_ISSUER_NAME = 'Sportello Notai'
MFA_TOKEN_VALIDITY = 30  # seconds
OTP_LENGTH = 6

# ============================================
# DOCUMENT E2E ENCRYPTION
# ============================================

# Algoritmi supportati
SUPPORTED_ENCRYPTION_ALGORITHMS = ['AES-256-GCM', 'AES-256-CBC']
SUPPORTED_KEY_WRAPPING_ALGORITHMS = ['RSA-OAEP', 'ECDH-ES+A256KW']

# Dimensione chiavi
RSA_KEY_SIZE = 4096
ECC_CURVE = 'P-256'

# ============================================
# FILE UPLOAD LIMITS
# ============================================

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_MAX_SIZE = 100 * 1024 * 1024  # 100MB per documenti

# ============================================
# CUSTOM SETTINGS
# ============================================

# Survey obbligatoria post-atto
SURVEY_REQUIRED_FOR_ACT_CLOSURE = True

# Review richiesta rating minimo
REVIEW_MIN_RATING = 1
REVIEW_MAX_RATING = 5

# Retention policies (giorni)
AUDIT_LOG_RETENTION_DAYS = 730  # 24 mesi
SECURITY_EVENT_RETENTION_DAYS = 730
SESSION_TOKEN_RETENTION_DAYS = 90

# Notifiche
ENABLE_EMAIL_NOTIFICATIONS = True
ENABLE_PUSH_NOTIFICATIONS = True

# ============================================
# DJANGO DEFENDER (Brute Force Protection)
# ============================================

DEFENDER_LOGIN_FAILURE_LIMIT = 5
DEFENDER_LOCKOUT_TEMPLATE = 'defender/lockout.html'
DEFENDER_COOLOFF_TIME = 300  # 5 minutes
DEFENDER_BEHIND_REVERSE_PROXY = True
DEFENDER_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# ============================================
# ADDITIONAL SECURITY HEADERS
# ============================================

SECURE_REFERRER_POLICY = 'same-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# Session Security
SESSION_SAVE_EVERY_REQUEST = True  # Rinnova sessione ad ogni richiesta
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

