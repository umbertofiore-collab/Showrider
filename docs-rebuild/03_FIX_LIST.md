# SHOWRIDER — Ordine di lavoro per Codex
25 luglio 2026 · deriva da `SHOWRIDER_AUDIT.md`

**Come usarlo:** un blocco alla volta, in ordine. Ogni blocco è indipendente e
committabile da solo. Righe riferite al file `index.html` allo stato attuale di `main`:
dopo ogni modifica i numeri slittano, quindi Codex deve cercare lo **snippet**, non
fidarsi della riga.

**Regola:** dopo ogni blocco, aprire l'app e verificare il comportamento descritto in
"Come si verifica". Se non si verifica, fermarsi.

---

# BLOCCO 1 · XSS — 4 escape mancanti + validazione import
*Il più urgente. Un file JSON ricevuto via mail può eseguire codice.*

### 1.1 — `index.html`, funzione `makeLibCard()` (~riga 1163-1180)
Quattro occorrenze di `${show.id}` dentro attributi `onclick`. Aggiungere `esc()`:

```
onclick="openShow('${show.id}')"        →  onclick="openShow('${esc(show.id)}')"
onclick="duplicateShow('${show.id}')"   →  onclick="duplicateShow('${esc(show.id)}')"
onclick="deleteShow('${show.id}')"      →  onclick="deleteShow('${esc(show.id)}')"
onclick="openShow('${show.id}')"        →  onclick="openShow('${esc(show.id)}')"   (bottone "Apri")
```

### 1.2 — `renderCrono()` (~riga 1352)
```
value="${row.ora||''}"        →  value="${esc(row.ora||'')}"
```

### 1.3 — `renderPers()` (~riga 1369)
```
value="${row.qta||''}"        →  value="${esc(row.qta||'')}"
```

### 1.4 — `renderChecklist()` (~riga 1428)
```
deleteChkItem('${item.id}')   →  deleteChkItem('${esc(item.id)}')
```

### 1.5 — Validazione dell'import in `handleFile()` (~riga 1574)
Attuale:
```js
const loaded = JSON.parse(ev.target.result);
data = Object.assign(makeDefault(), loaded);
```
Da diventare: prima della fusione, normalizzare i tre array e scartare
valori di tipo sbagliato.
```js
const loaded = JSON.parse(ev.target.result);
if (typeof loaded !== 'object' || loaded === null || Array.isArray(loaded)) throw new Error('shape');
['crono','pers','checklist'].forEach(k => { if (!Array.isArray(loaded[k])) delete loaded[k]; });
data = Object.assign(makeDefault(), loaded);
```

**Come si verifica:** creare un file `.json` con
`{"titolo":"test","id":"x\"><b>BOOM</b>"}`, importarlo, tornare alla libreria.
Prima del fix: appare "BOOM" in grassetto (= HTML iniettato). Dopo: si vede il testo
grezzo dell'id, nessun tag interpretato.

**Nota architetturale (non obbligatoria ora):** la correzione definitiva è sostituire
gli `onclick` inline con `addEventListener` + attributo `data-id`. Il pattern giusto è
già nel file, riga 1429, su `.chk-box`. Da valutare in un secondo momento — per ora
`esc()` chiude il buco.

---

# BLOCCO 2 · PDF leggibile in stampa
*Il PDF è il prodotto. Poche righe CSS.*

### 2.1 — `index.html`, blocco `@media print` (~righe 294-307)
Aggiungere in cima al blocco, subito dopo `@media print {`:

```css
  body, .field label, .field input, .field select, .field textarea,
  .pers-table input, .crono-table input, .crono-table .att-input,
  .chk-label, .doc-item, .sp-label, td, th {
    color: #111 !important;
    background: transparent !important;
  }
```

Questo forza il testo nero indipendentemente dal tema attivo. Attualmente il blocco
corregge solo `border-color` (riga 305) e il colore del solo `.time-input` (riga 306):
tutto il resto eredita `--text: #e0e0e0` del tema scuro, che è il default dell'app.

### 2.2 — Nome file sensato · funzione `printScheda()` (~riga 1586)
Attuale:
```js
function printScheda() { updatePrintCover(); setTimeout(() => window.print(), 100); }
```
Da diventare:
```js
function printScheda() {
  updatePrintCover();
  const prev = document.title;
  document.title = ((data.titolo || 'ShowRider') + '_' + (data.data || '')).replace(/[\/\\:*?"<>|]/g, '-');
  setTimeout(() => { window.print(); document.title = prev; }, 100);
}
```

