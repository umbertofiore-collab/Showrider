# SHOWRIDER — Piano di lavoro
25 luglio 2026 · da usare insieme a `SHOWRIDER_FIX_LIST.md`

**Obiettivo:** portare ShowRider a uno stato pubblicabile — con una release scaricabile —
in **5 sessioni**. Ogni sessione è chiusa: si apre, si fa una cosa, si verifica, si committa.

---

## SETUP — 10 minuti, una volta sola

```bash
cd ~/Desktop/showrider          # o dove tieni il repo
git checkout -b showrider-fix-luglio
git tag pre-fix-2026-07-25      # punto di ritorno sicuro
```

Copiare `SHOWRIDER_FIX_LIST.md` dentro il repo, così Codex ce l'ha sotto mano.

**Regole per tutta la durata del lavoro:**
- una sessione = un blocco = un commit
- se la verifica non passa, **non si va avanti**: si sistema o si torna indietro
- Codex cerca gli **snippet**, mai i numeri di riga (slittano a ogni modifica)
- niente refactor non richiesti, niente "già che c'ero"

---

## SESSIONE 1 · XSS *(la più urgente)*

**Prompt per Codex** — copia e incolla:

> Apri `SHOWRIDER_FIX_LIST.md`, BLOCCO 1. Applica i 5 punti (1.1 → 1.5) su `index.html`.
> Cerca gli snippet, non fidarti dei numeri di riga.
> Non toccare nient'altro nel file. Non fare refactor.
> Al termine elenca le modifiche fatte, una riga per modifica, con lo snippet prima/dopo.

**Verifica — falla tu, non fidarti:**

1. Crea un file `test-xss.json` con dentro:
   ```json
   {"titolo":"test xss","id":"x\"><b>BOOM</b>"}
   ```
2. Apri l'app → "Apri" → carica il file
3. Torna alla libreria

✅ **Passa se:** vedi il testo grezzo `x"><b>BOOM</b>` come id, nessun grassetto.
❌ **Non passa se:** compare "BOOM" in grassetto → l'HTML viene ancora interpretato.

Prova anche a importare un JSON con `"crono": "non-un-array"` — l'app non deve crashare.

**Commit:**
```
fix: escape XSS su show.id, crono.ora, pers.qta, checklist.id + validazione import JSON
```

---

## SESSIONE 2 · PDF leggibile

**Prompt per Codex:**

> Apri `SHOWRIDER_FIX_LIST.md`, BLOCCO 2. Applica 2.1, 2.2 e 2.3 su `index.html`.
> Il 2.1 è CSS dentro `@media print`: aggiungilo in cima al blocco, non riscrivere le
> regole esistenti. Il 2.3 richiede una funzione che marchi i pannelli vuoti prima della
> stampa e tolga la classe dopo. Non toccare altro.

**Verifica:**

1. App in **tema scuro** (il default — è lì che il bug si vede)
2. Compila 3-4 campi, lascia vuoti i tab Video ed Elettrico
3. Cmd+P → guarda l'anteprima

✅ **Passa se:** testo nero leggibile, niente fondi scuri, niente pagine per i tab vuoti,
il nome file proposto contiene il titolo dello spettacolo.
❌ **Non passa se:** il testo è grigio chiaro, o vedi pagine quasi bianche.

Ripeti in tema chiaro: deve funzionare uguale.

**Commit:**
```
fix: PDF leggibile in stampa da tema scuro + nome file + salta tab vuoti
```

---

## SESSIONE 3 · Perdita dati

**Prompt per Codex:**

> Apri `SHOWRIDER_FIX_LIST.md`, BLOCCO 3. Applica 3.1, 3.2 e 3.3 su `index.html`.
> Per il 3.2 aggiungi le chiavi `saveFailed` e `saveFailedToast` sia in `STRINGS.it`
> sia in `STRINGS.en`, e lo stile `.autosave-dot.error` (rosso) al CSS.
> Per il 3.3 aggiungi il flush anche in `createFromTemplate()` e `handleFile()`.
> Non toccare altro.

**Verifica — tre prove separate:**

**A) Flush alla chiusura**
Scrivi in un campo → chiudi la finestra entro mezzo secondo → riapri.
✅ La modifica c'è.

**B) Autosave che fallisce non mente**
Console dell'app (Cmd+Alt+I), incolla:
```js
const orig = localStorage.setItem.bind(localStorage);
localStorage.setItem = () => { throw new Error('quota simulata'); };
```
Poi scrivi in un campo e aspetta un secondo.
✅ Compare un avviso rosso / toast di errore.
❌ Il pallino resta su "Salvataggio…" in silenzio → non è stato fatto.
Ripristina con `localStorage.setItem = orig;`

**C) Libreria corrotta non cancella tutto**
Console:
```js
localStorage.setItem('showriderLibrary', '{rotto');
```
Ricarica l'app, scrivi qualcosa.
✅ Avviso esplicito, il dato rotto è finito in una chiave di backup, l'autosave non
sovrascrive finché non confermi.
❌ L'app riparte come se non ci fosse mai stato niente → il fix non c'è.

