# Architettura (alto livello)

Componenti principali:
- **Frontend Web (React/Vite)** e **Mobile (Flutter)**.
- **Backend (Django + PostgreSQL)** con API REST.
- **Media/RTC**: WebRTC SFU (es. LiveKit/Janus/Mediasoup) per audio/video 1:1 e 1:N.
- **Storage cifrato**: blob (S3/GCS/Azure) + cifratura applicativa E2E.
- **PEC Gateway**: integrazione con provider PEC tramite API/SMTP sicuro.
- **Firma digitale / Marca temporale / Timbro digitale**: integrazione con provider qualificati (eIDAS).
- **Conservazione sostitutiva**: integrazione con conservatore accreditato AgID.

Flussi chiave:
- **E2E documenti**: cifratura lato client (AES-256) + wrapping chiave con RSA/ECC; metadati con policy RBAC/ABAC.
- **Co-authoring**: canale RTC + CRDT/OT per editing collaborativo.
- **PEC automatica**: trigger post-firma → composizione messaggio PEC + allegati firmati + destinatari da portafoglio clienti.

Scalabilità: microservizi opzionali, code (RQ/Celery), cache (Redis), autoscaling.