### 2.3 — Non stampare i tab vuoti
In `@media print` aggiungere:
```css
  .panel-empty { display: none !important; }
```
e in `printScheda()`, prima di `window.print()`, marcare i pannelli i cui campi sono
tutti vuoti con la classe `panel-empty` (e rimuoverla dopo la stampa).

**Come si verifica:** con l'app in tema scuro (default), Cmd+P → anteprima di stampa.
Prima del fix: testo grigio chiarissimo, quasi invisibile. Dopo: testo nero leggibile,
nessun fondo scuro, nessuna pagina per i tab non compilati.

*Rimandato a dopo:* numerazione pagine e header ricorrente — utili ma non bloccanti,
e richiedono più lavoro (`@page` ha supporto limitato in Chromium).

---

# BLOCCO 3 · Perdita dati
*Tre fix separati, stesso tema.*

### 3.1 — `loadLibrary()` non deve cancellare tutto in silenzio (~riga 1029)
Attuale:
```js
function loadLibrary() {
  try { return JSON.parse(localStorage.getItem('showriderLibrary') || '[]'); }
  catch(e) { return []; }
}
```
Il problema non è il `catch` in sé, è che a valle `saveCurrentToLibrary()` riscrive la
chiave partendo da `[]`, distruggendo dati forse ancora recuperabili.

Da diventare: introdurre un flag globale `libraryCorrupted`. Su parse fallito:
salvare il dato grezzo in una chiave di backup (`showriderLibrary_corrupted_<timestamp>`),
alzare il flag, mostrare un toast esplicito. E in `saveLibrary()`, se il flag è alzato,
**rifiutare la scrittura** finché l'utente non conferma esplicitamente.

### 3.2 — `try/catch` sull'autosave · `autoSave()` (~riga 1544-1549)
Attuale:
```js
saveTimer = setTimeout(() => {
  saveCurrentToLibrary();
  dot.className = 'autosave-dot';
  lbl.textContent = t('savedLabel');
}, 600);
```
Se `setItem` lancia, le due righe successive non girano: il pallino resta su
"Salvataggio…" per sempre e **l'utente non sa che non sta salvando**.
Da diventare:
```js
saveTimer = setTimeout(() => {
  try {
    saveCurrentToLibrary();
    dot.className = 'autosave-dot';
    lbl.textContent = t('savedLabel');
  } catch (err) {
    dot.className = 'autosave-dot error';
    lbl.textContent = t('saveFailed');
    toast(t('saveFailedToast'));
  }
}, 600);
```
Aggiungere le due chiavi `saveFailed` / `saveFailedToast` a `STRINGS.it` e `STRINGS.en`.
Aggiungere lo stile `.autosave-dot.error` (rosso) al CSS.

### 3.3 — Flush alla chiusura
Non esiste `beforeunload` nel file (verificato: 0 occorrenze). Aggiungere vicino agli
altri listener globali (~riga 840):
```js
window.addEventListener('beforeunload', () => {
  clearTimeout(saveTimer);
  try { saveCurrentToLibrary(); } catch (e) {}
});
```
E aggiungere lo stesso flush all'inizio di `createFromTemplate()` (~1251) e
`handleFile()` (~1569), che oggi sostituiscono `data` senza `clearTimeout` — il timer
pendente scatta poi sul `data` nuovo e la modifica al vecchio spettacolo sparisce.

**Come si verifica:** scrivere in un campo, chiudere la finestra entro mezzo secondo,
riaprire l'app. Prima del fix: la modifica non c'è. Dopo: c'è.

---

# BLOCCO 4 · Release pubblica
*Senza questo, la pagina ShowRider del sito non ha un bottone da mettere.*

### 4.1 — `COSTRUISCI_APP.command`, righe 32-33
```bash
npm install 2>&1 | grep -E "added|error|warn" | head -5
INSTALL_EXIT=$?          # ← cattura head, non npm install
```
→
```bash
npm install 2>&1 | tee /tmp/showrider_install.log | grep -E "added|error|warn" | head -5
INSTALL_EXIT=${PIPESTATUS[0]}
```
Stesso trattamento al blocco `npm run dist`: oggi controlla solo l'esistenza della
cartella `dist/`, che può contenere un `.dmg` vecchio di una build precedente riuscita —
quindi una build fallita può sembrare riuscita.

### 4.2 — `package.json`
Aggiungere:
```json
"repository": { "type": "git", "url": "https://github.com/umbertofiore-collab/Showrider.git" }
```
Senza questo `electron-builder` non sa dove pubblicare.

### 4.3 — Committare `package-lock.json`
Verificato: **assente dal repo**. Senza, `npm ci` in CI fallisce.
```bash
npm install && git add package-lock.json
```

