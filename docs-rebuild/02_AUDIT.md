# SHOWRIDER — Report di audit
25 luglio 2026 · commit `main` @ clone del 25/07
Metodo: 10 agenti su mandati non sovrapposti + verifica diretta delle segnalazioni critiche

---

## SINTESI IN 5 RIGHE

Il codice è **più pulito della media**: nessun `console.log` dimenticato, nessun `==` lasco,
nessun TODO abbandonato, nessuna variabile globale implicita, `esc()` applicata quasi ovunque.
Ma ci sono **4 problemi che bloccano un rilascio pubblico** e vanno risolti prima di mettere
un bottone "Scarica" sul sito di Low Confidence Club. Tre sono seri (XSS sfruttabile, perdita
dati, PDF illeggibile), uno è organizzativo (non esiste una pipeline di release).

**Nota di metodo:** ogni voce P0/P1 è stata verificata direttamente sul codice, non presa
per buona dagli agenti. Una segnalazione è stata scartata perché falsa (vedi §Correzioni).

---

# 🔴 P0 — BLOCCA IL RILASCIO PUBBLICO

## P0-1 · XSS sfruttabile via import JSON → in Electron può diventare esecuzione di codice
**VERIFICATO.** Quattro punti dove un valore non passa da `esc()` e finisce dentro un
attributo HTML costruito con template string in `innerHTML`:

| Riga | Codice | Campo non escaped |
|---|---|---|
| 1163, 1178, 1179, 1180 | `onclick="openShow('${show.id}')"` | `show.id` |
| 1352 | `value="${row.ora\|\|''}"` | `crono[].ora` |
| 1369 | `value="${row.qta\|\|''}"` | `pers[].qta` |
| 1428 | `deleteChkItem('${item.id}')` | `checklist[].id` |

**Il vettore è concreto, non teorico.** `handleFile()` (riga 1569-1584) fonde il JSON
importato con `Object.assign(makeDefault(), loaded)` **senza alcuna validazione**. Un file
`.json` ricevuto via mail da un collega — scenario normalissimo, l'app nasce per scambiare
schede — con dentro:

```json
{ "id": "x\"><img src=x onerror=...>" }
```

rompe l'attributo `onclick` e inietta un tag che **si esegue da solo al parsing**, senza
bisogno di click. `renderAll()` viene chiamata immediatamente dopo l'import (riga 1578),
quindi scatta nell'istante in cui l'utente apre il file.

In un browser sarebbe un XSS. In Electron, con un renderer che ha accesso al contesto
dell'app, è molto peggio.

**Fix:** applicare `esc()` ai 4 valori. Meglio ancora: sostituire gli `onclick` inline con
`addEventListener` + `data-id` — pattern già usato correttamente due righe sotto, alla 1429,
per `.chk-box`. La correzione giusta è già nel codice, va solo estesa.

**Fix aggiuntivo a monte:** validare la forma del JSON importato (`Array.isArray()` su
`crono`/`pers`/`checklist`, whitelist dei campi) prima di fonderlo in `data`.

---

## P0-2 · Perdita dati: un blob corrotto cancella tutta la libreria, in silenzio
**VERIFICATO.** `loadLibrary()` (riga 1029-1032):

```js
function loadLibrary() {
  try { return JSON.parse(localStorage.getItem('showriderLibrary') || '[]'); }
  catch(e) { return []; }        // ← silenzio totale
}
```

Il `catch` restituisce array vuoto **senza avvisare nessuno**. Il problema è a valle:
`saveCurrentToLibrary()` (riga 1036-1044) chiama `loadLibrary()`, riceve `[]`, ci aggiunge
la scheda corrente e **riscrive la chiave** — cancellando per sempre tutte le altre schede,
che magari erano ancora recuperabili a mano dal JSON grezzo.

Con l'autosave che scrive ogni 600ms di pausa nella digitazione, questo può succedere
**alla prima lettera battuta dopo un riavvio**.

Causa realistica della corruzione: force-quit, kill del processo, crash — problema noto e
documentato del `localStorage` (leveldb) in Electron.

