#!/bin/bash
###############################################################################
# Script avvio sistema Sportello Notai con LibreOffice Collabora Online
# 
# Avvia:
# - Docker Compose (Backend Django + PostgreSQL + Redis + Collabora)
# - Frontend Vite React
#
# Uso: ./start_libreoffice_system.sh
###############################################################################

set -e  # Exit on error

# Colori output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 Sportello Notai - Avvio Sistema LibreOffice         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

# Step 1: Avvia Docker Compose
echo -e "\n${YELLOW}[1/5]${NC} Avvio Docker Compose (Backend + Collabora)..."
cd backend
docker-compose up -d

# Attendi che i servizi siano pronti
echo -e "${YELLOW}[2/5]${NC} Attendo che i servizi Docker siano pronti..."
sleep 5

# Verifica Collabora
echo -e "${YELLOW}[3/5]${NC} Verifico Collabora Online..."
if curl -s http://localhost:9980/ > /dev/null; then
    echo -e "${GREEN}✅ Collabora Online attivo (porta 9980)${NC}"
else
    echo -e "${RED}❌ ERRORE: Collabora non risponde${NC}"
    echo -e "${RED}   Verifica con: docker logs sportello-notai-collabora${NC}"
    exit 1
fi

# Verifica Backend Django
echo -e "${YELLOW}[4/5]${NC} Verifico Backend Django..."
if curl -s http://localhost:8000/health/ > /dev/null; then
    echo -e "${GREEN}✅ Backend Django attivo (porta 8000)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend potrebbe non essere ancora pronto, continuo...${NC}"
fi

# Step 2: Avvia Frontend
cd ../frontend

# Crea .env se non esiste
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato, lo creo...${NC}"
    cat > .env << EOL
VITE_API_BASE_URL=http://localhost:8000
VITE_COLLABORA_URL=http://localhost:9980
VITE_WS_BASE_URL=ws://localhost:8000
EOL
    echo -e "${GREEN}✅ File .env creato${NC}"
fi

# Installa dipendenze se node_modules non esiste
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[5/5]${NC} Installo dipendenze npm..."
    npm install
else
    echo -e "${GREEN}✅ Dipendenze npm già installate${NC}"
fi

# Avvia Frontend Vite
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Sistema avviato con successo!                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}🌐 Servizi attivi:${NC}"
echo -e "  • Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "  • Backend:     ${GREEN}http://localhost:8000${NC}"
echo -e "  • Collabora:   ${GREEN}http://localhost:9980${NC}"
echo -e "  • PostgreSQL:  ${GREEN}localhost:5432${NC}"
echo -e "  • Redis:       ${GREEN}localhost:6379${NC}"

echo -e "\n${YELLOW}📄 Test visualizzazione Word:${NC}"
echo -e "  1. Login come notaio (f.spada@digitalnotary.sm)"
echo -e "  2. Apri appuntamento"
echo -e "  3. Seleziona documento .doc/.docx"
echo -e "  4. Verifica pagine A4 separate!"

echo -e "\n${YELLOW}📚 Documentazione: ${NC}LIBREOFFICE_INTEGRATION.md"

echo -e "\n${YELLOW}🛑 Per fermare tutto:${NC}"
echo -e "  cd backend && docker-compose down"

echo -e "\n${GREEN}Avvio Frontend Vite...${NC}\n"

# Avvia Vite (blocca il terminale qui)
npm run dev