### 4.4 — GitHub Action · nuovo file `.github/workflows/release.yml`
```yaml
name: Release
on:
  push:
    tags: ["v*.*.*"]
permissions:
  contents: write
jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: macos-latest
            build_cmd: npm run dist -- --mac --publish always
          - os: windows-latest
            build_cmd: npm run dist -- --win --publish always
          - os: ubuntu-latest
            build_cmd: npm run dist -- --linux --publish always
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: ${{ matrix.build_cmd }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_IDENTITY_AUTO_DISCOVERY: false
```
Uso: `git tag v1.0.0 && git push origin v1.0.0` → build in parallelo sui tre sistemi,
artefatti pubblicati automaticamente come GitHub Release. Nessun secret da configurare.

### 4.5 — README per utenti non tecnici
L'attuale sezione "Installazione" spiega come **buildare**. Va rinominata
"Build da sorgente — per sviluppatori" e spostata in fondo. Sopra, una nuova sezione
"Scarica e installa" con link alle Releases e — punto essenziale — la spiegazione del
warning macOS.

**Senza account Apple Developer** l'app non è notarizzata: macOS mostrerà
*"ShowRider è danneggiata"*. Va detto esplicitamente, o chi scarica pensa che l'app sia
rotta e la butta. Workaround da documentare: tasto destro → Apri, oppure Impostazioni →
Privacy e Sicurezza → "Apri comunque", oppure `xattr -cr /Applications/ShowRider.app`.
Stesso discorso per SmartScreen su Windows ("Ulteriori informazioni" → "Esegui comunque").

### 4.6 — Rimuovere il duplicato di qrcode
La libreria è **inline** in `index.html` riga 311 (19.945 caratteri) *e* esiste come file
separato `qrcode.min.js` (19.927 byte), dichiarato in `build.files` ma mai referenziato.
20KB morti nel pacchetto. Scegliere una delle due — consigliato tenere il file separato e
sostituire il blob inline con `<script src="qrcode.min.js"></script>`, così `index.html`
scende a ~1300 righe leggibili.

**Come si verifica:** dopo il tag, la pagina Releases del repo mostra `.dmg`, `.exe` e
`.AppImage` scaricabili. Un Mac diverso dal tuo scarica il `.dmg` e riesce ad aprire l'app
seguendo il README.

---

# ✅ A QUESTO PUNTO SHOWRIDER PUÒ ANDARE SUL SITO

I quattro blocchi sopra chiudono i P0. Sono **un paio di sessioni di lavoro**, non un mese:
sono quasi tutte correzioni puntuali.

---

# BLOCCO 4-bis · UNITÀ DI MISURA — specifica completa
*Decisione Umberto, 25 lug 2026: metri ↔ piedi e pollici. Requisito per il mercato estero.*
*Priorità: alta. Oggi il toggle cambia solo l'etichetta e lascia il numero invariato —
significa spedire schede tecniche con misure sbagliate.*

## Principio architetturale
**Unità canonica = METRI. Sempre.** Il dato salvato in `data` e nel JSON esportato è
sempre in metri, come numero. L'unità è solo una preferenza di **visualizzazione**,
mai un formato di storage.

*(È la stessa regola già in uso in Axora: "unità interne sempre METRI — conversione solo
in output se il profilo lo richiede". Coerenza voluta fra i progetti.)*

## Notazione imperiale scelta: **piedi e pollici** — `39'-4"`
Non piedi decimali, non pollici puri. È la notazione dei rider anglosassoni: un technical
director di Londra o New York si aspetta di leggere così.

Arrotondamento: al **pollice intero**. Se i pollici arrotondano a 12, incrementare i piedi
e azzerare i pollici (`39'-12"` non deve mai esistere).

## Campi coinvolti
`palcoLarg`, `palcoProf`, `palcoAlt`, `graticcia` (righe 530-533).
Se in futuro si aggiungono campi dimensionali (boccascena, altezza sotto graticcia,
larghezza porta di carico) devono entrare nella stessa lista — da centralizzare in
`const DIMENSION_FIELDS = ['palcoLarg','palcoProf','palcoAlt','graticcia']`.

## Funzioni da scrivere

```js
// 1 ft = 0.3048 m esatti · 1 in = 0.0254 m esatti
const M_PER_FT = 0.3048, M_PER_IN = 0.0254;

// metri (Number) → "39'-4\""
function mToFtIn(m) {
  if (m === null || m === undefined || m === '' || isNaN(m)) return '';
  const totalIn = Math.round(Number(m) / M_PER_IN);
  let ft = Math.floor(totalIn / 12), inch = totalIn % 12;
  return `${ft}'-${inch}"`;
}

