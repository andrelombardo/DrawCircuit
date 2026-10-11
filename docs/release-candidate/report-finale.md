# DrawCircuit — audit della release candidate

Audit del 3 ottobre 2026. Baseline: `69ae8ab7b5e7bc136d9551415a31532ab66147d6`. Nessuna nuova feature introdotta.

## 1. Executive summary

L'audit combina utilizzo reale del browser, prove nell'installazione desktop di Obsidian, compilazione LaTeX, confronto degli export, fault injection dello storage e test automatici. Le evidenze sono conservate in [evidence](evidence/); i risultati precedenti all'audit non sono stati ricontati come nuove verifiche.

Sono stati verificati e corretti **9 problemi**: **P0: 2; P1: 1; P2: 4; P3: 2**. La revisione indipendente e il retest finale della topologia sono PASS: il ponte cambia ramo secondo l’endpoint proprietario del nodo e mantiene un distacco visibile dal punto. Pubblicazione e smoke del commit delle correzioni sono **PASS**, con i limiti sotto: [verifica pubblica](evidence/public-release-smoke.json), [Actions](https://github.com/andrelombardo/drawcircuit/actions/runs/37145440142). Nei workflow universitari coperti la release candidate è utilizzabile; non viene certificata ogni combinazione di browser, engine o input hardware.

Prove già completate: **72 componenti**, **23 preset**, **19 casi LaTeX**, **53 Undo e 53 Redo** con confronto JSON esatto, stress di **820 oggetti** e quattro viewport laptop/desktop. Il test diretto Obsidian è stato eseguito su note temporanee di QA, senza modificare note personali. Anche lo stesso golden finale dei 38 passi è stato incollato e renderizzato nella UI reale. Checklist finale: **36 PASS, 1 BLOCKED (copia/incolla oggetti), 1 NOT TESTED (rete offline pubblica)**; [matrice dei 38 passi](evidence/golden-release-matrix.json). Questo conteggio non converte in PASS le prove aggiuntive bloccate.

Report di area:

- [Editor, input, UX e golden finale](editor-qa.md).
- [Libreria, preset, blocchi e topologia](library-topology-qa.md).
- [TikZ, Obsidian, SVG e confronto visivo](export-qa.md).
- [Persistence, PWA, performance e browser](persistence-pwa-performance.md).

## 2. Agents utilizzati

Il limite disponibile era quattro agenti simultanei, incluso il coordinatore. Sono state mantenute tre verifiche indipendenti in parallelo; dopo le interruzioni gli incarichi sono stati ripresi da nuovi agenti, riutilizzando e controllando le evidenze salvate. Sono stati usati nove incarichi di subagent in tre passaggi, sempre con un massimo di quattro agenti simultanei.

| Agente                                                                 | Area e prove                                                                                                                     | Risultati/problemi                                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `editor_qa` / `editor_final_pass` / `editor_release_finish`            | First use, placement, pointer, guide, selezione, sidebar, keyboard; browser reale; 60 azioni e 53 entry di storia; golden finale | Frizioni di input; incoerenza filo/nodo scoperta nell'ultimo golden                     |
| `library_topology_qa` / `library_final_pass` / `bridge_release_review` | Tutti i 72 tipi e 23 preset nel browser; terminali, rotazioni, replace, blocchi, topology e prove distruttive                    | Percorso di fili staccati; persistence blocchi; retest indipendente topologia           |
| `export_fidelity_qa` / `export_final_pass` / `export_release_finish`   | LaTeX, font, quattro modalità export, selection, compilazione, Obsidian desktop, render e misure                                 | Colore LaTeX perso; limiti del profilo CircuitikZ nativo nel plugin                     |
| Coordinatore                                                           | Baseline, code review, triage, data loss, PWA, fault injection, 820 oggetti, viewport, build, pubblicazione e live smoke         | Protezione storage, flush alla chiusura, Escape titolo, promesse PWA, parallelismo test |

Gli agenti funzionali hanno creato, trascinato, modificato, esportato e ricaricato circuiti dalla UI. Non si è trattato di sola lettura TypeScript.

## 3. Bug count

Conteggio consolidato per root cause: **9 trovati, 9 corretti; P0: 2, P1: 1, P2: 4, P3: 2**. Problemi P0/P1 del prodotto ancora aperti nei casi verificati: **0**. Documenti e blocchi con la stessa root cause non sono stati contati due volte. Il FAIL del catalogo nativo nel plugin Obsidian è una limitazione del motore riportata separatamente.

## 4. UX issues

**HIGH FRICTION:** salvataggi illeggibili sovrascritti senza avviso; ultima scrittura fallita prima della chiusura; nodo visivamente collegato a un filo che nel modello rimane separato. Sono oggetto di correzione, non di redesign.

**MEDIUM FRICTION:** filo che cambia percorso quando perde un terminale, colore LaTeX diverso nell'export, titolo con draft invisibile dopo Escape, fallimenti PWA senza gestione.

**LOW FRICTION:** lo strumento Nodo torna a Selezione dopo un inserimento mentre i componenti restano in placement; la ripetizione con Shift è spiegata nella guida. I messaggi di JSON malformato sono stati resi coerenti con la lingua dell'app. Nessun redesign implementato.

## 5. Problemi più importanti

Sono elencati i problemi effettivamente verificati: non sono stati inventati dieci bug per raggiungere un numero.

| ID / severity | Sintomo e root cause                                                                                                            | Correzione e regressione                                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RC-01 / P0    | Storage documento o blocchi corrotto: loader silenzioso apre fallback; autosave sostituisce l'originale                         | Errore visibile; copia raw univoca prima della scrittura; se il backup fallisce l'originale resta intatto. `release-candidate-persistence` e `release-candidate-block-persistence`                                                                                                                          |
| RC-02 / P0    | Chiusura prima del debounce con errore quota: il flush finale ignorava l'errore                                                 | `beforeunload` richiede avviso nativo solo su errore; stato committed durante gesture. `release-candidate-exit`                                                                                                                                                                                             |
| RC-03 / P2    | Delete terminale o export selezione di un filo fanno cambiare l'autorouting perché si perde la direzione del terminale          | Congelamento del percorso visibile prima del detach. `release-candidate-topology`; retest UI e SVG                                                                                                                                                                                                          |
| RC-04 / P2    | `\color{red}{R_2}` rosso nell'editor ma blu nell'export; la conversione KaTeX perdeva il colore delle singole parti             | Colore esplicito su glyph, regole e path; contenuti normali ereditano lo stile label. `release-export-regression`; browser e Obsidian diretto                                                                                                                                                               |
| RC-05 / P2    | Escape nasconde il draft del titolo ma lascia focus; digitazione successiva viene salvata al blur                               | Cancellazione esplicita e blur; refocus riparte dal titolo committed. `release-candidate-title`; retest browser                                                                                                                                                                                             |
| RC-06 / P3    | Import JSON sintatticamente invalido mostra eccezione inglese di `JSON.parse`                                                   | Messaggi comprensibili per documento e libreria; import rimane atomico. Test serialization e block persistence                                                                                                                                                                                              |
| RC-07 / P2    | Promesse rifiutate di update/installazione PWA senza catch                                                                      | Avviso e retry; callback dopo unmount ignorate. `pwa-update`                                                                                                                                                                                                                                                |
| RC-08 / P3    | Due workflow DOM superano 5 s con tutti i worker, pur passando invariati con due                                                | Configurazione default a due worker, coerente con CI. Nessuna asserzione o timeout locale indeboliti                                                                                                                                                                                                        |
| RC-09 / P1    | Filo libero attraversa un nodo esistente: dot senza bridge, ma nessun endpoint collegato; Nodo non ripara perché ritorna subito | Bridge basato sugli endpoint realmente condivisi; Nodo riusa il nodo esistente per split. Cinque test modello e un test UI; ponte orientato sul filo estraneo al nodo, con clearance del punto condivisa fra editor e tre export. Retest reale: 16→17 wire, quattro endpoint collegati, move/Undo/Redo PASS |

Per i problemi di data loss, [persistence-pwa-performance.md](persistence-pwa-performance.md) include passi, expected/actual, root cause, fix ed evidenza. Gli altri report conservano le riproduzioni e i retest delle rispettive aree. I fault injection sono dichiarati come tali: non è stato corrotto lo storage personale dell'utente.

## 6. Editor

Placement, ghost, anchor, inline insertion, spostamenti con connessioni, selezione multipla, label indipendenti, annotazioni elettriche e maglie sono stati provati insieme. La storia include sostituzione, waypoint, split, drag e preset/blocchi. I casi e i passaggi finali sono nel [report editor](editor-qa.md), con distinzione fra controllo della UI e test automatico.

L'ultimo golden parte da **Nuovo circuito** e conserva una checklist dei 38 passi richiesti. [Screenshot pubblico dello stesso golden](evidence/public-final-golden.jpg). Dopo reload pubblico i tre export completi coincidono byte per byte con il golden già validato. Copy/paste attraverso shortcut del browser integrato resta **BLOCKED** se il browser intercetta la clipboard prima dell'app: non è equiparato a PASS. Duplicate e copia dei formati export hanno prove separate.

## 7. Component library

**72/72 PASS nel workflow browser registrato.** Sono stati verificati 168 terminali e 672 posizioni ai quattro angoli, collegando tutti i pin. Ogni tipo dispone di screenshot e output TikZ/Obsidian/SVG. I 72 SVG sono XML valido. Le classi replacement hanno ulteriori regressioni con mapping e serializzazione.

**23/23 preset PASS**, compreso JSON salvato e reimportato. Il [report libreria](library-topology-qa.md) contiene matrici complete, semantica stella/triangolo, multi-terminal, blocchi personali e risultati distruttivi. Il PASS del catalogo non implica che ogni permutazione possibile sia stata provata.

## 8. Persistence

JSON/legacy, validazione ID/endpoints, import fallito non distruttivo, autosave/reload e storia: **PASS** nei rispettivi test. Fault injection di storage corrotto, quota e accesso negato: **PASS**, originale conservato.

Sul sito pubblico il golden conserva 44 oggetti dopo reload; i tre export coincidono byte per byte con i file validati. Il documento iniziale di 22 oggetti è stato ripristinato dalla copia privata e ricaricato; i tre export coincidono con quelli generati dalla stessa copia locale. **BLOCKED nell’ultimo smoke:** acquisizione di un nuovo download JSON; il file precedente non è stato usato per dichiarare un confronto raw JSON live.

La sequenza reale comprende 60 azioni UI, delle quali 53 producono entry Undo. Dopo 53 Undo il JSON coincide esattamente con lo stato iniziale; dopo 53 Redo coincide esattamente con lo stato finale. Le tracce e i quattro JSON sono in `evidence/ux-history-*`.

Crash forzato del processo/OS e dialogo nativo su quota reale: **NOT TESTED**. Nessuna garanzia assoluta di recupero da guasto hardware; il flusso verificato comprende esportazione JSON esplicita e avvisi sui fallimenti locali.

## 9. TikZ

Snippet, standalone e selection sono verificati tramite export della UI. Compilazione reale con il compilatore Codex: **PASS** per golden e catalogo di 288 componenti (72 tipi × quattro rotazioni). I diagnostics sono nel report export.

Il profilo nativo usa geometria/font CircuitikZ: la sua apparenza differisce dal canvas per scelta del formato. Non viene dichiarato visivamente identico all'editor. Nel motore del plugin Inline TikZ il catalogo nativo ha incontrato il font `cmmib5`: **FAIL in quel motore**; lo stesso catalogo standalone compila con Codex. Golden nativo compilato/renderizzato dal plugin: PASS. Render PDF nativo ispezionato: **NOT TESTED**, il tool compiler restituisce diagnostics senza PDF esportabile.

## 10. Obsidian

**Direct Obsidian test: PASS**, compreso il golden finale UI di 44 oggetti al passo 34: [screenshot](evidence/ux-final-full-obsidian-direct.png) e [verifica](evidence/ux-final-obsidian-direct.json). Installazione desktop Obsidian 1.13.7, Inline TikZ 0.2.1; nota temporanea chiaramente identificata. Golden con 8 resistori, L/C, sorgenti corrente/tensione, A/B/C/D, colori e annotazioni: incollato e osservato nel renderer reale.

Il profilo Obsidian conserva la geometria canvas mediante output vettoriale. Misure, confronto visivo, font, baseline e bounding box sono nel [report export](export-qa.md). Il catalogo Obsidian 72 × quattro rotazioni è stato compilato nella stessa pipeline installata: **PASS**. Non si usa il PASS di questo profilo per coprire il FAIL del catalogo CircuitikZ nativo.

## 11. SVG

SVG intero e selection sono stati esportati dalla UI e renderizzati realmente. Validità XML, viewBox, colori, math, frecce, nodi, crossing e assenza di `foreignObject`: **PASS** nei casi registrati. KaTeX viene tradotto in contenuto vettoriale; nessun `NaN` o attributo `undefined` rilevato.

Il testo normale dipende dalla disponibilità del font Comic Sans/fallback nel viewer. Compatibilità verificata col renderer disponibile; altri viewer/OS non sono dichiarati testati.

## 12. PWA

Production preview con server completamente spento: reload, modifica, JSON, TikZ e SVG **PASS**. Nuova build scoperta dal worker, avviso esplicito, **Salva e aggiorna**, documento identico dopo attivazione: **PASS**. Aggiornamento bloccato durante gesture/editor inline: PASS nei test integration.

Sul sito pubblico manifest, scope, start URL, MIME e **87 risorse senza errori HTTP** sono verificati: [audit finale](evidence/network-final.json). Il worker ha offerto **Salva e aggiorna**, passando da `index-B9HgfGpd.js` a `index-QAjNzizE.js`; titolo e conteggi del documento iniziale sono rimasti invariati. Il confronto raw JSON di questo ultimo update è BLOCKED per mancata acquisizione del nuovo download; il confronto esatto JSON del precedente update locale rimane PASS. Offline con rete disconnessa sulla origin pubblica e installazione standalone OS: **NOT TESTED** per assenza delle capability nel browser disponibile. Il test server spento su localhost viene riportato separatamente.

## 13. Performance

Stress richiesto: **200 componenti + 400 wire + 150 testi + 50 Junction + 20 Loop Arrow = 820 oggetti**; 450 crossing. Import browser, pan, zoom, drag collegato, Undo/Redo ed export: **PASS**, nessun errore catturato.

Misure modello: parse 1,64 ms; primo crossing 12,81 ms; 1.000 letture cached 0,08 ms complessivi; SVG 21,37 ms, standalone 35,25 ms, Obsidian 19,77 ms. Sono misure Node, non FPS browser. La cache WeakMap riusa il documento immutabile durante pan/zoom. Nessun refactor performance speculativo.

Profiling FPS, heap e sessione di ore: **NOT TESTED**. Tempi delle azioni automatizzate includono trasporto e non sono venduti come latenza dell'app.

## 14. Browser console

Nei workflow browser con log catturati non sono emersi uncaught errors, unhandled rejection, React key warnings o geometrie NaN. Anche i [log finali pubblici](evidence/public-final-console.json) sono vuoti. Una console senza errori nei casi provati non equivale a copertura di ogni comportamento.

Warning CI residui, **non bloccanti**: 22 messaggi React `foreignObject` nei test `latex.test.tsx`, che chiamano `renderToStaticMarkup(<MathText ... />)` senza il contenitore SVG usato dall’app; non sono presenti nella console dei workflow browser. L’action Pages segnala inoltre la deprecazione Node `punycode`, senza impedire il deploy. [Classificazione CI](evidence/ci-warning-classification.json). Non è stata nascosta o silenziata la diagnostica.

Warning npm di dipendenze transitive deprecate e allow-scripts: non bloccanti; installazione finale con zero vulnerabilità segnalate. Non è stato aggiornato il dependency graph durante questo audit.

## 15. Build e pubblicazione

| Gate                            | Risultato                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node                            | 26.5.0 da `.nvmrc`                                                                                                                                                |
| `npm ci`                        | PASS, zero vulnerabilità                                                                                                                                          |
| lint                            | PASS, fonte finale con RC-09                                                                                                                                      |
| tests                           | **33 file / 956 PASS**, 32,65 s, timeout locali invariati                                                                                                         |
| build                           | PASS, zero errori TypeScript; asset `index-QAjNzizE.js`                                                                                                           |
| GitHub Actions                  | **PASS build e deploy**, [run 37145440142](https://github.com/andrelombardo/drawcircuit/actions/runs/37145440142), SHA `a81c4f3c1f8b2ad177291b00990807abbc1476e6` |
| GitHub Pages + browser pubblico | **PASS** asset finale caricato, reload/persistence, drag/rotate/Undo/Redo, selection, import invalido, RC-09 e console; download capture BLOCKED                  |

Il commit delle correzioni è `a81c4f3c1f8b2ad177291b00990807abbc1476e6`; gli hash delle fonti e dei gate finali sono nel [manifest](evidence/release-source-manifest.json). Un successivo commit contiene solo il report e le evidenze live, senza variazioni del codice distribuito.

Baseline pubblica: [Actions 37073478258](https://github.com/andrelombardo/drawcircuit/actions/runs/37073478258), SHA iniziale corrispondente. URL richiesto: [DrawCircuit pubblico](https://andrelombardo.github.io/drawcircuit/).

## 16. Test matrix

`PASS` indica il metodo dichiarato e i casi registrati; `NOT TESTED` non viene convertito in successo. Le matrici estese per tutti i 72 tipi e 23 preset sono nei report di area.

| Feature/area                                     | Unit/integration          | Browser/manuale                                                       | Export/render                                                   | Stato                         |
| ------------------------------------------------ | ------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| 72 componenti, palette, categorie e terminali    | PASS                      | PASS, tutti i tipi                                                    | PASS, cataloghi e file                                          | PASS                          |
| 23 preset, search, ghost, move/rotate, save/load | PASS                      | PASS, tutti i preset                                                  | PASS                                                            | PASS                          |
| Smart Placement, anchor, inline insertion        | PASS                      | PASS                                                                  | PASS                                                            | PASS                          |
| Select, box, multiselect, group move/rotate      | PASS                      | PASS                                                                  | Selection PASS                                                  | PASS                          |
| Wire endpoint, waypoint, split, Quick Junction   | PASS                      | PASS incluso retest RC-09                                             | PASS incluso bridge RC-09                                       | PASS                          |
| Crossing senza/con nodo, bridge                  | PASS incluso RC-09        | RC-09 corretto e retestato                                            | RC-09 PASS modello/UI/export                                    | PASS                          |
| Replace e mapping classi compatibili             | PASS                      | PASS casi UI                                                          | PASS                                                            | PASS                          |
| Current, polarity, voltage, arrow, loop          | PASS                      | PASS                                                                  | PASS                                                            | PASS                          |
| Label edit/move, 19 LaTeX, invalid source        | PASS                      | PASS                                                                  | PASS, colore corretto                                           | PASS                          |
| Guide, equal spacing, override e transient state | PASS                      | Orizzontale/Alt PASS; verticale e hysteresis manuali NOT TESTED       | Assenza negli export PASS                                       | Copertura parziale dichiarata |
| Pan, zoom editor, fit, grid, sidebar             | PASS                      | PASS                                                                  | Non applicabile                                                 | PASS                          |
| Shortcut e blocco durante text/dialog            | PASS                      | 35 casi: 34 PASS, Space+drag BLOCKED; input/dialog protetti           | Non applicabile                                                 | PASS nei casi registrati      |
| Cmd/Ctrl C/V oggetti e paste ripetuto            | PASS modello/integrazione | BLOCKED clipboard browser                                             | Non applicabile                                                 | BLOCKED manuale               |
| Duplicate oggetti e gruppi                       | PASS                      | PASS                                                                  | PASS                                                            | PASS                          |
| Copy TikZ/Obsidian/SVG; download .tex/SVG        | PASS                      | Copy live PASS; download locale PASS, ultimo capture pubblico BLOCKED | Generazione live identica al golden PASS                        | Limite capture dichiarato     |
| JSON, legacy, import malformed/atomic            | PASS                      | PASS import/reload; raw JSON download live BLOCKED                    | Roundtrip locale PASS; tre export dopo reload pubblico identici | PASS nei metodi dichiarati    |
| Storage corrupted/quota/access denied            | PASS fault injection      | Quota OS NOT TESTED                                                   | Backup raw PASS                                                 | PASS automatizzato            |
| History 50+ operazioni                           | PASS                      | PASS, 53 Undo/Redo                                                    | JSON esatti                                                     | PASS                          |
| Blocchi personali lifecycle e ID remap           | PASS                      | PASS lifecycle e ID                                                   | PASS                                                            | Vedi report libreria          |
| TikZ nativo, compilation golden/catalogo         | PASS                      | UI export PASS                                                        | Codex compiler PASS                                             | PASS                          |
| TikZ nativo catalogo in Inline TikZ              | Validità Codex PASS       | Plugin installato                                                     | Font cmmib5 FAIL                                                | FAIL nel plugin               |
| Obsidian canvas, golden diretto e catalogo       | PASS                      | Desktop diretto PASS                                                  | Pipeline catalogo PASS                                          | PASS                          |
| SVG full/selection e validità                    | PASS                      | UI PASS                                                               | Render PASS                                                     | PASS                          |
| PWA offline localhost, update e preservation     | PASS                      | PASS server spento                                                    | Export offline PASS                                             | PASS                          |
| PWA pubblica offline/install OS                  | Test logici PASS          | NOT TESTED rete/OS                                                    | Non applicabile                                                 | NOT TESTED                    |
| Public assets/manifest/scope/MIME                | Audit HTTP                | Final PASS, asset QAjNzizE osservato                                  | 87 risorse finali HTTP 200, MIME corretti                       | PASS                          |
| 820 oggetti, crossings, export                   | PASS                      | PASS                                                                  | PASS                                                            | PASS                          |
| 1920/1440/1280/1024 viewport                     | PASS layout tests         | PASS misure/screenshot                                                | Dialog fit PASS                                                 | PASS                          |
| Zoom browser 80/125/150%                         | Non applicabile           | NOT TESTED capability                                                 | Non applicabile                                                 | NOT TESTED                    |
| Chromium / altri browser                         | Non applicabile           | Chromium PASS; altri NOT TESTED                                       | Viewer disponibile PASS                                         | Copertura parziale            |

## 17. Non testato / bloccato

- **BLOCKED ultimo smoke pubblico:** i click Salva JSON non hanno prodotto un nuovo file acquisibile o un evento download entro 10 s. Nessun errore app catturato; l’interfaccia nativa del browser host non è accessibile al controllo Computer Use. I file locali precedenti sono PASS; non sono usati per certificare un nuovo download pubblico. L’override viewport non ha avuto effetto in questo ultimo run e la matrice locale resta separata.
- **BLOCKED:** copy/paste oggetti con shortcut e Space+drag nel browser integrato; test del modello, pulsanti copy export e pan con H verificati separatamente.
- **NOT TESTED:** Safari/WebKit, Firefox e Chrome esterno senza backend connesso; trackpad/macOS input hardware reale.
- **NOT TESTED:** zoom del browser 80/125/150%; zoom canvas verificato. Guide verticali/hysteresis durante il gesto e tutte le combinazioni di shortcut/input non certificate manualmente; vedere matrice editor.
- **NOT TESTED:** installazione standalone OS; rete pubblica disconnessa; localhost offline verificato spegnendo il server.
- **NOT TESTED:** PDF nativo visuale prodotto dal compiler Codex, che non restituisce un PDF esportabile; compilation reale verificata anche per il golden finale UI (`ux-final-native-compile.json`).
- **NOT TESTED:** quota storage reale nel profilo personale, crash forzato, heap/FPS/sessioni di ore. Fault injection sicura e stress realistico eseguiti.
- Nessuna matrice finita dimostra ogni combinazione di oggetti, engine, viewer o dati futuri.

## 18. Limitazioni residue

La resa CircuitikZ nativa differisce dal canvas per geometria e font del formato. Il profilo Obsidian/SVG è quello verificato per la fedeltà al disegno. Il catalogo nativo nel plugin Inline TikZ installato non completa il render per `cmmib5`; non è stato nascosto dietro la compilazione riuscita del motore standalone.

La resa del testo normale dipende dal font Comic Sans/fallback disponibile nel viewer. Le differenze di antialiasing non sono state trattate come bug di geometria.

RC-09 è corretto e retestato anche dopo l’ultima revisione indipendente: [ponte al 75%](evidence/rc09-final-ownership-75.jpg), [retest browser](evidence/rc09-final-browser-retest.json), [SVG](evidence/rc09-final-ownership.svg). Lo smoke pubblico dopo deployment è PASS per i metodi registrati; l’acquisizione dei nuovi download nell’ultimo browser rimane BLOCKED, come spiegato sopra.

## 19. Possibili miglioramenti futuri

Non implementati: ampliare la matrice con browser e hardware macOS collegati; misurare FPS/heap per sessioni lunghe; validare installazione e rete offline su device reale; aggiungere documentazione delle differenze fra CircuitikZ nativo e profilo canvas; eventuale interfaccia di recupero delle copie locali già protette; valutare la discoverability dei modi di ripetizione dei tool. Questi punti non sono nuove feature introdotte dall'audit.
