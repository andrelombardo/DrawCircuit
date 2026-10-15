# DrawCircuit esclusivamente web — verifica del 15 ottobre 2026

Questo rapporto documenta la verifica locale iniziale, prima della successiva richiesta di commit, pubblicazione e rinomina del repository in `DrawCircuit`. Per indirizzo e procedura attuali vedere la [guida di pubblicazione](../releases.md). Le prove browser al vecchio percorso restano evidenze storiche.

Modifiche locali applicate alla revisione attuale `fca0114`, senza ripristinare versioni precedenti. L’editor conserva interfaccia, dati e formati esistenti. Non sono stati eseguiti commit, push, deployment o modifiche alle risorse remote; il sito pubblico rappresenta ancora l’ultima pubblicazione precedente.

## Rimozioni e dipendenze

- Eliminati `src-tauri/` (Rust, Cargo, configurazioni, capability e icone native), `src/desktop/` (bootstrap, storage su disco, menu, finestre, clipboard/file nativi, updater e archivio nativo) e i relativi test esclusivi.
- L’archivio usato dall’**export web** è stato preservato in `src/model/archive.ts`, con stesso formato `drawcircuit-archive` versione 1 e parser validante. I test di round trip e input invalidi sono conservati in `tests/archive.test.ts`. La fusione di archivi, usata solo dall’import nativo, è stata rimossa.
- Eliminati `scripts/package-macos.mjs`, `scripts/release/`, `release.config.json`, comandi `desktop:*`, `build:desktop-ui`, `release:plan`, `test:release` e tutta la generazione di versioni/canali/tag/manifest di aggiornamento.
- Rimosse le dipendenze `@tauri-apps/api`, `@tauri-apps/cli`, `@tauri-apps/plugin-clipboard-manager`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-updater` e `vite-plugin-pwa`. Nessuna nuova dipendenza; nessuna versione dei pacchetti rimasti è stata cambiata.
- Eliminati `src/pwa/config.ts`, `PwaStatus.tsx`, `UpdateDialog.tsx` e relativo CSS, Workbox, registrazione/controlli periodici degli aggiornamenti, notifiche di update, precache e funzionamento offline gestito dall’app.
- Rimossi condizioni, import e CSS esclusivi nativi da bootstrap, editor, pannelli, aiuto, download, PNG e rendering matematico. `src/math/vectorLayout.ts` era esclusivo del canvas nativo; il layout vettoriale degli export web in `src/tikz/canvasText.ts` è conservato.
- Il grafo statico degli import, comprendendo quelli dinamici, ha individuato tre moduli privi di percorso da `main.tsx`: `DocumentTitle.tsx`, `toolbarActions.ts`, `componentMappings.ts`. Eliminati insieme ai test esclusivi del vecchio campo titolo e della mappa toolbar inutilizzata. Il test del mapping TikZ verifica ora direttamente il catalogo e l’export reale. Gli attuali controlli di proprietà restano coperti dai test di interazione.
- Rimosse quattro icone PNG senza utilizzatori (`20`, `24`, `64`, `128` px); restano favicon 16/32/48, Apple Touch 180, icone PWA 192/512 e maskable 512. Il generatore mantiene queste risoluzioni e lo stesso master grafico.
- I vecchi output locali `dist-desktop/` e `release-artifacts/` sono stati spostati fuori dal repository in `/tmp/drawcircuit-web-audit/obsolete-*`; non sono sorgenti del progetto.

## Architettura e distribuzione

Vite usa React, percorsi relativi e il chunk KaTeX esistente. Manifest statico in `public/manifest.webmanifest`, stesso URL, nome, icone, scope e avvio standalone. Nessun nuovo flusso di installazione o cambiamento grafico.

La CI contiene solo build e deployment Pages: installazione pulita, ESLint, test, TypeScript/build e upload di `dist/`. Le pull request validano senza pubblicare; solo `main` può pubblicare. Restano la serializzazione dei deployment, Node fissato in `.nvmrc`, cache npm e permessi minimi. Il timeout CI di 30 secondi per i workflow DOM mantiene il margine già presente nella pipeline precedente; i test locali passano anche con il timeout predefinito.

Aggiornati README, AGENTS, guida release, note sulle funzionalità e identità grafica. Aggiunte [architettura](../architecture.md) e [guida PWA](../pwa.md). I rapporti degli audit precedenti sono conservati come evidenze storiche, non come istruzioni correnti.

## Migrazione e dati

Resta **solo un endpoint transitorio di dismissione** al vecchio URL `sw.js`: non viene registrato dal nuovo sito, non intercetta fetch e non memorizza risorse. Il browser lo usa per sostituire il vecchio worker, cancellare il suo precache e disinstallarlo. Nessun reload forzato dei circuiti aperti. Il nuovo main ripulisce inoltre le registrazioni legacy esatte e i precache orfani, soltanto in produzione.

Il nome storico delle cache Workbox è verificato anche nella cronologia della configurazione: nessuna cache runtime personalizzata. La pulizia riconosce esclusivamente `workbox-precache-v<numero>-<scope esatto>`, e il main disinstalla soltanto lo script `sw.js` allo scope esatto dell’app. Nessuna operazione su localStorage o IndexedDB. Formato documento, chiavi, autosave, recupero dei dati corrotti, preferenze, blocchi e clipboard di sessione sono conservati.

La prova browser ha installato **il vero worker della build precedente**, caricato circuito e blocco personale, mantenuto aperto l’editor, poi servito il nuovo `sw.js`. Risultati:

| Controllo                                                  | Esito                         |
| ---------------------------------------------------------- | ----------------------------- |
| Worker e precache DrawCircuit rimossi                      | PASS                          |
| Worker, cache generica e precache di un’altra app di prova | Conservati                    |
| Documento, libreria e preferenze salvati                   | Identici byte per byte        |
| Circuito e blocco visibili dopo riapertura                 | PASS                          |
| Interruzione di rete simulata con HTTP 503                 | Nessuna shell offline servita |
| Ripristino rete e riapertura                               | Circuito e blocco ritrovati   |
| Manifest, scope e icone sotto `/drawcircuit/`              | PASS                          |

Le prove sono in [migration-before](evidence/migration-before.json), [retired](evidence/migration-retired.json), [after](evidence/migration-after.json), [assenza rete](evidence/migration-no-network.txt) e [restored](evidence/migration-restored.json). La rete indisponibile è simulata dal server locale: non è una certificazione di modalità aereo su dispositivo fisico.

Per ripetere la prova, salvare il `dist/` precedente in una directory separata, compilare quello nuovo ed eseguire:

```sh
node docs/web-only-cleanup/browser-qa.mjs /percorso/dist-precedente dist
```

Aprire l’URL locale stampato e usare i cinque pulsanti in ordine. Il server è legato a `127.0.0.1`; per una nuova origine di prova impostare `DRAWCIRCUIT_QA_PORT`. L’installazione del vecchio worker avviene esclusivamente in questo harness, che non fa parte di `dist/`. La fixture è sintetica. Con `DRAWCIRCUIT_QA_RENAME=1` lo stesso harness simula anche la rinomina: il vecchio percorso smette di rispondere e l’apertura di `/DrawCircuit/` deve rimuovere worker/cache del percorso precedente senza cambiare i dati.

## Bug e audit

- Corretto un errore TypeScript effettivo nel test `precision-brace-ui`: `Array.findLast` richiedeva librerie ES2023 mentre il progetto usa ES2022. La ricerca equivalente con copia, reverse e find mantiene l’asserzione senza modificare i target del sito.
- Corretti i percorsi di audit fissati a `/private/tmp` in tre file di test: ora usano `os.tmpdir()` e `path.join()`. Linux CI non richiede più `sudo` per prepararli.
- `useEditActions` non sottoscrive più l’intero store: ascolta documento, selezione ed etichetta attiva. Un test verifica che variazioni di stato estranee non lo renderizzino, che la selezione aggiorni i menu e che le azioni usino lo stato corrente.
- Verificati import e dipendenze di produzione, cleanup di listener e observer, revoca degli object URL, cache matematiche limitate, indici e selector Zustand. Non sono stati introdotti lazy loading, nuovi layer o memoizzazioni speculative. Non sono state individuate altre perdite di memoria o regressioni dimostrabili da correggere in questo passaggio; non è stato eseguito un profilo heap/FPS su ogni browser.

## Dimensioni e prestazioni

Misure in byte, stessa macchina, Node 26.5.0, build di produzione Vite. Il gzip è la somma dei file JavaScript compressi separatamente, non una misura temporale di caricamento.

| Metrica                                             |     Prima |      Dopo | Variazione |
| --------------------------------------------------- | --------: | --------: | ---------: |
| Totale `dist/`                                      | 2.314.391 | 2.222.103 |      −4,0% |
| File in `dist/`                                     |       107 |        85 |        −22 |
| JavaScript totale, incluso il worker di dismissione |   856.686 |   783.956 |      −8,5% |
| JavaScript gzip                                     |   274.603 |   247.786 |      −9,8% |
| CSS                                                 |    91.505 |    86.971 |      −5,0% |
| Voci nel lockfile, incluse varianti opzionali       |       607 |       323 |       −284 |
| Asset nel precache Workbox                          |       118 |         0 |  Eliminato |

[Misure riproducibili](evidence/build-metrics.json). La rimozione del precache evita il download intenzionale dell’intera shell per uso offline. Le risorse matematiche e i font necessari sono conservati; non si rivendicano miglioramenti FPS o tempi di caricamento non misurati.

## Verifiche finali

| Verifica                                                                   | Esito                                   |
| -------------------------------------------------------------------------- | --------------------------------------- |
| Baseline lint, test, build                                                 | PASS: 68 file, 1.871 test               |
| `npm ci` dopo la pulizia                                                   | PASS, 0 vulnerabilità riportate         |
| `npx tsc -b --force`                                                       | PASS                                    |
| `npm run lint`                                                             | PASS                                    |
| `npm run test`                                                             | PASS: 63 file, 1.840 test               |
| `npm run build`                                                            | PASS, nessuna generazione Workbox       |
| `actionlint`                                                               | PASS                                    |
| `git diff --check`                                                         | PASS                                    |
| Richieste HTML, manifest, icone, CSS e JS in preview sotto `/drawcircuit/` | HTTP 200 e MIME corretti                |
| Confronto editor a 1440×900 e 800×900                                      | Screenshot identici, zero pixel diversi |
| DOM SVG e geometria pannelli a 1440×900                                    | Identici                                |
| Export reale TikZ, Obsidian, `.tex`, SVG sullo stesso circuito             | Identici prima/dopo                     |
| Browser: selezione, rotazione di 45°, undo, redo                           | PASS, console senza errori/warning      |

La differenza nel numero dei test deriva dalla rimozione dei sistemi dismessi e dei moduli che non partecipavano all’app, dall’aggiornamento delle risoluzioni delle icone e dall’aggiunta delle nuove regressioni; i test dell’editor, della persistenza, del catalogo e degli export restano attivi. Il pass finale comprende nuovamente un’installazione pulita e tutti i controlli. I log del pass sono conservati in `/tmp/drawcircuit-web-audit/`.

Evidenze: [confronto visivo](evidence/visual-comparison.json), [export](evidence/exports.json), [interazioni](evidence/interactions.json), [rete](evidence/network.json), [editor prima](evidence/before-1440.jpg), [editor dopo](evidence/after-1440.jpg), [migrazione](evidence/migration.jpg).

## Limiti e interventi successivi

Installazione dipendente dal browser, senza prompt personalizzati. Il manifest e i percorsi sono verificati concretamente; non è stata ripetuta l’installazione su dispositivi iOS/Android o su ogni browser desktop. Fonti e differenze sono nella [guida PWA](../pwa.md).

Una vecchia installazione completamente senza rete non può ricevere la migrazione; una vecchia finestra mantiene il JavaScript già caricato fino alla normale riapertura. Il file di dismissione deve restare raggiungibile per i profili inattivi: prima revisione della sua necessità il 15 ottobre 2027, senza scadenza automatica che lascerebbe vecchi worker attivi.

**Pubblicazione ancora da eseguire.** Queste verifiche riguardano la preview locale; non viene dichiarata una verifica pubblica di codice non distribuito. Dopo il push su `main`, attendere Pages e controllare il commit del deployment e il sito pubblico. La migrazione degli utenti reali inizierà solo dopo tale pubblicazione.

Risorse remote storiche rilevate, lasciate intatte: release [desktop-v1.0.1](https://github.com/andrelombardo/drawcircuit/releases/tag/desktop-v1.0.1), [1.0.2](https://github.com/andrelombardo/drawcircuit/releases/tag/desktop-v1.0.2), [1.0.3](https://github.com/andrelombardo/drawcircuit/releases/tag/desktop-v1.0.3), [1.0.4](https://github.com/andrelombardo/drawcircuit/releases/tag/desktop-v1.0.4), relativi tag, e tag `web-v1.0.1`/`web-v1.0.2`. L’eventuale rimozione di queste release o dei secret di firma `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` è separata e facoltativa: non serve alla nuova pipeline.

## Aggiornamento: rinomina e pubblicazione richieste

Il repository è stato rinominato in [andrelombardo/DrawCircuit](https://github.com/andrelombardo/DrawCircuit) e il remote Git locale è stato aggiornato. Il nuovo URL Pages è [https://andrelombardo.github.io/DrawCircuit/](https://andrelombardo.github.io/DrawCircuit/). README, istruzioni di sviluppo e documentazione tecnica usano i nuovi riferimenti.

La rinomina cambia il percorso del sito, senza cambiare l’origine dei dati nel browser. Il codice di migrazione riconosce ora esplicitamente anche lo scope storico `/drawcircuit/` quando si visita `/DrawCircuit/`: rimuove solo i worker `sw.js` e precache corrispondenti. Il nuovo test verifica che nomi simili, altri worker e altre cache restino intatti. Le PWA o i segnalibri al vecchio URL possono richiedere l’aggiornamento al nuovo indirizzo; non è stato introdotto un dominio o un repository di redirect.

Verifiche locali ripetute: TypeScript forzato, lint, **1.841 test** e build superati. La prova browser con `DRAWCIRCUIT_QA_RENAME=1` serve il nuovo sito sotto `/DrawCircuit/` e rende irraggiungibile il vecchio percorso: circuito, blocco e preferenze restano identici; il worker e il precache precedenti vengono rimossi e quelli dell’altra applicazione restano presenti. [Prima](evidence/rename-before.json), [dopo](evidence/rename-after.json), [dimensioni della build aggiornata](evidence/rename-build-metrics.json).

Il workflow [Deploy DrawCircuit](https://github.com/andrelombardo/DrawCircuit/actions/workflows/deploy-pages.yml) verifica e pubblica il commit inviato a `main`. Il risultato della run e la verifica del sito pubblico sono distinti dalle evidenze locali di questo rapporto.
