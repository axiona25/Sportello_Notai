# Data Model (sintesi PostgreSQL)

Tabelle principali (estratto):
- **users** (id, email, ruolo, mfa, stato)
- **notaries** (id utente, vetrina: nome studio, copertina, servizi, tariffe)
- **reviews** (id, atto_id, cliente_id, rating 1..5, testo, timestamp)
- **clients** (id, anagrafica, indirizzi pec, documenti anagrafici)
- **acts** (id, categoria, protocollo, notaio_id, stato, banca_coinvolta?)
- **act_documents** (id, act_id, categoria_sottocartella, filename, blob_url, ciphertext_ref, version, audit)
- **appointments** (id, notaio_id, cliente_id, stato, inizio, fine)
- **pec_messages** (id, act_id, destinatari, subject, body_template_id, stato_invio, log)
- **audit_logs** (id, actor, action, resource, timestamp, ip, result)

Indicizzazione per sottocartelle per categoria (anagrafica, banca, permessi, certificazioni, ecc.).
