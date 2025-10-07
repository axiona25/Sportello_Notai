"""
Custom exception handler for DRF.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('django')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that adds additional error information.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Log the exception
    logger.error(f"API Exception: {exc}", exc_info=True, extra={'context': context})
    
    if response is not None:
        # Add custom error data
        custom_response_data = {
            'error': True,
            'message': str(exc),
            'detail': response.data,
            'status_code': response.status_code
        }
        response.data = custom_response_data
    
    return response


class SecurityException(Exception):
    """Exception per problemi di sicurezza."""
    pass


class EncryptionException(Exception):
    """Exception per problemi di cifratura."""
    pass


class SignatureException(Exception):
    """Exception per problemi di firma digitale."""
    pass


class PECException(Exception):
    """Exception per problemi con PEC."""
    pass


class RateLimitException(Exception):
    """Exception per rate limiting."""
    pass