**Fix:** se il parse fallisce, NON procedere come se la libreria fosse vuota. Mostrare un
errore esplicito, offrire il dato grezzo per il recovery manuale, e bloccare l'autosave
finché l'utente non conferma "ricomincia da zero".

**Contesto:** una scheda tecnica sono ore di lavoro. Perdere l'intera libreria è il worst
case assoluto per questa app.

---

## P0-3 · Il PDF stampato dal tema di default è illeggibile
**VERIFICATO.** Il tema di default è scuro (`--text: #e0e0e0`). Il blocco `@media print`
(righe 294-307) corregge il `border-color` dei campi e il colore del solo `.time-input`,
ma **non ridefinisce mai `--text` né il `color` di `body` e degli input**.

Cosa succede in pratica:
- **Senza "Stampa sfondi"** (default del dialogo di stampa): sfondi scuri ignorati → foglio
  bianco, ma il testo resta `#e0e0e0`. **Tutti i valori compilati** — venue, contatti,
  specifiche, crew, note — diventano grigio chiarissimo su bianco. Praticamente invisibili.
- **Con "Stampa sfondi"**: pagine intere con fondo nero pieno. Spreco di toner, inutilizzabile
  in b/n.

In entrambi i casi il PDF nasce rotto nella configurazione predefinita dell'app.

**Perché è P0:** il PDF *è* il prodotto. Una scheda tecnica esiste per essere mandata al
teatro ospitante e stampata. Se il PDF viene male, l'app non serve — per quanto curata sia
l'interfaccia.

**Fix:** dentro `@media print` forzare `color: #111 !important` su `body`, tutti gli input,
select, textarea e label, indipendentemente dal tema attivo.

**Correlato (stesso fix set):**
- Nessuna numerazione di pagina, nessun header ricorrente. Un rider di più fogli senza
  "pagina 3 di 8" e senza nome spettacolo su ogni foglio è un problema reale in montaggio.
- I tab non compilati vengono stampati comunque, generando pagine mezze vuote
  (`page-break-inside: avoid` su pannelli vuoti spinge tutto alla pagina dopo).
- Il file proposto dal dialogo si chiama sempre `ShowRider.pdf` — `document.title` non viene
  mai aggiornato. `exportJSON()` invece costruisce correttamente `titolo_data.json`.

---

## P0-4 · Non esiste una pipeline di release — l'app è invisibile al suo pubblico
**VERIFICATO.** Il repo ha zero release. L'unico percorso documentato è `git clone` +
`npm install` + `npm run dist`. Il pubblico target — datori luci, fonici, direttori di scena —
non lo farà mai.

Tre ostacoli concreti, tutti verificati:

| Problema | Verifica |
|---|---|
| `package.json` non ha `repository` né `publish` | confermato: assenti |
| Manca `package-lock.json` | confermato: file assente → `npm ci` in CI fallirebbe |
| Bug nel controllo errori di `COSTRUISCI_APP.command` | confermato, righe 32-33 |

Il bug dello script:
```bash
npm install 2>&1 | grep -E "added|error|warn" | head -5
INSTALL_EXIT=$?          # ← cattura l'exit di head, non di npm install
```
`head` esce quasi sempre con 0, quindi **il ramo di retry non scatta mai**, anche quando
`npm install` fallisce davvero. Fix: `INSTALL_EXIT=${PIPESTATUS[0]}`.

**Da fare, in ordine:**
1. `INSTALL_EXIT=${PIPESTATUS[0]}` nello script
2. aggiungere `repository` a `package.json`
3. committare `package-lock.json`
4. GitHub Action su tag → build mac/win/linux → pubblica su Releases
5. riscrivere la sezione "Installazione" del README per utenti **non** tecnici

**Nota su macOS:** senza account Apple Developer (99$/anno) l'app non è notarizzata e
Gatekeeper mostrerà "app danneggiata". Serve documentare esplicitamente il workaround
(tasto destro → Apri, oppure `xattr -cr /Applications/ShowRider.app`), altrimenti chi scarica
pensa che l'app sia rotta e la butta.

