#!/bin/bash

# Script per setup iniziale del progetto Django Sportello Notai
# Eseguire dalla cartella backend/

echo "🚀 Setup Sportello Notai Backend..."

# Crea virtual environment
echo "📦 Creazione virtual environment..."
python3 -m venv .venv

# Attiva virtual environment
source .venv/bin/activate

# Aggiorna pip
pip install --upgrade pip

# Installa dipendenze
echo "📥 Installazione dipendenze..."
pip install -r requirements.txt

# Crea progetto Django (se non esiste)
if [ ! -d "core" ]; then
    echo "🏗️  Creazione progetto Django..."
    django-admin startproject core .
fi

# Crea le app Django
echo "📱 Creazione app Django..."

apps=("accounts" "notaries" "acts" "documents" "appointments" "reviews" "pec" "rtc" "signatures" "conservation" "audit")

for app in "${apps[@]}"
do
    if [ ! -d "$app" ]; then
        python manage.py startapp $app
        echo "✅ App $app creata"
    else
        echo "⏭️  App $app già esistente"
    fi
done

echo ""
echo "✅ Setup completato!"
echo ""
echo "Prossimi passi:"
echo "1. Copia env.example in .env e configura le variabili"
echo "2. Crea il database PostgreSQL: createdb sportello_notai"
echo "3. Applica le migration: python manage.py migrate"
echo "4. Crea superuser: python manage.py createsuperuser"
echo ""

