"""
E2E Encryption service with KMS integration.
"""
import boto3
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from django.conf import settings
import os


class EncryptionService:
    """Service for E2E encryption with key management."""
    
    def __init__(self):
        if settings.AWS_KMS_KEY_ID:
            self.kms_client = boto3.client('kms', region_name=settings.AWS_S3_REGION_NAME)
        else:
            self.kms_client = None
    
    def generate_symmetric_key(self, key_size=256):
        """Generate AES symmetric key."""
        return os.urandom(key_size // 8)
    
    def encrypt_aes_gcm(self, data, key):
        """Encrypt data with AES-256-GCM."""
        iv = os.urandom(12)  # 96-bit IV for GCM
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(data) + encryptor.finalize()
        
        return {
            'ciphertext': base64.b64encode(ciphertext).decode(),
            'iv': base64.b64encode(iv).decode(),
            'tag': base64.b64encode(encryptor.tag).decode()
        }
    
    def decrypt_aes_gcm(self, encrypted_data, key):
        """Decrypt AES-256-GCM encrypted data."""
        ciphertext = base64.b64decode(encrypted_data['ciphertext'])
        iv = base64.b64decode(encrypted_data['iv'])
        tag = base64.b64decode(encrypted_data['tag'])
        
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        return decryptor.update(ciphertext) + decryptor.finalize()
    
    def wrap_key_rsa(self, key, public_key_pem):
        """Wrap symmetric key with RSA public key."""
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode(),
            backend=default_backend()
        )
        
        wrapped_key = public_key.encrypt(
            key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return base64.b64encode(wrapped_key).decode()
    
    def unwrap_key_rsa(self, wrapped_key, private_key_pem):
        """Unwrap symmetric key with RSA private key."""
        private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )
        
        key = private_key.decrypt(
            base64.b64decode(wrapped_key),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return key
    
    def generate_rsa_keypair(self, key_size=4096):
        """Generate RSA keypair for key wrapping."""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        public_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
        
        return {
            'private_key': private_pem,
            'public_key': public_pem
        }
    
    def kms_encrypt(self, plaintext):
        """Encrypt data using AWS KMS."""
        if not self.kms_client:
            raise Exception("KMS not configured")
        
        response = self.kms_client.encrypt(
            KeyId=settings.AWS_KMS_KEY_ID,
            Plaintext=plaintext
        )
        
        return base64.b64encode(response['CiphertextBlob']).decode()
    
    def kms_decrypt(self, ciphertext):
        """Decrypt data using AWS KMS."""
        if not self.kms_client:
            raise Exception("KMS not configured")
        
        response = self.kms_client.decrypt(
            CiphertextBlob=base64.b64decode(ciphertext)
        )
        
        return response['Plaintext']
    
    def compute_hash(self, data):
        """Compute SHA-256 hash."""
        if isinstance(data, str):
            data = data.encode()
        return hashlib.sha256(data).hexdigest()


# Singleton instance
encryption_service = EncryptionService()

