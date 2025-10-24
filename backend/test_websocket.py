#!/usr/bin/env python3
"""
Test WebSocket Live per PDF Collaboration

Simula 2 client (Notaio e Cliente) connessi alla stessa room PDF
e verifica la sincronizzazione dei messaggi.
"""

import asyncio
import json
import websockets
from datetime import datetime

# Colori per output
class Colors:
    NOTARY = '\033[94m'  # Blue
    CLIENT = '\033[92m'  # Green
    SUCCESS = '\033[92m'  # Green
    ERROR = '\033[91m'  # Red
    INFO = '\033[93m'  # Yellow
    RESET = '\033[0m'

def log(color, prefix, message):
    """Log colorato con timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"{color}[{timestamp}] {prefix}{Colors.RESET} {message}")

async def notary_client(appointment_id):
    """
    Simula un Notaio connesso al PDF
    - Invia comandi (PAGE_CHANGE, ZOOM_CHANGE, etc.)
    - Riceve conferme
    """
    uri = f"ws://localhost:8000/ws/pdf/{appointment_id}/"
    
    log(Colors.NOTARY, "🔵 NOTAIO", f"Connessione a {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            log(Colors.SUCCESS, "🔵 NOTAIO", "✅ CONNESSO!")
            
            # 1. JOIN message
            join_msg = {
                "type": "JOIN",
                "userId": 1,
                "userName": "Notaio Studio Legale"
            }
            await websocket.send(json.dumps(join_msg))
            log(Colors.NOTARY, "🔵 NOTAIO", f"📤 Inviato: JOIN")
            
            # Ricevi risposta CONNECTION_SUCCESS
            response = await websocket.recv()
            data = json.loads(response)
            log(Colors.NOTARY, "🔵 NOTAIO", f"📥 Ricevuto: {data.get('type')} - {data.get('message', '')}")
            
            # 2. Cambio pagina
            await asyncio.sleep(1)
            page_msg = {
                "type": "PAGE_CHANGE",
                "page": 5,
                "userId": 1
            }
            await websocket.send(json.dumps(page_msg))
            log(Colors.NOTARY, "🔵 NOTAIO", f"📤 Inviato: PAGE_CHANGE → pagina 5")
            
            # 3. Zoom
            await asyncio.sleep(1)
            zoom_msg = {
                "type": "ZOOM_CHANGE",
                "zoom": 150,
                "userId": 1
            }
            await websocket.send(json.dumps(zoom_msg))
            log(Colors.NOTARY, "🔵 NOTAIO", f"📤 Inviato: ZOOM_CHANGE → 150%")
            
            # 4. Rotazione
            await asyncio.sleep(1)
            rotation_msg = {
                "type": "ROTATION_CHANGE",
                "rotation": 90,
                "userId": 1
            }
            await websocket.send(json.dumps(rotation_msg))
            log(Colors.NOTARY, "🔵 NOTAIO", f"📤 Inviato: ROTATION_CHANGE → 90°")
            
            # 5. Annotazione
            await asyncio.sleep(1)
            annotation_msg = {
                "type": "ANNOTATION_ADD",
                "annotation": {
                    "id": "ann_001",
                    "page": 5,
                    "type": "highlight",
                    "x": 20,
                    "y": 30,
                    "width": 40,
                    "height": 3,
                    "color": "#FFEB3B"
                },
                "userId": 1
            }
            await websocket.send(json.dumps(annotation_msg))
            log(Colors.NOTARY, "🔵 NOTAIO", f"📤 Inviato: ANNOTATION_ADD (highlight)")
            
            # Attendi un po' per vedere i messaggi del cliente
            await asyncio.sleep(3)
            
            log(Colors.NOTARY, "🔵 NOTAIO", "👋 Disconnessione...")
            
    except Exception as e:
        log(Colors.ERROR, "🔵 NOTAIO", f"❌ ERRORE: {e}")

async def client_client(appointment_id):
    """
    Simula un Cliente connesso al PDF
    - Riceve comandi dal notaio
    - Sincronizza la sua vista
    """
    uri = f"ws://localhost:8000/ws/pdf/{appointment_id}/"
    
    # Attendi un po' prima di connetterti (dopo il notaio)
    await asyncio.sleep(0.5)
    
    log(Colors.CLIENT, "🟢 CLIENTE", f"Connessione a {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            log(Colors.SUCCESS, "🟢 CLIENTE", "✅ CONNESSO!")
            
            # JOIN message
            join_msg = {
                "type": "JOIN",
                "userId": 2,
                "userName": "Mario Rossi"
            }
            await websocket.send(json.dumps(join_msg))
            log(Colors.CLIENT, "🟢 CLIENTE", f"📤 Inviato: JOIN")
            
            # Ascolta tutti i messaggi in arrivo
            messages_received = 0
            target_messages = 5  # CONNECTION_SUCCESS + 4 azioni notaio
            
            try:
                while messages_received < target_messages:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(response)
                    msg_type = data.get('type', 'UNKNOWN')
                    
                    if msg_type == 'CONNECTION_SUCCESS':
                        log(Colors.CLIENT, "🟢 CLIENTE", f"📥 {msg_type}")
                    elif msg_type == 'USER_JOINED':
                        log(Colors.CLIENT, "🟢 CLIENTE", f"📥 {msg_type}: {data.get('userName')} entrato")
                    elif msg_type == 'PAGE_CHANGE':
                        log(Colors.SUCCESS, "🟢 CLIENTE", f"📥 ✨ SINCRONIZZATO: Pagina → {data.get('page')}")
                    elif msg_type == 'ZOOM_CHANGE':
                        log(Colors.SUCCESS, "🟢 CLIENTE", f"📥 ✨ SINCRONIZZATO: Zoom → {data.get('zoom')}%")
                    elif msg_type == 'ROTATION_CHANGE':
                        log(Colors.SUCCESS, "🟢 CLIENTE", f"📥 ✨ SINCRONIZZATO: Rotazione → {data.get('rotation')}°")
                    elif msg_type == 'ANNOTATION_ADD':
                        ann = data.get('annotation', {})
                        log(Colors.SUCCESS, "🟢 CLIENTE", f"📥 ✨ SINCRONIZZATO: Annotazione {ann.get('type')} su pagina {ann.get('page')}")
                    else:
                        log(Colors.CLIENT, "🟢 CLIENTE", f"📥 {msg_type}")
                    
                    messages_received += 1
                    
            except asyncio.TimeoutError:
                log(Colors.CLIENT, "🟢 CLIENTE", "⏱️ Timeout - nessun altro messaggio")
            
            log(Colors.CLIENT, "🟢 CLIENTE", f"✅ Ricevuti {messages_received} messaggi")
            log(Colors.CLIENT, "🟢 CLIENTE", "👋 Disconnessione...")
            
    except Exception as e:
        log(Colors.ERROR, "🟢 CLIENTE", f"❌ ERRORE: {e}")

async def run_test():
    """
    Esegue il test completo:
    - Avvia Notaio e Cliente in parallelo
    - Notaio invia comandi
    - Cliente riceve e sincronizza
    """
    appointment_id = 999  # ID appuntamento di test
    
    print("=" * 80)
    print("🧪 TEST WEBSOCKET LIVE - PDF COLLABORATION")
    print("=" * 80)
    print()
    log(Colors.INFO, "📡 TEST", f"Endpoint: ws://localhost:8000/ws/pdf/{appointment_id}/")
    log(Colors.INFO, "📡 TEST", "Avvio 2 client: Notaio (guida) + Cliente (segue)")
    print()
    
    # Esegui notaio e cliente in parallelo
    await asyncio.gather(
        notary_client(appointment_id),
        client_client(appointment_id)
    )
    
    print()
    print("=" * 80)
    log(Colors.SUCCESS, "✅ TEST", "COMPLETATO!")
    print("=" * 80)
    print()
    print("📊 RISULTATI ATTESI:")
    print("  ✅ Notaio: 4 messaggi inviati (PAGE, ZOOM, ROTATION, ANNOTATION)")
    print("  ✅ Cliente: 5+ messaggi ricevuti (CONNECTION + 4 azioni notaio)")
    print("  ✅ Sincronizzazione: Immediata (< 100ms)")
    print()

if __name__ == "__main__":
    try:
        asyncio.run(run_test())
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrotto dall'utente")
    except Exception as e:
        print(f"\n\n❌ ERRORE TEST: {e}")