// input utente → metri (Number) | null
// Accetta, in modalità imperiale:  39'-4"   39' 4"   39'4   39'   39.5'   4"   39-4
// Accetta, in modalità metrica:    12   12,5   12.5
function parseToM(raw, units) {
  if (!raw) return null;
  const s = String(raw).trim().replace(',', '.');
  if (units === 'm') { const n = parseFloat(s); return isNaN(n) ? null : n; }
  // imperiale
  const m1 = s.match(/^(-?[\d.]+)\s*['’]\s*(?:(-|\s)\s*([\d.]+)\s*["”]?)?$/);
  if (m1) return (parseFloat(m1[1]) * M_PER_FT) + ((parseFloat(m1[3]) || 0) * M_PER_IN);
  const m2 = s.match(/^([\d.]+)\s*["”]$/);           // solo pollici
  if (m2) return parseFloat(m2[1]) * M_PER_IN;
  const m3 = s.match(/^(-?[\d.]+)[\s-]+([\d.]+)$/);  // "39 4" o "39-4"
  if (m3) return (parseFloat(m3[1]) * M_PER_FT) + (parseFloat(m3[2]) * M_PER_IN);
  const n = parseFloat(s);                            // numero nudo = piedi
  return isNaN(n) ? null : n * M_PER_FT;
}

// metri → stringa da mostrare nell'input, secondo l'unità corrente
function formatDim(m, units) {
  if (m === null || m === undefined || m === '') return '';
  return units === 'ft' ? mToFtIn(m) : String(Number(m).toFixed(2)).replace('.', ',');
}
```

## Modifiche ai punti esistenti

**`toggleUnits()` (~riga 1007)** — oggi chiama solo `applyLang()`. Deve anche
**riformattare i 4 campi** leggendo il valore canonico da `data` e riscrivendo l'input:
```js
function toggleUnits() {
  currentUnits = (currentUnits === 'm') ? 'ft' : 'm';
  localStorage.setItem('showriderUnits', currentUnits);
  DIMENSION_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = formatDim(data[id], currentUnits);
  });
  applyLang();
}
```

**`autoSave()` (~riga 1536)** — oggi fa `data[id] = el.value` per tutti i campi.
I 4 dimensionali vanno **convertiti in metri** prima di salvare:
```js
fields.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  data[id] = DIMENSION_FIELDS.includes(id) ? parseToM(el.value, currentUnits) : el.value;
});
```

**`renderAll()` (~riga 1336)** — oggi fa `el.value = data[id] || ''`.
I 4 dimensionali vanno **formattati**:
```js
el.value = DIMENSION_FIELDS.includes(id) ? formatDim(data[id], currentUnits) : (data[id] || '');
```

**Le label (righe 530-533)** — già gestite in `applyLang()` (righe 992-995), che sostituisce
`(m)` con `(ft)`. In notazione piedi-e-pollici l'etichetta corretta è **`(ft-in)`**,
non `(ft)`. Aggiornare le chiavi `palcoLarg`/`palcoProf`/`palcoAlt`/`graticcia` in
`STRINGS.it` e `STRINGS.en`.

## Migrazione dei dati esistenti — NON saltare questo punto
Le schede già salvate hanno i 4 campi come **stringhe senza unità** ("12", "9,5").
Vanno interpretate come metri e convertite a `Number`, **una volta sola**.

Aggiungere `schemaVersion` a `makeDefault()` e una funzione di migrazione chiamata in
`loadLibrary()` / `openShow()` / `handleFile()`:
```js
function migrateShow(s) {
  if (!s.schemaVersion) {
    DIMENSION_FIELDS.forEach(id => {
      if (typeof s[id] === 'string') {
        const n = parseFloat(s[id].replace(',', '.'));
        s[id] = isNaN(n) ? null : n;   // il dato legacy è sempre in metri
      }
    });
    s.schemaVersion = 2;
  }
  return s;
}
```
Senza questo, alla prima apertura in modalità imperiale una scheda vecchia con "12" viene
letta come 12 piedi e riscritta come 3,66 m. **Il dato si corrompe in silenzio.**

## PDF — solo l'unità selezionata *(decisione Umberto)*
⚠️ **Conseguenza da non ignorare:** se il PDF riporta una sola unità, quell'unità
**deve essere sempre visibile** accanto al numero. Un rider che dice `Larghezza 12,00`
senza il `m` è peggio di uno mal tradotto: chi legge assume l'unità del proprio paese.
Verificare che `data-print-label` e le label dei 4 campi portino l'unità anche in stampa.

## Come si verifica
1. Modalità metrica: scrivere `12` in Larghezza → passare a imperiale → deve leggersi `39'-4"`
2. Tornare a metrica → deve leggersi di nuovo `12,00` (nessuna deriva di arrotondamento)
3. In imperiale scrivere `39'-4"` → passare a metrica → circa `12,00`
4. Esportare il JSON: il valore dentro deve essere **sempre in metri**, in entrambe le modalità
5. Aprire una scheda salvata **prima** del fix: la larghezza deve restare quella giusta
6. Stampare in entrambe le modalità: l'unità deve comparire nel PDF