**Nota buona:** `mac.target.arch` include già `x64` e `arm64` — la trappola classica del
`.dmg` che non parte su Apple Silicon è già evitata.

---

# 🟠 P1 — GRAVE, DA FARE PRIMA DELLA v1.1

## P1-1 · Nessun `beforeunload` → l'ultima modifica si perde a ogni chiusura
**VERIFICATO:** 0 occorrenze di `beforeunload` nel file. L'autosave ha un debounce di 600ms
(riga 1544-1549). L'unico flush sincrono è in `backToLibrary()` (riga 1123-1127).

Chi digita l'ultima modifica e chiude subito la finestra o preme Cmd+Q — cioè un tecnico di
fretta prima di uno show — perde quella modifica. Sempre. Finestra garantita di 600ms.

Peggio: `createFromTemplate()` e `handleFile()` sostituiscono `data` **senza** `clearTimeout`,
quindi il timer pendente scatterà leggendo il `data` *nuovo* — l'ultima modifica sullo
spettacolo precedente non viene mai scritta.

**Fix:** `window.addEventListener('beforeunload', () => { clearTimeout(saveTimer); saveCurrentToLibrary(); })`
+ flush esplicito in `createFromTemplate()` e `handleFile()`.

## P1-2 · `undoStack` non si svuota al cambio spettacolo → corruzione cross-show
Nessuna delle funzioni che sostituiscono `data` (`openShow`, `createFromTemplate`,
`handleFile`, `init`) azzera `undoStack`.

Scenario: cancelli una riga nello Spettacolo A → apri lo Spettacolo B → cancelli una riga →
Cmd+Z due volte → **i dati di A finiscono dentro B** e l'autosave li persiste.

**Fix:** `undoStack.length = 0` in tutte e quattro le funzioni.

## P1-3 · Nessun `try/catch` su `localStorage.setItem` → autosave fallisce muto
**VERIFICATO:** solo 3 blocchi `try/catch` in 1633 righe (righe 1030, 1298, 1574). Tutte le
scritture su `localStorage` sono scoperte (righe 1003, 1009, 1034, 1193, 1203, 1617).

Se `setItem` lancia (quota piena, storage disabilitato), le righe successive in `autoSave()`
non vengono eseguite: **il pallino resta bloccato su "Salvataggio…" e nessun messaggio
avvisa l'utente**. Si lavora un'intera sessione convinti di salvare, senza salvare nulla.

È il fallimento silenzioso peggiore del crash: il crash almeno te lo dice.

## P1-4 · Cmd+Z: due meccanismi di undo in conflitto
`main.js:59-60` registra `role:'undo'` / `role:'redo'` nativi. `index.html:840-844` registra
un listener globale sullo stesso tasto. Gli acceleratori nativi Electron intercettano prima.
Risultato probabile: **l'undo custom non si attiva mai da tastiera**.

Inoltre il listener non controlla `e.target`: chi sta scrivendo in un campo di testo e preme
Cmd+Z non ottiene l'undo del testo (i ~46 campi semplici non sono negli snapshot) — nel caso
peggiore si vede svuotare crono/pers/checklist per un'azione che non ha chiesto.

**Fix:** togliere i `role:'undo'/'redo'` dal menu e chiamare `executeJavaScript('undo()')`,
come già si fa per le altre voci. E ignorare l'evento quando il focus è in un campo di testo.

## P1-5 · Il toggle metri/piedi non converte i valori — cambia solo l'etichetta
`toggleUnits()` (riga 1007-1011) chiama solo `applyLang()`, che aggiorna le 4 label del
palco. **Il numero inserito resta identico.** Scrivi `8` in metri, passi a ft, e leggi
"Width (ft): 8".

Non è un problema di traduzione: è un **dato sbagliato in una scheda tecnica**. Un venue che
riceve larghezza palco 8 ft invece di 8 m manda la crew a montare in un posto che non esiste.

