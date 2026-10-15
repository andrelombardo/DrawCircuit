# Installazione web e dati locali

DrawCircuit si carica dalla rete e conserva circuiti, libreria personale e preferenze nel browser. Non registra service worker, non precachea risorse e non ha un sistema di aggiornamento: a una nuova apertura il browser carica normalmente il sito. La normale cache HTTP del browser resta governata dall’host; non è una cache offline gestita dall’app. Un editor già aperto può continuare a lavorare con le risorse già in memoria, ma l’avvio senza rete non è garantito.

`public/manifest.webmanifest` mantiene nome, icone, colori e avvio standalone. La rinomina del repository cambia il percorso pubblico in `/DrawCircuit/`, sensibile alle maiuscole. `start_url` e `scope` sono relativi e funzionano sul nuovo percorso. I dati locali appartengono all’origine `https://andrelombardo.github.io`, che resta invariata. La PWA installata al vecchio indirizzo può richiedere una nuova installazione dal nuovo URL.

## Browser

| Browser                             | Installazione                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Chrome / Edge compatibili           | Menu nativo di installazione del sito; presentazione del pulsante dipendente da browser e piattaforma |
| Safari su macOS Sonoma o successivi | File → Aggiungi al Dock                                                                               |
| Safari su iPhone / iPad             | Condividi → Aggiungi alla schermata Home; scegliere l’apertura come app web dove proposta             |
| Firefox                             | Supporto e menu dipendono dalla piattaforma; il manifest non assicura un prompt di installazione      |

Un service worker non è necessario per installare il sito nei browser supportati. Chrome ha rimosso il requisito del fetch handler per l’installazione dal menu (Android 108, desktop 112); l’installazione non implica che venga mostrato un prompt automatico. Safari può aggiungere siti al Dock anche senza worker. Non sono stati introdotti pulsanti o flussi di installazione personalizzati.

Fonti consultate il 15 ottobre 2026: [MDN: installabilità](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Chrome: criteri d’installazione](https://developer.chrome.com/blog/update-install-criteria), [WebKit: web app su Mac](https://webkit.org/blog/15443/news-from-wwdc24-webkit-in-safari-18-beta/). La verifica locale del manifest e degli asset non certifica l’installazione su ogni dispositivo fisico.

## Dismissione delle vecchie copie offline

Sono necessari due punti d’ingresso, perché una vecchia shell in cache può impedire l’esecuzione del nuovo JavaScript:

- `public/sw.js`: al vecchio URL del worker, il browser trova un sostituto che si attiva subito, acquisisce i client senza gestire fetch, elimina il vecchio precache e si disinstalla. Non ricarica le finestre: modifiche in corso e stato in memoria restano intatti.
- `src/pwa/retireLegacyOffline.ts`: quando si carica il nuovo sito in produzione, rimuove le registrazioni con **scope esatto dell’app o dell’alias storico `/drawcircuit/`** e **script `sw.js` esatto**, poi elimina gli eventuali precache orfani. Fallimenti di accesso non bloccano l’editor e saranno ritentati alla visita successiva, senza timer o flag persistenti.

Le cache rimosse corrispondono esclusivamente al nome storico Workbox `workbox-precache-v<numero>-<scope esatto>`. Non vengono eliminate cache di altri scope, cache con prefissi diversi, localStorage, IndexedDB, documenti, blocchi, preferenze o copie di recupero. Nessun uso di `Clear-Site-Data`, nessuna cancellazione generale e nessuna modifica della struttura dei documenti.

La rinomina GitHub Pages non garantisce un redirect dal vecchio percorso. Se `/drawcircuit/sw.js` non è più raggiungibile, il browser non può scaricarvi il file di dismissione: aprire [il nuovo sito](https://andrelombardo.github.io/DrawCircuit/) esegue la pulizia anche del vecchio scope, senza cambiare i dati locali. Un worker sul nuovo scope non può acquisire le finestre del vecchio scope. Non sono stati aggiunti domini o repository di redirect.

La rimozione non può raggiungere una vecchia installazione che rimane completamente senza rete. Alla successiva connessione, il controllo aggiornamenti del browser può raggiungere `sw.js`. Tempi e controlli del browser non sono forzabili dal sito; il codice già in esecuzione in una vecchia finestra resta quello caricato fino alla sua normale riapertura. Dopo il subentro del worker di dismissione, non vengono più servite risorse dal vecchio precache.

### Durata della migrazione

Introduzione: 15 ottobre 2026. Prima revisione della necessità: 15 ottobre 2027. Il codice nel main può essere rimosso quando non occorre più ripulire i profili legacy. Per il piccolo endpoint `sw.js`, non esiste una scadenza universale sicura: un’installazione può restare inattiva per anni. Conservarlo finché si intende recuperare quei profili; rimuoverlo solo accettando esplicitamente che i profili mai riaperti possano mantenere il vecchio worker. Non registra alcuna nuova installazione e non dipende da Workbox.
