#!/bin/bash
# Script per avviare Django con Daphne (ASGI Server)
# Supporta WebSocket con Django Channels

echo "🚀 Avvio Sportello Notai con supporto WebSocket (Daphne ASGI Server)..."

# Attiva virtual environment
source venv/bin/activate

# Verifica Redis
echo "📡 Verifica Redis..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis connesso"
else
    echo "❌ Redis non disponibile - avviare con: brew services start redis"
    exit 1
fi

# Applica migrazioni (se necessario)
echo "🔄 Controllo migrazioni..."
python manage.py migrate --noinput

# Avvia Daphne ASGI Server
echo "🌐 Avvio Daphne ASGI Server su http://0.0.0.0:8000"
echo "📡 WebSocket disponibile su ws://localhost:8000/ws/..."
daphne -b 0.0.0.0 -p 8000 core.asgi:application

