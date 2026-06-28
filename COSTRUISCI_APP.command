#!/bin/bash
# ════════════════════════════════════════════════
#  ShowRider — Build automatico .dmg
#  Fai doppio clic su questo file per avviarlo
# ════════════════════════════════════════════════

cd "$(dirname "$0")"
clear

echo "🎭 ══════════════════════════════════════"
echo "   ShowRider — Build .dmg"
echo "   ══════════════════════════════════════"
echo ""

if ! command -v node &>/dev/null; then
  echo "❌ Node.js non trovato!"
  echo ""
  echo "Scaricalo da: https://nodejs.org (versione LTS)"
  echo ""
  read -p "Premi INVIO per aprire il sito..."
  open "https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node --version) trovato"
echo ""

echo "🔧 Fix permessi npm cache..."
sudo chown -R $(whoami) ~/.npm 2>/dev/null || true

echo "📦 Installazione dipendenze (1-2 min)..."
npm install 2>&1 | grep -E "added|error|warn" | head -5
INSTALL_EXIT=$?
echo ""

if [ $INSTALL_EXIT -ne 0 ]; then
  echo "⚠️  Provo con cache temporanea..."
  npm install --cache /tmp/npm-cache-showrider 2>&1 | grep -E "added|error" | head -5
  if [ $? -ne 0 ]; then
    echo "❌ Installazione fallita. Controlla la connessione internet."
    read -p "Premi INVIO per chiudere..."
    exit 1
  fi
fi

echo "🔨 Build installer macOS .dmg..."
npm run dist 2>&1 | grep -E "packaging|building|✓|error|•" | head -20
echo ""

if [ -d "dist" ]; then
  DMG=$(find dist -name "*.dmg" | head -1)
  if [ -n "$DMG" ]; then
    echo "✅ ══════════════════════════════════════"
    echo "   ShowRider.dmg creato!"
    echo "   → $DMG"
    echo "   ══════════════════════════════════════"
    echo ""
    echo "Apertura cartella dist in Finder..."
    open dist/
  else
    echo "⚠️  Build completata ma .dmg non trovato"
    open dist/ 2>/dev/null
  fi
else
  echo "❌ Cartella dist non creata — controlla gli errori sopra"
fi

echo ""
read -p "Premi INVIO per chiudere..."
