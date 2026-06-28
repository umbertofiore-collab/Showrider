# 🎭 ShowRider

**Technical rider app for live shows — Desktop app for theater, concerts, dance and live events.**

![Version](https://img.shields.io/badge/version-1.0.0-gold) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue) ![Electron](https://img.shields.io/badge/built%20with-Electron-47848F)

---

## Cos'è ShowRider

ShowRider è un'applicazione desktop per creare e gestire **schede tecniche** di spettacoli dal vivo. Permette di raccogliere in un unico documento tutte le informazioni tecniche necessarie per la produzione: palco, audio, luci, video, personale, checklist pre-show e molto altro.

Pensato per **tecnici del suono, datori luci, direttori di scena, tour manager** e chiunque lavori nel mondo dello spettacolo dal vivo.

---

## ✨ Funzionalità

- 📚 **Libreria multi-show** — gestisci più spettacoli, cerca e filtra rapidamente
- 📋 **11 tab tecnici** — Info, Cronoprogramma, Palco, Audio, Luci, Video, Elettrico, Personale, Esigenze, Documenti, Checklist
- 🎭 **6 template precompilati** — Teatro, Concerto, Danza, Stand-up, Opera/Musical, Multimediale
- 📱 **QR Code** — genera un QR con le info principali della scheda
- 🖨️ **Export PDF** — stampa la scheda completa formattata
- 💾 **Export / Import JSON** — condividi le schede con il team
- ↩️ **Undo** — annulla le ultime modifiche (Cmd+Z)
- 🌍 **Italiano / English** — toggle lingua in un clic
- 📐 **Metri / Piedi** — toggle unità di misura
- 🌙 **Tema scuro / chiaro**
- 💾 **Autosalvataggio** — tutto salvato in locale automaticamente

---

## 🚀 Installazione

### Requisiti
- [Node.js](https://nodejs.org) v18 o superiore

### Build macOS (.dmg)

```bash
# 1. Clona il repo
git clone https://github.com/umbertofiore-collab/Showrider.git
cd Showrider

# 2. Fai doppio clic su COSTRUISCI_APP.command
#    oppure da terminale:
npm install
npm run dist
```

Il file `.dmg` viene creato nella cartella `dist/`.

### Avvio in modalità sviluppo

```bash
npm install
npm start
```

---

## 🎨 Template disponibili

| Template | Descrizione |
|----------|-------------|
| 🎭 Teatro | Prosa e drammaturgia |
| 🎵 Concerto | Live music / band |
| 💃 Danza | Contemporanea e classica |
| 🎤 Stand-up | Comedy / Spoken word |
| 🎼 Opera / Musical | Lirica e grande teatro musicale |
| 🖥️ Multimediale | Video mapping / Installazione |

---

## 📁 Struttura progetto

```
showrider/
├── index.html              # App completa (HTML/CSS/JS single-file)
├── main.js                 # Electron main process
├── package.json            # Config e build settings
├── qrcode.min.js           # Libreria QR (offline)
├── COSTRUISCI_APP.command  # Script build macOS
└── assets/
    ├── icon.png            # Icona app (512px)
    ├── icon.ico            # Icona Windows
    └── icon_*.png          # Icone varie dimensioni
```

---

## 🛠️ Tech stack

- **Electron** — framework desktop cross-platform
- **HTML / CSS / Vanilla JS** — nessun framework front-end
- **localStorage** — persistenza dati locale
- **electron-builder** — packaging e distribuzione
- **qrcodejs** — generazione QR code offline

---

## 📄 Licenza

MIT — Umberto Fiore © 2026
