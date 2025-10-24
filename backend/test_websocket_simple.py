#!/usr/bin/env python3
"""
Test WebSocket Simple - Solo connessione e ping/pong
"""

import asyncio
import json
import websockets

async def simple_test():
    uri = "ws://localhost:8000/ws/pdf/999/"
    
    print("🧪 Test WebSocket Simple")
    print(f"📡 Connessione a: {uri}")
    print()
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ CONNESSO!")
            
            # Ricevi messaggio di benvenuto
            response = await websocket.recv()
            print(f"📥 Ricevuto: {response}")
            data = json.loads(response)
            print(f"   Type: {data.get('type')}")
            print(f"   Message: {data.get('message')}")
            print()
            
            # Invia messaggio semplice
            test_msg = {
                "type": "TEST",
                "message": "Hello from test client"
            }
            await websocket.send(json.dumps(test_msg))
            print(f"📤 Inviato: TEST message")
            print()
            
            # Attendi un po'
            await asyncio.sleep(2)
            
            print("✅ TEST COMPLETATO - WebSocket funzionante!")
            print()
            
    except Exception as e:
        print(f"❌ ERRORE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(simple_test())

