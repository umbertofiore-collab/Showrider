# 🎭 ShowRider

**Technical rider app for live shows — Web app for theater, concerts, dance and live events.**

![Version](https://img.shields.io/badge/version-1.0.0-gold) ![Platform](https://img.shields.io/badge/platform-Browser%20%7C%20PWA-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue) ![PWA](https://img.shields.io/badge/built%20with-PWA-5A0FC8)

🌐 **[Apri ShowRider](https://umbertofiore-collab.github.io/Showrider/)** — installabile direttamente dal browser, funziona offline.

---

## Cos'è ShowRider

ShowRider è un'applicazione web per creare e gestire **schede tecniche** di spettacoli dal vivo. Permette di raccogliere in un unico documento tutte le informazioni tecniche necessarie per la produzione: palco, audio, luci, video, personale, checklist pre-show e molto altro.

Pensato per **tecnici del suono, datori luci, direttori di scena, tour manager** e chiunque lavori nel mondo dello spettacolo dal vivo.

---

## ✨ Funzionalità

- 📚 **Libreria multi-show** — gestisci più spettacoli, cerca e filtra rapidamente
- 📋 **11 tab tecnici** — Info, Cronoprogramma, Palco, Audio, Luci, Video, Elettrico, Personale, Esigenze, Documenti, Checklist
- 🎭 **6 template precompilati** — Teatro, Concerto, Danza, Stand-up, Opera/Musical, Multimediale
- 📱 **QR Code** — genera un vCard con le info principali della scheda (salvabile come contatto)
- 🖨️ **Export PDF** — stampa la scheda completa formattata
- 💾 **Export / Import JSON** — condividi le schede con il team
- ↩️ **Undo** — annulla le ultime modifiche (Cmd+Z)
- 🌍 **Italiano / English** — toggle lingua in un clic
- 📐 **Metri / Piedi** — toggle unità di misura
- 🌙 **Tema scuro / chiaro**
- 💾 **Autosalvataggio** — tutto salvato in locale automaticamente
- 📲 **PWA installabile** — installa dal browser senza app store, funziona offline

---

## 🚀 Installazione (PWA)

Non serve installare nulla. Basta aprire il browser e andare su:

👉 **https://umbertofiore-collab.github.io/Showrider/**

Per installare come app standalone:
1. Apri il link in **Chrome** (o Safari su iOS)
2. Clicca l'icona di installazione nella barra degli indirizzi
3. Conferma — ShowRider appare nel Launchpad come qualsiasi altra app

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
├── scheda-teatro-app/
│   ├── index.html          # App completa (HTML/CSS/JS single-file)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker (offline support)
│   └── assets/
│       ├── icon_512.png    # Icona app
│       ├── icon_1024.png
│       └── lcc-logo.png
└── main.js                 # Electron main (legacy)
```

---

## 🛠️ Tech stack

- **HTML / CSS / Vanilla JS** — nessun framework front-end
- **PWA** — installabile da browser, offline-first via Service Worker
- **localStorage** — persistenza dati locale
- **qrcodejs** — generazione QR code / vCard
- **GitHub Pages** — hosting gratuito e deploy automatico

---

## 📄 Licenza

MIT

---

*Low Confidence Club — developed by Umberto Fiore © 2026*