**Commit:**
```
fix: protezione perdita dati — flush su chiusura, try/catch autosave, recovery libreria corrotta
```

---

## SESSIONE 4 · Unità di misura *(la più delicata)*

**Prompt per Codex:**

> Apri `SHOWRIDER_FIX_LIST.md`, BLOCCO 4-bis. Implementa la specifica completa.
> Le tre funzioni (`mToFtIn`, `parseToM`, `formatDim`) sono già scritte nella spec: usale
> come sono. Aggiungi `const DIMENSION_FIELDS`. Modifica `toggleUnits()`, `autoSave()` e
> `renderAll()` come indicato.
> **La migrazione (`migrateShow` + `schemaVersion`) è obbligatoria**: senza, le schede già
> salvate si corrompono al primo cambio unità. Chiamala in `loadLibrary()`, `openShow()`
> e `handleFile()`.
> Aggiorna le chiavi label da `(ft)` a `(ft-in)` in `STRINGS.it` e `STRINGS.en`.
> Non toccare altro.

**Verifica — i 6 passi della spec, tutti:**

| # | Prova | Atteso |
|---|---|---|
| 1 | Scrivi `12` in metri → passa a imperiale | `39'-4"` |
| 2 | Torna a metrico | `12,00` — nessuna deriva |
| 3 | In imperiale scrivi `39'-4"` → passa a metrico | ~`12,00` |
| 4 | Esporta JSON in **entrambe** le modalità | il numero dentro è **sempre in metri** |
| 5 | Apri una scheda salvata **prima** del fix | la larghezza è ancora quella giusta |
| 6 | Stampa in entrambe le modalità | l'unità compare nel PDF |

Prova anche il parser generoso: `39' 4"`, `39'4`, `39-4`, `39 4`, `39` devono funzionare tutti.

> ⚠️ **Il passo 5 è quello che tutti saltano.** Prima di iniziare questa sessione,
> crea 2-3 schede con misure note e annotale su un foglio. Sono il tuo test di
> non-regressione.

**Commit:**
```
feat: conversione metri ↔ piedi-pollici con storage canonico in metri + migrazione schemaVersion 2
```

---

## SESSIONE 5 · Release *(può girare in parallelo alle altre)*

Questa tocca file completamente diversi — `package.json`, `COSTRUISCI_APP.command`,
`.github/workflows/`, `README.md`. **Zero conflitto con `index.html`**: se vuoi, falla fare
a un agente separato mentre tu lavori sulle altre sessioni.

**Prompt:**

> Apri `SHOWRIDER_FIX_LIST.md`, BLOCCO 4. Applica 4.1 → 4.6.
> Il 4.4 è un file nuovo: `.github/workflows/release.yml`, il YAML è già nella spec.
> Il 4.5 è una riscrittura della sezione Installazione del README: la sezione attuale va
> rinominata "Build da sorgente — per sviluppatori" e spostata in fondo; sopra va la nuova
> sezione "Scarica e installa" per utenti non tecnici, **in italiano e in inglese**, con la
> spiegazione del warning macOS Gatekeeper e di SmartScreen su Windows.
> Non toccare `index.html`.

**Verifica:**

```bash
npm ci                    # deve funzionare (serve package-lock.json committato)
npm run dist              # build locale
```
Poi:
```bash
git tag v1.0.0 && git push origin v1.0.0
```
Guarda la tab Actions su GitHub.

✅ **Passa se:** dopo qualche minuto la pagina Releases mostra `.dmg`, `.exe` e `.AppImage`.
✅ **Prova finale:** scarica il `.dmg` **da un altro Mac** (o da un utente diverso) e
riesci ad aprirlo seguendo solo il README.

**Commit:**
```
build: pipeline di release GitHub Actions + fix script + README per utenti non tecnici
```

---

## DOPO LE 5 SESSIONI

**Mandami il diff.** Faccio la revisione con la griglia concordata: ✅ funziona /
⚠️ scricchiola / ❌ da cambiare / 🔁 da rimandare a Codex.

Poi si può fare il merge e mettere ShowRider sul sito.

---

## SE QUALCOSA VA STORTO

```bash
git checkout .                 # butta le modifiche non committate
git reset --hard pre-fix-2026-07-25   # torna al punto zero (⚠️ perde tutto il lavoro)
```

Se una verifica non passa: **non passare al blocco dopo**. Un fix mezzo fatto è peggio
del bug originale, perché ti fa credere di averlo risolto.

---

## PROMEMORIA DI RUOLO

| Chi | Fa cosa |
|---|---|
| **Tu** | decidi, apri l'app, guardi, committi |
| **Codex** | scrive il codice, un blocco alla volta |
| **Agente di verifica** *(opzionale, Haiku)* | ricontrolla che il blocco sia stato applicato davvero |
| **Io** | giudico il risultato, non scrivo codice |

L'unica cosa che nessun agente può fare al posto tuo è **aprire l'app e guardare**.
Il PDF va stampato per davvero, le unità vanno digitate a mano. È lì che si scoprono
le cose che il codice non dice.
