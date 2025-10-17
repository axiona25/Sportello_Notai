"""
Script di test per le API dei ruoli utente (Cliente, Notaio, Partner).

Questo script può essere utilizzato per testare le funzionalità base del sistema.
Prima di eseguirlo, assicurati che il server Django sia in esecuzione.

Uso:
    python test_roles_api.py
"""

import requests
import json
from datetime import date

# Configurazione
BASE_URL = "http://localhost:8001/api"
headers = {"Content-Type": "application/json"}

def print_section(title):
    """Stampa una sezione del test."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def print_result(name, response):
    """Stampa il risultato di una richiesta."""
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"\n{status} {name}")
    print(f"Status Code: {response.status_code}")
    if response.status_code in [200, 201]:
        try:
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)[:500]}...")
        except:
            print(f"Response: {response.text[:200]}")
    else:
        print(f"Error: {response.text}")
    return response

def test_register_and_login():
    """Test registrazione e login."""
    print_section("TEST 1: Registrazione e Login")
    
    # Registrazione admin per i test
    register_data = {
        "email": "admin@test.com",
        "password": "TestPassword123!",
        "password_confirm": "TestPassword123!",
        "role": "admin"
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/register/",
        json=register_data,
        headers=headers
    )
    print_result("Registrazione Admin", response)
    
    # Login
    login_data = {
        "email": "admin@test.com",
        "password": "TestPassword123!"
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/login/",
        json=login_data,
        headers=headers
    )
    result = print_result("Login Admin", response)
    
    if result.status_code == 200:
        return result.json().get('access')
    return None

def test_create_cliente(token):
    """Test creazione cliente."""
    print_section("TEST 2: Creazione Cliente")
    
    if not token:
        print("❌ Token non disponibile, skip test")
        return None
    
    cliente_data = {
        "email": "mario.rossi@test.com",
        "password": "ClientePassword123!",
        "nome": "Mario",
        "cognome": "Rossi",
        "sesso": "M",
        "data_nascita": "1990-05-15",
        "luogo_nascita": "Roma",
        "codice_fiscale": "RSSMRA90E15H501T",
        "indirizzo": "Via Roma",
        "civico": "10",
        "cap": "00100",
        "citta": "Roma",
        "nazione": "Italia",
        "stato_civile": "celibe_nubile",
        "regime_patrimoniale": "non_applicabile",
        "cellulare": "+39 333 1234567",
        "mail": "mario.rossi@test.com"
    }
    
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/clienti/",
        json=cliente_data,
        headers=auth_headers
    )
    result = print_result("Creazione Cliente", response)
    
    if result.status_code == 201:
        return result.json().get('id')
    return None

def test_create_notaio(token):
    """Test creazione notaio."""
    print_section("TEST 3: Creazione Notaio")
    
    if not token:
        print("❌ Token non disponibile, skip test")
        return None
    
    notaio_data = {
        "email": "notaio.bianchi@test.com",
        "password": "NotaioPassword123!",
        "nome": "Giuseppe",
        "cognome": "Bianchi",
        "sesso": "M",
        "data_nascita": "1975-03-20",
        "luogo_nascita": "Milano",
        "codice_fiscale": "BNCGPP75C20F205X",
        "numero_iscrizione_albo": "MI12345",
        "distretto_notarile": "Milano",
        "data_iscrizione_albo": "2000-01-15",
        "sede_notarile": "Milano",
        "tipologia": "notaio_singolo",
        "denominazione_studio": "Studio Notarile Bianchi",
        "partita_iva": "12345678901",
        "indirizzo_studio": "Corso Buenos Aires",
        "civico": "55",
        "cap": "20124",
        "citta": "Milano",
        "provincia": "MI",
        "nazione": "Italia",
        "telefono_studio": "+39 02 12345678",
        "cellulare": "+39 333 9876543",
        "email_studio": "studio@bianchi.it",
        "pec": "notaio.bianchi@pec.it",
        "sito_web": "https://www.studionotarilebianchi.it"
    }
    
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/notai/",
        json=notaio_data,
        headers=auth_headers
    )
    result = print_result("Creazione Notaio", response)
    
    if result.status_code == 201:
        return result.json().get('id')
    return None

def test_create_partner(token):
    """Test creazione partner."""
    print_section("TEST 4: Creazione Partner")
    
    if not token:
        print("❌ Token non disponibile, skip test")
        return None
    
    partner_data = {
        "email": "immobiliare@test.com",
        "password": "PartnerPassword123!",
        "tipologia": "agenzia_immobiliare",
        "ragione_sociale": "Immobiliare Casa Srl",
        "partita_iva": "98765432109",
        "codice_fiscale": "98765432109",
        "indirizzo": "Via Garibaldi",
        "civico": "25",
        "cap": "20121",
        "citta": "Milano",
        "provincia": "MI",
        "nazione": "Italia",
        "nome_referente": "Laura",
        "cognome_referente": "Verdi",
        "cellulare": "+39 333 5555555",
        "telefono": "+39 02 87654321",
        "mail": "info@immobiliarecasa.it",
        "pec": "immobiliarecasa@pec.it",
        "sito_web": "https://www.immobiliarecasa.it"
    }
    
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(
        f"{BASE_URL}/accounts/partners/",
        json=partner_data,
        headers=auth_headers
    )
    result = print_result("Creazione Partner", response)
    
    if result.status_code == 201:
        return result.json().get('id')
    return None

def test_list_resources(token):
    """Test lista risorse."""
    print_section("TEST 5: Lista Risorse")
    
    if not token:
        print("❌ Token non disponibile, skip test")
        return
    
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {token}"
    }
    
    # Lista clienti
    response = requests.get(
        f"{BASE_URL}/accounts/clienti/",
        headers=auth_headers
    )
    print_result("Lista Clienti", response)
    
    # Lista notai
    response = requests.get(
        f"{BASE_URL}/accounts/notai/",
        headers=auth_headers
    )
    print_result("Lista Notai", response)
    
    # Lista partners
    response = requests.get(
        f"{BASE_URL}/accounts/partners/",
        headers=auth_headers
    )
    print_result("Lista Partners", response)

def test_search_and_filters(token):
    """Test ricerca e filtri."""
    print_section("TEST 6: Ricerca e Filtri")
    
    if not token:
        print("❌ Token non disponibile, skip test")
        return
    
    auth_headers = {
        **headers,
        "Authorization": f"Bearer {token}"
    }
    
    # Ricerca cliente per cognome
    response = requests.get(
        f"{BASE_URL}/accounts/clienti/?search=Rossi",
        headers=auth_headers
    )
    print_result("Ricerca Cliente 'Rossi'", response)
    
    # Filtro notai per città
    response = requests.get(
        f"{BASE_URL}/accounts/notai/?citta=Milano",
        headers=auth_headers
    )
    print_result("Filtro Notai Milano", response)
    
    # Filtro partner per tipologia
    response = requests.get(
        f"{BASE_URL}/accounts/partners/?tipologia=agenzia_immobiliare",
        headers=auth_headers
    )
    print_result("Filtro Partner Agenzia Immobiliare", response)

def main():
    """Esegue tutti i test."""
    print("\n" + "🚀 " * 20)
    print("  TEST SISTEMA RUOLI UTENTI - SPORTELLO NOTAI")
    print("🚀 " * 20)
    
    # Test 1: Registrazione e Login
    token = test_register_and_login()
    
    if not token:
        print("\n❌ Impossibile proseguire senza token di autenticazione")
        return
    
    # Test 2-4: Creazione profili
    cliente_id = test_create_cliente(token)
    notaio_id = test_create_notaio(token)
    partner_id = test_create_partner(token)
    
    # Test 5: Lista risorse
    test_list_resources(token)
    
    # Test 6: Ricerca e filtri
    test_search_and_filters(token)
    
    # Riepilogo
    print_section("RIEPILOGO")
    print(f"""
    ✅ Token autenticazione: {"OK" if token else "FAILED"}
    ✅ Cliente creato: {cliente_id if cliente_id else "FAILED"}
    ✅ Notaio creato: {notaio_id if notaio_id else "FAILED"}
    ✅ Partner creato: {partner_id if partner_id else "FAILED"}
    
    Tutti i test sono stati eseguiti!
    Controlla i risultati sopra per verificare che tutto funzioni correttamente.
    """)

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERRORE: Impossibile connettersi al server.")
        print("Assicurati che il server Django sia in esecuzione su http://localhost:8001")
    except Exception as e:
        print(f"\n❌ ERRORE: {str(e)}")

