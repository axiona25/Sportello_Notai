# Sicurezza e Cifratura

## Cifratura End-to-End (E2E)
- Per ogni documento si genera una **chiave simmetrica AES-256**.
- La chiave viene **wrappata** con chiave pubblica del/i destinatario/i (**RSA-4096** o **ECC P-256**).
- Il server conserva solo ciphertext + metadati; non può decifrare.
- Trasporto: **TLS 1.3** + HSTS; CSP, SRI, SameSite, ecc.

## Gestione chiavi
- Master keys in **KMS** (AWS KMS / GCP KMS / Azure Key Vault).
- Rotazione periodica chiavi; audit trail.
- Su mobile: **Secure Enclave/KeyChain (iOS)**, **Android Keystore**. Su web: WebCrypto + storage sicuro protetto da sessione.

## Autenticazione e Ruoli
- Django + JWT/OIDC (opzionale SSO).
- MFA/OTP; password hashing Argon2.
- Ruoli: **Notaio**, **Collaboratore**, **Cliente**, **Partner** (RBAC).

## Firma, Marca, Timbro digitale
- Integrazione con provider qualificati eIDAS (CAdES/XAdES/PAdES).
- Marca temporale (RFC 3161) e **timbro digitale** integrabile via API del provider.

## PEC
- Composizione automatica post-firma.
- Indirizzi PEC da portafoglio clienti.
- Log degli invii, retry, quarantena allegati oversize.
