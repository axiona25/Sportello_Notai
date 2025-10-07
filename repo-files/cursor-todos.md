# Cursor TO DO LIST

## Epics
- Backend/API (Auth, Notai, Atti, Documenti, PEC, RTC)
- Frontend Web (Vetrina notai, Dashboard notaio, Atti, Viewer documenti, Survey)
- Mobile (Scanner assegni, Upload, Accesso cartelle)
- Security (E2E, KMS, MFA, Audit)
- DevOps (CI/CD, IaC, Monitoring)

## Sprint 1 — Setup & Auth
- [ ] Django project + Postgres + Auth (Argon2, JWT)
- [ ] React Vite app + Login/Registrazione
- [ ] Flutter skeleton + login

## Sprint 2 — Vetrina Notai & Agenda
- [ ] API notai (profili, servizi, tariffe, rating)
- [ ] Frontend lista/filtri, dettaglio notaio, reviews
- [ ] Agenda: disponibilità e prenotazione

## Sprint 3 — Documenti & Cartelle cifrate
- [ ] Modello atti/documenti + sottocartelle
- [ ] Upload E2E (WebCrypto/Mobile secure storage)
- [ ] Viewer documenti e permessi

## Sprint 4 — Audio/Video + Co-authoring
- [ ] Integrazione SFU (LiveKit/Janus) + signaling
- [ ] Real-time share (CRDT/OT)

## Sprint 5 — Firma/Timbro/Marca + PEC automatica
- [ ] Integrazione firma qualificata (PAdES/XAdES)
- [ ] Marca temporale + timbro digitale
- [ ] Cliente PEC: template, auto-compose, invio

## Sprint 6 — Dashboard & Mappe
- [ ] Card appuntamenti/alert/scadenze
- [ ] Mappa clienti/immobili (3D, Street View/tilt), overlay certificazioni

## Sprint 7 — Conservazione & Audit
- [ ] Export verso conservatore
- [ ] Audit completo + reportistica
