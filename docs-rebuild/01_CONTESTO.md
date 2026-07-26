# CONTESTO — da leggere prima di toccare il codice
Per Codex, o per chiunque lavori su ShowRider senza conoscerlo.

---

## COS'È SHOWRIDER

App desktop Electron per creare e gestire **schede tecniche** (technical rider) di
spettacoli dal vivo. Raccoglie in un unico documento tutto ciò che serve alla produzione:
palco, audio, luci, video, elettrico, personale, checklist pre-show.

**Repo:** `umbertofiore-collab/Showrider` · **Licenza:** MIT · **Versione:** 1.0.0

**Funzionalità:** libreria multi-show, 11 tab tecnici, 6 template (teatro, concerto,
danza, stand-up, opera/musical, multimediale), QR code, export PDF, import/export JSON,
undo, bilingue IT/EN, toggle metri/piedi, tema scuro/chiaro, autosalvataggio.

---

## CHI LO USA — e perché conta

**Tecnici del suono, datori luci, direttori di scena, tour manager.**
Non sviluppatori. Non appassionati di software. Gente che ha un montaggio alle 8 del
mattino e uno spettacolo alle 21.

Tre conseguenze che devono guidare ogni decisione tecnica:

**1. Il PDF è il prodotto.** Una scheda tecnica esiste per essere esportata, mandata via
mail al teatro ospitante e stampata. Se il PDF viene male, l'app non serve — per quanto
curata sia l'interfaccia.

**2. I dati sono ore di lavoro.** Perdere una scheda tecnica significa rifare da capo un
lavoro di ore, spesso sotto scadenza. La perdita dati è il worst case assoluto, più grave
di qualunque crash: un crash lo vedi, un salvataggio fallito no.

**3. Si usa in teatro, di fretta, spesso al buio.** Contrasto, leggibilità ed ergonomia
non sono adempimenti formali — sono la differenza tra un'app usabile in sala e una no.

**4. Il mercato è internazionale.** Il teatro tecnico anglosassone è dove sta il valore.
L'inglese e le unità imperiali non sono un vezzo: sono requisiti. Un rider mezzo tradotto
o con misure ambigue fa una figura precisa.

---

## STACK E VINCOLI

```
Electron  ·  HTML/CSS/vanilla JS  ·  localStorage  ·  electron-builder
```

| File | Cosa | Dimensione |
|---|---|---|
| `index.html` | **tutta l'app**: CSS + markup + JS + libreria QR inline | 1633 righe / 104 KB |
| `main.js` | processo main Electron | 92 righe |
| `package.json` | config + electron-builder | 58 righe |
| `qrcode.min.js` | libreria QR — **duplicata**, esiste anche inline nell'HTML | 20 KB |
| `COSTRUISCI_APP.command` | script di build per macOS | — |

**Nessun framework. Nessun bundler. Nessuna dipendenza runtime.**
È una scelta, non una mancanza: rende la build banale e l'app leggera. Va rispettata —
**non introdurre React, Vue, webpack, TypeScript o qualunque altra cosa richieda un build
step.** Se una modifica sembra richiederlo, è la modifica ad essere sbagliata.

---

## REGOLE DI LAVORO — non negoziabili

**1. Un blocco alla volta.** I blocchi sono definiti in `03_FIX_LIST.md`. Si applica un
blocco, si verifica, si committa. Non si accorpano.

**2. Cercare gli snippet, non i numeri di riga.** I numeri di riga nella documentazione
si riferiscono allo stato attuale del file: dopo la prima modifica slittano tutti.
Usare il testo del codice come ancora.

**3. Non toccare nulla che non sia nel blocco.** Niente refactor spontanei, niente
riordino degli import, niente "già che c'ero ho sistemato anche…". Ogni riga toccata
fuori dal mandato allunga la revisione e nasconde gli errori veri.

**4. Riportare cosa è stato fatto.** Al termine di ogni blocco: elenco delle modifiche,
una riga ciascuna, con snippet prima/dopo. Se qualcosa non è stato fatto, dirlo — non
lasciarlo intuire.

**5. Se qualcosa non torna, fermarsi e chiedere.** Meglio un blocco in sospeso che un
blocco fatto male. Non inventare l'interpretazione mancante.

**6. Onestà sulle verifiche.** Dichiarare sempre cosa è stato provato e cosa no.
"Dovrebbe funzionare" non è una verifica.

---

## COSA È GIÀ FATTO BENE — non rompere

L'audit ha trovato 24 problemi, ma il codice di partenza è **più pulito della media**.
Queste cose funzionano già e vanno preservate:

- zero `console.log` dimenticati, zero `TODO` abbandonati, zero `==` laschi
- `nodeIntegration: false` + `contextIsolation: true`, nessun `remote`,
  `window.open` intercettato con `setWindowOpenHandler`
- la funzione `esc()` **esiste già** ed è applicata nella maggior parte dei punti —
  il problema è la copertura incompleta, non l'assenza di consapevolezza
- nessun memory leak da listener (pattern "distruggi e ricrea" su nodi sempre nuovi)
- undo stack con snapshot combinato, mai stati parziali incoerenti
- `makeDefault()` + backfill: schede vecchie e JSON di versioni precedenti non crashano
- il QR contiene deliberatamente poco (una vCard, non la scheda intera) — scelta giusta
- `mac.target.arch` già con `x64` + `arm64`
- l'app è già bilingue dove conta di più

**Il lavoro è chiudere i buchi, non riscrivere.**

---

## UNA NOTA SUL PERCHÉ

ShowRider è il progetto pubblico e gratuito di **Low Confidence Club**. Gli altri progetti
del club restano riservati; questo no — è quello che chiunque può scaricare e usare.

Significa che per molte persone **ShowRider sarà il primo contatto con il club**.
Un'app che perde i dati, o un `.dmg` che dice "app danneggiata" senza una spiegazione,
non è solo un bug: è la prima impressione.

Vale la pena farlo bene.
