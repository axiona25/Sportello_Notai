#!/bin/bash

echo "🚀 Avvio Dashboard Digital Notary..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze..."
    npm install
    echo ""
fi

echo "✨ Avvio server di sviluppo..."
echo "📍 La dashboard sarà disponibile su: http://localhost:3000"
echo ""

npm run dev