## P1-6 · Il PDF e il menu nativo non rispettano la lingua
- Gli header di sezione del PDF vengono da `data-print-label` **statici in italiano**
  (righe 432, 509, 525, 552, 580, 606, 626, 640, 665, 681, 691). In modalità EN il PDF ha
  campi inglesi sotto titoli italiani.
- La copertina del PDF ha `Data:` / `Repliche:` / `Stato:` hardcoded (righe 424-427).
- Le date usano `toLocaleDateString('it-IT')` fisso in **4 punti** (righe 1159, 1267, 1498, 1518).
- Il menu Electron (`main.js:37-79`) è **interamente in italiano**, non localizzabile:
  "Modifica", "Visualizza", "Esci"… È il primo elemento visibile per un utente straniero.
- Il tab Documenti (`DOC_LABELS`, righe 720-725) resta sempre in italiano.

**Perché conta:** il mercato internazionale del teatro tecnico è dove sta il valore. Un rider
mezzo tradotto mandato a un venue estero fa una brutta figura precisa.

---

# 🟡 P2 — DA SISTEMARE, NON URGENTE

**Accessibilità** — verificato: **0 occorrenze di `<label for=`** su 47 label. Le 11 tab sono
`<div onclick>` senza `tabindex` né `role="tab"`: **non navigabili da tastiera**. I modali non
hanno `role="dialog"`, focus trap, né chiusura con Escape. La scelta del template per creare
una nuova scheda richiede obbligatoriamente il mouse.

**Contrasto sotto WCAG AA** — `--text-dim` fallisce in **entrambi** i temi: `#777` su `#1e1e1e`
= 3.72:1, `#888` su `#fff` = 3.54:1 (serve 4.5:1). Colpisce le label dei campi (10px), i
metadati delle card, gli header di tabella. In tema chiaro anche `--accent` (#b87010) usato
per i titoli di ogni card fallisce: 3.91:1.
*Contesto d'uso: si legge in teatro, spesso al buio o in controluce. Qui il contrasto non è
un adempimento formale, è ergonomia.*

**Sicurezza** — nessuna CSP (verificato: 0 occorrenze). `lucide` caricato da `unpkg.com`
senza SRI (riga 310) in un'app che dovrebbe funzionare offline: se il CDN viene compromesso,
JS arbitrario esegue nel renderer. Va scaricato in locale come già fatto per QRCode.
`shell.openExternal` (main.js:27-30) inoltra qualsiasi URL senza allow-list di schema.

**Electron 31 è fuori supporto.** Uscita a maggio 2024, Electron mantiene solo le ultime 3
major. Nessuna patch di sicurezza Chromium arriva più su quel ramo.

**`resetChecklist()` (riga 1446) è distruttivo, senza conferma e senza undo.** A differenza di
`delCrono`/`delPers`/`deleteChkItem` che chiamano tutte `pushUndo()`. Spunti 15 voci prima
del debutto, un click sbagliato su "Reset" e sono sparite. Fix: una riga, `pushUndo();`.

**5 chiavi di traduzione orfane** — tradotte in IT ed EN ma mai collegate a un `data-t`:
`libEmpty1`, `libEmpty2`, `lCrewComp`, `lNumPersone`, `ctLogistica` (righe 365-367, 657-658, 667).
Qualcuno ha scritto le traduzioni e non le ha agganciate. Fix banale.

**Lista di 48 id campo duplicata** in `renderAll()` (1323-1334) e `autoSave()` (1524-1535),
copiaincollata identica. Chi aggiunge un campo e ne aggiorna solo una: il campo non si salva,
senza errori. Estrarre in `const FIELD_IDS`.

**`qrcode.min.js` è duplicato** — la libreria è inline a riga 311 (19.945 caratteri) *e* esiste
come file separato di 19.927 byte, dichiarato in `build.files` ma mai referenziato da
`index.html`. 20KB morti nel pacchetto.

**Altri:** `URL.revokeObjectURL()` mai chiamato in `exportJSON()`. `updateUnitsBtn()` chiamata
due volte in `applyLang()`. Nome file export non sanitizzato (`/`, `:`, `?` nel titolo).
Terminologia EN dei ruoli precompilati da rivedere ("Datore luci" → *Lighting Operator / LX*,
"Macchinista" → *Stagehand*). Nessuna indicazione all'utente di dove risiedano fisicamente i
suoi dati. Nessun "esporta tutta la libreria" — il backup si fa una scheda alla volta.

---

# ✅ COSA È GIÀ FATTO BENE

Vale la pena dirlo, perché il quadro sopra è una lista di problemi e rischia di dare
un'impressione sbagliata.

- **Igiene del codice sopra la media:** zero `console.log` dimenticati, zero `TODO`/`FIXME`
  abbandonati, zero `==` laschi in 920 righe di JS, zero variabili globali implicite.
- **`nodeIntegration: false` + `contextIsolation: true`**, nessun `remote`, nessun preload
  inutile, `window.open` intercettato con `setWindowOpenHandler`. La postura Electron di base
  è corretta.
- **`esc()` esiste ed è applicata nella maggior parte dei casi** — il problema è la
  copertura incompleta, non l'assenza di consapevolezza.
- **Nessun memory leak da listener:** il pattern "distruggi e ricrea" con `onclick` inline su
  nodi sempre nuovi evita l'accumulo.
- **Design dell'undo stack corretto:** snapshot combinato crono+pers+checklist, mai stati
  parziali incoerenti. `MAX_UNDO = 30`.
- **`makeDefault()` + backfill** garantisce che schede vecchie o JSON di versioni precedenti
  non facciano crashare il renderer.
- **Il QR contiene deliberatamente poco** (una vCard essenziale, non la scheda intera):
  scelta giusta, è "scambia contatto" e funziona davvero.
- **UI di editing correttamente esclusa dalla stampa** (bottoni, toast, barra riepilogo).
- **Stato vuoto ben progettato**, feedback testuale e non solo cromatico, `confirm()` sulle
  cancellazioni di scheda.
- **`mac.target.arch` già con x64 + arm64.**
- **Nessuna dipendenza runtime** → nessun modulo nativo da ricompilare, la build in CI sarà
  semplice.
- **L'app è già bilingue** dove conta di più (i campi dell'editor), con dizionario simmetrico.

