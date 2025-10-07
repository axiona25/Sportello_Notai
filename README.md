# Sportello Notai — Monorepo (Docs + TODO per Cursor)

Questo repository contiene **documentazione, roadmap, specifiche e template** per sviluppare la piattaforma *Sportello Notai* (web, mobile, backend).  
> **Nota Sicurezza:** Non memorizzare token/credenziali nel repo. Usa GitHub Secrets/Deploy Keys/Vault.

## Struttura
```
Sportello_Notai/
├─ docs/
├─ backend/
├─ frontend/
├─ mobile/
├─ repo-files/
├─ governance/
├─ examples/
└─ .github/
```
- **docs/**: architettura, sicurezza, data model, contratti API.
- **backend/**: linee guida Django + requirements.
- **frontend/**: linee guida React (Vite).
- **mobile/**: linee guida Flutter.
- **repo-files/**: `cursor-todos.md`, template CI/CD, IaC placeholders.
- **governance/**: policy di privacy e conservazione a norma.
- **.github/**: workflow Actions + template issue.

## Avvio rapido
1. **Clona** il repo nel tuo ambiente.
2. **Configura i secrets** in GitHub: `CURSOR_TOKEN`, eventuali chiavi cloud.
3. Segui i README in **backend/**, **frontend/** e **mobile/** per bootstrap dei progetti.

## Roadmap sintetica
- M0: setup e auth base
- M1: profilo notaio + vetrina + reviews
- M2: document management cifrato + upload da mobile
- M3: audio/video + real-time co-authoring
- M4: firma digitale + timbro + PEC automatica
- M5: dashboard notaio + mappa 3D
- M6: conservazione a norma + audit logging
- M7: QA, security review, pen-test

---

**Ultimo aggiornamento:** 2025-10-07
