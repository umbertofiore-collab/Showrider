# SHOWRIDER — Claude Code Config
Aggiornato: 25 luglio 2026

> **Da copiare nella radice del repo ShowRider** (`~/Desktop/showrider/CLAUDE.md`).
> Claude Code lo legge in automatico a ogni sessione.

---

## IDENTITÀ DEL PROGETTO

ShowRider è un'app desktop per creare e gestire **schede tecniche** (technical rider)
di spettacoli dal vivo. Raccoglie palco, audio, luci, video, elettrico, personale e
checklist pre-show in un unico documento esportabile in PDF.

È il **progetto pubblico e gratuito di Low Confidence Club**: per molte persone sarà
il primo contatto con il club.

Stack: Electron + HTML/CSS/vanilla JS + localStorage
Repo: `umbertofiore-collab/Showrider` · Licenza MIT · v1.0.0
Path locale: `~/Desktop/showrider`
Branch di lavoro: `showrider-fix-luglio`
Docs di rebuild: `docs-rebuild/`

---

## IL TUO RUOLO

Sei Claude Code. Il tuo ruolo è **ESCLUSIVAMENTE**:
- applicare **un blocco alla volta** dell'ordine di lavoro in `docs-rebuild/03_FIX_LIST.md`
- riportare cosa hai fatto, con snippet prima/dopo
- fermarti e chiedere quando qualcosa non torna

**NON fare mai:**
- refactor globali non richiesti
- modifiche a file non menzionati nel blocco corrente
- introdurre framework, bundler, TypeScript o qualunque cosa richieda un build step
- accorpare due blocchi in un solo passaggio
- dichiarare "verificato" ciò che non hai realmente provato
- commit senza OK esplicito di Umberto

---

## CHI USA QUEST'APP — guida ogni decisione tecnica

Tecnici del suono, datori luci, direttori di scena, tour manager.
**Non sviluppatori.** Gente che ha un montaggio alle 8 e uno spettacolo alle 21.

1. **Il PDF è il prodotto.** La scheda esiste per essere esportata, mandata al teatro
   ospitante e stampata. PDF rotto = app inutile, per quanto bella sia l'interfaccia.
2. **I dati sono ore di lavoro.** La perdita dati è il worst case assoluto — più grave
   di un crash: il crash lo vedi, un salvataggio fallito no.
3. **Si usa in teatro, di fretta, spesso al buio.** Contrasto e leggibilità sono
   ergonomia, non adempimento formale.
4. **Il mercato è internazionale.** Inglese e unità imperiali sono requisiti, non vezzi.

---

## VINCOLI ARCHITETTURALI — non violare

```
Electron  ·  HTML/CSS/vanilla JS  ·  localStorage  ·  electron-builder
```

- **Nessun framework, nessun bundler, nessuna dipendenza runtime.**
  È una scelta deliberata: rende la build banale e l'app leggera.
  Se una modifica sembra richiedere React/webpack/TS, **è la modifica ad essere sbagliata**.
- **Unità canonica = METRI, sempre.** Il dato salvato in `data` e nel JSON esportato è
  sempre in metri, come `Number`. L'unità imperiale è solo visualizzazione.
  *(Stessa regola di AXORA: unità interne sempre metri, conversione solo in output.)*
- **Notazione imperiale = piedi e pollici** — `39'-4"`. Mai piedi decimali, mai pollici puri.
- **Gli slogan di Low Confidence Club non si traducono mai.** Restano in inglese.

---

## FILE

```
index.html      1633 righe / 104 KB — TUTTA l'app: CSS + markup + JS + libreria QR inline
main.js         92 righe — processo main Electron, menu nativo
package.json    58 righe — config + electron-builder
qrcode.min.js   20 KB — libreria QR, DUPLICATA (esiste anche inline in index.html)
COSTRUISCI_APP.command   script build macOS (contiene un bug su PIPESTATUS, vedi BLOCCO 4)
```

**Attenzione ai numeri di riga.** Quelli citati nella documentazione si riferiscono allo
stato iniziale del file: dopo la prima modifica slittano tutti.
**Cercare sempre lo snippet di codice, mai la riga.**

---

## PROCEDURA OBBLIGATORIA PER OGNI BLOCCO

1. **LEGGI** `docs-rebuild/01_CONTESTO.md` e il blocco assegnato in `docs-rebuild/03_FIX_LIST.md`
2. **TROVA** gli snippet nel codice — riporta cosa hai trovato prima di modificare
3. **APPLICA** le modifiche del blocco, solo quelle
4. **VERIFICA** che il file sia sintatticamente valido:
   ```bash
   node --check main.js && echo "main.js OK"
   npx --yes html-validate index.html 2>/dev/null || echo "(validator non installato, salta)"
   ```
5. **RIPORTA** — elenco delle modifiche, una riga ciascuna, con snippet prima/dopo.
   Dichiara esplicitamente cosa hai provato e cosa **no**.
6. **FERMATI.** Umberto apre l'app e fa la verifica manuale prima del blocco successivo.

Se un passo fallisce → **STOP**. Non procedere ad altri blocchi.

---

## ORDINE DEI BLOCCHI

| # | Blocco | File toccati |
|---|---|---|
| 1 | XSS — 4 `esc()` + validazione import | `index.html` |
| 2 | PDF leggibile in stampa | `index.html` |
| 3 | Perdita dati — flush, try/catch, recovery | `index.html` |
| 4-bis | Unità metri ↔ piedi-pollici + migrazione | `index.html` |
| 4 | Release — script, package.json, CI, README | **altri file**, non `index.html` |

Il **BLOCCO 4** non tocca `index.html`: può essere eseguito in qualunque momento,
anche in parallelo. Tutti gli altri sono **sequenziali**.

---

## COSA È GIÀ FATTO BENE — non rompere

L'audit ha trovato 24 problemi, ma il codice di partenza è più pulito della media:

- zero `console.log` dimenticati, zero `TODO` abbandonati, zero `==` laschi
- `nodeIntegration: false` + `contextIsolation: true`, `window.open` intercettato
- la funzione `esc()` **esiste già** ed è applicata quasi ovunque — il problema è la
  copertura incompleta, non l'assenza di consapevolezza
- nessun memory leak da listener (pattern "distruggi e ricrea")
- undo stack con snapshot combinato, mai stati parziali
- `makeDefault()` + backfill: schede vecchie non fanno crashare
- QR deliberatamente minimale (una vCard, non la scheda intera)
- `mac.target.arch` già con `x64` + `arm64`

**Il lavoro è chiudere i buchi, non riscrivere.**

---

## GIT

- Commit **solo dopo esplicita richiesta** di Umberto
- Formato: `fix: descrizione breve` / `feat: ...` / `build: ...`
- Branch: `showrider-fix-luglio` · Tag di ritorno: `pre-fix-2026-07-25`
- **MAI** merge automatici, `reset --hard`, cancellazione di file o branch
- Un blocco = un commit

---

## REVISIONE

Il diff finale va rivisto da una **sessione separata**, che non ha scritto il codice.
Griglia: **✅ funziona** · **⚠️ scricchiola** · **❌ da cambiare** · **🔁 da rimandare**

Chi ha scritto una modifica è il peggior giudice di quella modifica.