---

# CORREZIONI AGLI AGENTI

Per trasparenza sul metodo — un audit va auditato.

**Segnalazione scartata (falsa):** un agente ha riportato che `qrcode.min.js` è "dichiarato
in `build.files` ma il file fisico non esiste". Verificato: **il file esiste** (19.927 byte).
Il problema reale è diverso e opposto — la libreria è duplicata (inline + file separato mai
usato). Declassata da errore di packaging a 20KB di peso morto.

**Segnalazione ridimensionata:** il rischio quota `localStorage` è stato presentato come
critico. L'app non gestisce allegati binari, solo testo: con 50 schede si resta ben sotto i
5-10MB. Il problema vero non è la quota ma **l'assenza di `try/catch`** che rende qualunque
fallimento di scrittura invisibile (→ P1-3).

**Tutto il resto è stato verificato riga per riga e confermato.**

---

# ORDINE DI ESECUZIONE CONSIGLIATO

**Prima di mettere ShowRider sul sito di Low Confidence Club:**

1. `esc()` sui 4 punti XSS + validazione del JSON importato *(P0-1)*
2. `@media print` con colori forzati *(P0-3)* — è una manciata di righe CSS
3. `loadLibrary()` che non cancella tutto in silenzio *(P0-2)*
4. `try/catch` sull'autosave + `beforeunload` *(P1-3, P1-1)*
5. `PIPESTATUS` + `repository` + `package-lock.json` + GitHub Action + README utente *(P0-4)*
6. Prima release con `.dmg` e `.exe` → **solo a questo punto la pagina ShowRider ha un bottone**

**Poi, con calma:** numerazione pagine PDF, undo stack, toggle unità, i18n del PDF e del
menu, accessibilità, contrasto, CSP, bump Electron.

**Le prime 6 voci sono un paio di sessioni di lavoro, non un mese.** Il grosso sono correzioni
puntuali, non refactor.