---

# BLOCCO 5 · Prima della v1.1 (P1 residui)

- **`undoStack` non azzerato al cambio spettacolo** → i dati di uno show finiscono in un
  altro. Aggiungere `undoStack.length = 0;` in `openShow()`, `createFromTemplate()`,
  `handleFile()`, `init()`.
- **Cmd+Z in conflitto**: `main.js:59-60` registra `role:'undo'`/`role:'redo'` nativi che
  intercettano prima del listener JS (riga 840-844). Togliere i due `role` e usare
  `executeJavaScript('undo()')` come già si fa per le altre voci di menu. E far ignorare
  l'evento al listener quando il focus è dentro un campo di testo.
- ~~Toggle metri/piedi~~ → **spostato al BLOCCO 4-bis**, con specifica completa.
- **PDF e menu non tradotti**: gli header di sezione del PDF vengono da `data-print-label`
  statici italiani (righe 432, 509, 525, 552, 580, 606, 626, 640, 665, 681, 691); la
  copertina ha `Data:`/`Repliche:`/`Stato:` hardcoded (424-427); le date usano
  `toLocaleDateString('it-IT')` fisso in 4 punti (1159, 1267, 1498, 1518); il menu Electron
  (`main.js:37-79`) è interamente in italiano; il tab Documenti (`DOC_LABELS`, 720-725) pure.
- **`resetChecklist()` (riga 1446)**: aggiungere `pushUndo();` come prima riga. Una riga.
  Oggi azzera 15 spunte senza conferma e senza possibilità di annullare.

---

# BLOCCO 6 · Quando c'è tempo (P2)

**Accessibilità** — 0 occorrenze di `<label for=` su 47 label; le 11 tab sono `<div onclick>`
senza `tabindex` né `role="tab"` (non navigabili da tastiera); modali senza `role="dialog"`,
focus trap, chiusura con Escape; la scelta del template richiede obbligatoriamente il mouse.

**Contrasto** — `--text-dim` fallisce WCAG AA in entrambi i temi (3.72:1 dark, 3.54:1 light,
serve 4.5:1) su label dei campi, metadati, header di tabella. In tema chiaro anche
`--accent` #b87010 sui titoli delle card: 3.91:1. *Si legge in teatro, spesso al buio: qui
il contrasto è ergonomia, non adempimento.*

**Sicurezza residua** — nessuna CSP (0 occorrenze); `lucide` da `unpkg.com` senza SRI
(riga 310) in un'app che dovrebbe girare offline → scaricarlo in locale;
`shell.openExternal` (`main.js:27-30`) senza allow-list di schema.

**Electron 31 è fuori supporto** (maggio 2024, mantenute solo le ultime 3 major). Nessuna
patch Chromium arriva più. Da pianificare un bump con test di regressione.

**Manutenibilità** — lista di 48 id campo duplicata identica in `renderAll()` (1323-1334) e
`autoSave()` (1524-1535): chi aggiunge un campo e aggiorna una sola lista ottiene un campo
che non si salva, senza errori. Estrarre in `const FIELD_IDS`.

**5 chiavi i18n orfane** — tradotte in IT ed EN ma mai agganciate a un `data-t`:
`libEmpty1`, `libEmpty2` (righe 365-367), `lCrewComp`, `lNumPersone` (657-658),
`ctLogistica` (667). Fix banale: aggiungere l'attributo.

**Minori** — `URL.revokeObjectURL()` mai chiamato in `exportJSON()`; `updateUnitsBtn()`
chiamata due volte in `applyLang()` (984 e 998); nome file export non sanitizzato;
terminologia EN dei ruoli precompilati da rivedere (*Datore luci* → Lighting Operator / LX,
*Macchinista* → Stagehand); nessuna indicazione all'utente di dove risiedano fisicamente i
dati; nessun "esporta tutta la libreria" (il backup si fa una scheda per volta).
