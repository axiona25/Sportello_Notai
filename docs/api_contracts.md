# Contratti API (estratto)

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/mfa/verify`

## Notai
- `GET /api/notaries` (lista vetrine + rating)
- `GET /api/notaries/{id}`
- `POST /api/notaries/{id}/services` (notaio)
- `GET /api/notaries/{id}/reviews` / `POST /api/acts/{id}/review`

## Atti
- `POST /api/acts` (crea atto con categoria: compravendita, mutuo, testamento, costituzione, …)
- `GET /api/acts/{id}`
- `POST /api/acts/{id}/close` (trigger survey obbligatoria → sblocco cartella finale)

## Documenti
- `POST /api/acts/{id}/documents` (upload cifrato E2E)
- `GET /api/acts/{id}/documents?category=…`
- `POST /api/acts/{id}/documents/{docId}/stamp` (timbro/marca)

## Appuntamenti
- `GET /api/appointments?range=week|day`
- `POST /api/appointments`

## PEC
- `POST /api/acts/{id}/pec/compose` (auto-compose da template)
- `POST /api/acts/{id}/pec/send`

## A/V
- `POST /api/rtc/sessions` (crea stanza 1:1 o 1:N)
- `POST /api/rtc/sessions/{id}/share` (condivisione documento live)
