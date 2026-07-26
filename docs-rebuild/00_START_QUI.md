# SHOWRIDER REBUILD — Start qui
25 luglio 2026

Questa cartella contiene tutto il necessario per portare ShowRider da
"progetto su GitHub che nessuno può scaricare" a **app pubblicabile con una release vera**.

---

## I DOCUMENTI, IN ORDINE

| File | Cos'è | A chi serve |
|---|---|---|
| **00_START_QUI.md** | questo file | a te, per orientarti |
| **01_CONTESTO.md** | cos'è ShowRider, chi lo usa, regole del progetto | **a Codex, da leggere per primo** |
| **02_AUDIT.md** | i 24 problemi trovati, verificati uno per uno | a te, per capire il perché |
| **03_FIX_LIST.md** | come si sistemano, con snippet prima/dopo | **a Codex, è l'ordine di lavoro** |
| **04_PIANO_LAVORO.md** | 5 sessioni, prompt pronti, verifiche, commit | a te, per condurre il lavoro |

---

## SE HAI FRETTA — i 3 minuti che contano

**Il problema.** ShowRider è finito e funziona, ma ha zero release pubblicate:
per usarlo bisogna clonare il repo e buildare con Node. Il pubblico target sono datori
luci, fonici e direttori di scena — non lo faranno mai. **L'app di fatto non esiste
per chi dovrebbe usarla.**

**Cosa blocca il rilascio.** Quattro cose, tutte verificate riga per riga:

1. **XSS sfruttabile** aprendo un JSON ricevuto via mail. In Electron non è un alert:
   è codice che gira sul computer di chi apre il file.
2. **Perdita dati** — un blob `localStorage` corrotto fa cancellare all'app l'intera
   libreria, in silenzio, alla prima lettera battuta dopo un riavvio.
3. **Il PDF stampato dal tema di default è illeggibile** — testo grigio chiarissimo su
   bianco. E il PDF *è* il prodotto: una scheda tecnica esiste per essere mandata al
   teatro ospitante e stampata.
4. **Non esiste una pipeline di release** — manca `repository` in `package.json`, manca
   `package-lock.json`, e lo script di build ha un bug che nasconde i fallimenti.

Più una quinta, promossa a pari livello:

5. **Il toggle metri/piedi non converte i valori**, cambia solo l'etichetta. Significa
   spedire schede tecniche con misure sbagliate. Un venue che legge "8 ft" invece di
   "8 m" manda la crew a montare in un posto che non esiste.

**Quanto costa.** Cinque sessioni. Sono quasi tutte correzioni puntuali, non refactor.

---

## COME SI LAVORA

**Una sessione = un blocco = un commit.** Sequenziale, non in parallelo: quasi tutti i
fix toccano lo stesso file (`index.html`, 1633 righe) e agenti concorrenti si
sovrascriverebbero a vicenda.

**Unica eccezione:** la sessione 5 (release) tocca solo `package.json`, lo script di
build, il workflow GitHub e il README. Quella può girare in parallelo.

**Dopo ogni blocco si verifica.** In `04_PIANO_LAVORO.md` ogni sessione ha una prova
concreta da fare a mano — non "sembra a posto", ma "incolla questo in console e guarda
cosa succede". Se la verifica non passa, **non si passa al blocco dopo**: un fix mezzo
fatto è peggio del bug, perché ti fa credere di averlo risolto.

---

## PRIMA DI INIZIARE

```bash
cd ~/Desktop/showrider          # o dove tieni il repo
git checkout -b showrider-fix-luglio
git tag pre-fix-2026-07-25      # punto di ritorno sicuro
```

E prepara il test di non-regressione per la sessione 4: **crea due o tre schede con
misure note e scrivitele su un foglio.** Senza, non puoi verificare che la migrazione
delle unità non abbia corrotto i dati esistenti — ed è esattamente lì che si corrompono,
in silenzio.

---

## QUANDO HAI FINITO

Manda il diff a Claude per la revisione. Griglia concordata:
**✅ funziona** · **⚠️ scricchiola** · **❌ da cambiare** · **🔁 da rimandare a Codex**

Poi merge, release, e ShowRider può andare sul sito.
