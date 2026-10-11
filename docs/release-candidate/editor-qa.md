# Editor / Product UX QA — release candidate

Audit locale reale del 3 ottobre 2026. La prima sessione, prima dell’interruzione, ha costruito un circuito da zero e registrato 60 operazioni. La sessione di ripresa ha ricostruito il golden finale tramite la UI di DrawCircuit su `http://127.0.0.1:4184/`, origine dedicata, usando il codice aggiornato e ricaricandolo dopo il fix RC09. Nessun documento personale e nessuno storage pubblico sono stati modificati.

**Risultato locale:** 32 dei primi 33 passi finali PASS; copia/incolla del circuito BLOCKED dal browser di verifica. Il confronto diretto Obsidian dello stesso golden finale è PASS, con [screenshot reale](evidence/ux-final-full-obsidian-direct.png) e [verifica](evidence/ux-final-obsidian-direct.json). I passi pubblici 35, 36 e 38 sono PASS con [prova del coordinatore](evidence/public-release-smoke.json); il passo 37 resta NOT TESTED per la rete offline pubblica. Checklist completa: 36 PASS, 1 BLOCKED, 1 NOT TESTED. Questo rapporto, da solo, non dichiara PASS l’intera prova di 38 passi.

## Evidenze principali

- [Primo circuito creato dalla UI](evidence/ux-first-time-golden.jpg), [JSON](evidence/ux-first-time-golden.json): generatore, quattro resistori, A/B/C/D, nove fili, corrente, tensione, maglia e testo.
- [Registro di 60 operazioni](evidence/ux-history-60-operations.json), [stato finale](evidence/ux-history-final.json), [Undo](evidence/ux-history-undo-trace.json), [Redo](evidence/ux-history-redo-trace.json).
- **53 Undo** riportano esattamente al primo golden; **53 Redo** ripristinano esattamente il JSON finale. Sono confrontati tutti i campi, compresi ID, riferimenti, geometria, label, stili e annotazioni. [Sintesi delle uguaglianze](evidence/ux-final-integrity-summary.json).
- [Golden finale dell’editor](evidence/ux-final-golden-editor.jpg), [JSON](evidence/ux-final-golden.json), [JSON dopo reload](evidence/ux-final-golden-reloaded.json), [JSON reimportato](evidence/ux-final-golden-loaded.json). Uguaglianza esatta in entrambi i round trip; 44 oggetti e ID tutti univoci.
- Golden finale: 15 componenti, 17 fili, 8 nodi, due annotazioni elettriche, una maglia e un testo `maglia 1`. Include `r_{AB}`, `50 \ohm`, `i_1`, colori rossi/blu, preset RLC e un blocco personale reinserito.
- [Registro UI del golden](evidence/ux-final-golden-steps.json) contiene anche i tentativi iniziali e i successivi retest. Per i passi ripetuti, l’ultima voce è il risultato finale.
- [Console locale](evidence/ux-final-golden-console.json): nessun warning o errore raccolto nell’ultima sessione.

## Problema significativo scoperto nel pass finale: RC09

**Titolo:** un filo passante su una Junction esistente appare collegato senza esserlo.

**Severity:** P1. **Area:** topologia, crossing e coerenza editor/export. **UX friction prima del fix:** HIGH. **Stato:** FIXED, retest manuale PASS.

Steps to reproduce:

1. Disegnare un filo orizzontale e inserire il nodo A al suo interno.
2. Disegnare un filo verticale da un punto libero a un altro punto libero, passando attraverso A senza terminare su A.
3. Osservare l’incrocio, salvare JSON e spostare A.

Expected: un filo senza endpoint su A deve essere mostrato come non collegato; un clic con Nodo sull’A già esistente deve poter collegare i fili incidenti. I riferimenti del modello e il feedback grafico devono concordare.

Actual prima del fix: il punto A sopprimeva il ponte dell’incrocio, mentre il filo verticale manteneva due endpoint liberi. Spostando A, il filo verticale rimaneva nella vecchia posizione. Il ritorno anticipato di `insertJunction` impediva inoltre di collegare i fili a una Junction già esistente.

Evidence:

- [JSON prima del fix](evidence/ux-cross-existing-node-before.json): A è `(40,100)`; il filo verticale ha endpoint liberi `(40,20)` e `(40,160)`.
- [Editor prima del fix](evidence/ux-cross-existing-node-before.jpg), [A spostato prima del fix](evidence/ux-cross-existing-node-moved.jpg).
- [Incrocio non collegato dopo il fix](evidence/ux-cross-existing-node-fixed-unconnected.jpg): il ponte è visibile anche in presenza del nodo sovrapposto.
- [Incrocio collegato dopo Nodo su A](evidence/ux-cross-existing-node-fixed-connected.jpg), [A spostato dopo il collegamento](evidence/ux-cross-existing-node-fixed-connected-moved.jpg).

Root cause e fix, implementati dall’agente Library/Topology: `wireCrossings` sopprimeva un ponte per qualsiasi Junction alla stessa coordinata; ora controlla i riferimenti effettivi degli endpoint. `insertJunction` ora riutilizza il nodo esistente e collega/suddivide i fili passanti; il tool Nodo richiama questa operazione anche quando il candidato è una Junction già esistente. Non è introdotto un collegamento automatico dei fili passanti.

Retest: Nodo su A porta i fili **16 → 17**; un singolo Undo torna a 16 e un singolo Redo torna a 17. Il JSON finale contiene **quattro endpoint riferiti allo stesso A**. Dopo il collegamento, spostare A trascina tutti e quattro i rami. Undo del drag riporta geometria e nodo nella posizione originaria. Sono stati aggiunti dall’agente responsabile cinque test di modello e un test UI; il gate finale del coordinatore contiene 956 test PASS. La revisione finale preserva anche l’ownership visiva del nodo: [ponte al 75%](evidence/rc09-final-ownership-75.jpg), [retest finale](evidence/rc09-final-browser-retest.json).

## Workflow finale di 38 passi

| #   | Passo                            | Risultato / prova                                                                                                                                                                                            |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Insert source                    | PASS — generatore DC dalla palette                                                                                                                                                                           |
| 2   | Resistor tramite Smart Placement | PASS — clic sul terminale, anchor, spostamento e clic; componente + filo                                                                                                                                     |
| 3   | Add another resistor             | PASS — secondo resistore                                                                                                                                                                                     |
| 4   | Inline insertion                 | PASS — preview di taglio, conferma, filo suddiviso                                                                                                                                                           |
| 5   | Junction                         | PASS — nodo sul filo e suddivisione                                                                                                                                                                          |
| 6   | Crossing senza Junction          | PASS — ponte e due rami non collegati                                                                                                                                                                        |
| 7   | Crossing con Junction            | PASS dopo RC09 — Nodo su A già esistente collega quattro rami; Undo/Redo atomici                                                                                                                             |
| 8   | Node labels A/B/C/D              | PASS — label dei nodi presenti                                                                                                                                                                               |
| 9   | Move labels                      | PASS — spostamento indipendente di label componente e nodo; corpi invariati nel JSON                                                                                                                         |
| 10  | LaTeX `r_{AB}`                   | PASS — editing/render/source preservata                                                                                                                                                                      |
| 11  | LaTeX `50 \ohm`                  | PASS — editing/render Ω/source preservata                                                                                                                                                                    |
| 12  | Current Arrow                    | PASS — agganciata a un filo                                                                                                                                                                                  |
| 13  | Voltage annotation               | PASS — trascinamento fra due punti                                                                                                                                                                           |
| 14  | Loop Arrow                       | PASS — ellisse disegnata dalla UI                                                                                                                                                                            |
| 15  | Equal spacing                    | PASS — tre resistori a x −220/−40/140, y −120; drag riallineato. Alt placement verificato: preview `anchor-target → free`                                                                                    |
| 16  | Replace Component                | PASS — resistore → condensatore; ID e terminali mantenuti                                                                                                                                                    |
| 17  | Insert preset                    | PASS — RLC serie, tre componenti e quattro fili                                                                                                                                                              |
| 18  | Create personal block            | PASS — selezione RLC salvata come `QA Final RLC 20261003`                                                                                                                                                    |
| 19  | Reinsert personal block          | PASS — tre componenti e quattro fili nuovi, riferimenti interni rimappati                                                                                                                                    |
| 20  | Multi-select                     | PASS — Shift con due componenti; anche selezione componente+nodo per gli export                                                                                                                              |
| 21  | Copy/paste                       | BLOCKED — il browser intercetta la clipboard delle scorciatoie; Control+V segnala clipboard virtuale vuota, Meta C/V con contenuto QA non aumenta gli oggetti. Nessuna notifica di copia dell’app confermata |
| 22  | Duplicate                        | PASS — due componenti selezionati, totale 13 → 15                                                                                                                                                            |
| 23  | Undo                             | PASS — duplicazione annullata, 15 → 13                                                                                                                                                                       |
| 24  | Redo                             | PASS — duplicazione ripristinata, 13 → 15                                                                                                                                                                    |
| 25  | Save JSON                        | PASS — File → Salva JSON; ripetuto dopo RC09                                                                                                                                                                 |
| 26  | Reload                           | PASS — JSON risalvato identico, blocco personale ancora presente                                                                                                                                             |
| 27  | Load JSON                        | PASS — file chooser reale; JSON risalvato identico                                                                                                                                                           |
| 28  | Export full TikZ                 | PASS — Copia TikZ dalla UI; anche download `.tex`                                                                                                                                                            |
| 29  | Export selection TikZ            | PASS — due selezionati (resistore + Junction) + filo interno, tre esportati; Solo selezione                                                                                                                  |
| 30  | Export full Obsidian             | PASS produzione clipboard; verifica visiva delegata al passo 34                                                                                                                                              |
| 31  | Export selection Obsidian        | PASS — due selezionati + filo interno, tre oggetti esportati                                                                                                                                                 |
| 32  | Export full SVG                  | PASS — download e Copia codice SVG                                                                                                                                                                           |
| 33  | Export selection SVG             | PASS — download e Copia codice SVG; due selezionati + filo interno, tre esportati                                                                                                                            |
| 34  | Verify Obsidian visual result    | PASS — medesimo golden di 44 oggetti incollato nella UI nativa e osservato in Reading view; screenshot e verifica sopra                                                                                      |
| 35  | Reload public site               | PASS — asset QAjNzizE caricato dopo Actions/Pages sul commit a81c4f3; reload golden pubblico                                                                                                                 |
| 36  | Verify public persistence        | PASS — 44 oggetti e tre export esatti dopo reload; nuovo raw JSON download live BLOCKED e dichiarato nel report principale                                                                                   |
| 37  | Verify PWA/offline               | NOT TESTED — rete offline pubblica non controllabile; offline locale reale e update verificati separatamente                                                                                                 |
| 38  | Check public console             | PASS — console pubblica warning/error vuota, public-final-console.json                                                                                                                                       |

I sei export finali provengono da uno stesso documento dopo il fix RC09: [TikZ full](evidence/ux-final-full.tikz), [TikZ selection](evidence/ux-final-selection.tikz), [Obsidian full](evidence/ux-final-full-obsidian.md), [Obsidian selection](evidence/ux-final-selection-obsidian.md), [SVG full](evidence/ux-final-full.svg), [SVG selection](evidence/ux-final-selection.svg). Il [file standalone `.tex`](evidence/ux-final-full.tex) e lo [screenshot della selezione](evidence/ux-final-selection-editor.jpg) sono disponibili per i confronti dell’agente export.

## Matrice editor e UX

Questa matrice distingue l’esecuzione manuale dalla lettura del codice. Le verifiche esaustive dei 72 componenti, dei 23 preset, degli export/renderer, di persistence/PWA e delle performance hanno rapporti separati del team.

| Funzione                                              | Manuale UI di questo audit                                                               | Integrità/history/export                                  | Risultato                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| Select / feedback / toolbar                           | Circuito iniziale, 60 operazioni e golden finale                                         | Screenshot; ID della selezione finale                     | PASS                                       |
| Component placement / ghost                           | Source, R, C, L; preview source e Smart Placement                                        | JSON ed export                                            | PASS                                       |
| Smart Placement / click-to-anchor / magnetic terminal | Terminale source → R con filo; anchor esplicito                                          | Operazione 42; golden 2                                   | PASS                                       |
| Inline insertion                                      | Filo libero → R con preview del taglio                                                   | Operazione 43; golden 4; JSON endpoint                    | PASS                                       |
| Alt/Option override                                   | Stesso terminale: preview anchor-target → free con Alt                                   | Guide non sono oggetti del documento                      | PASS nel caso osservato                    |
| Wire / free point / waypoint                          | Nove fili nel primo circuito; filo con waypoint nella history                            | JSON exact dopo Undo/Redo                                 | PASS                                       |
| Terminal → terminal / Junction                        | Collegamenti della rete e RLC                                                            | Riferimenti esportati e preservati                        | PASS                                       |
| Junction / split / existing Junction                  | Split nuovo nodo, drag nodo, retest RC09                                                 | Quattro endpoint sullo stesso A                           | PASS dopo fix                              |
| Crossing / bridge                                     | Incrocio separato e nodo reale                                                           | Screenshot + JSON, sei export                             | PASS dopo fix                              |
| Waypoint add / move / remove                          | Doppio clic filo, drag handle, Alt + clic sul waypoint                                   | Handle creato, mosso a y80, poi rimosso                   | PASS                                       |
| Quick Junction / wire merge                           | Coperti principalmente dal rapporto Library/Topology                                     | Non attribuire a questa sessione una sequenza esaustiva   | DELEGATED                                  |
| Label editing / label drag / LaTeX                    | R, nodi, corrente, tensione, testo                                                       | Offset/source esatti dopo reload e history                | PASS                                       |
| Rotate / label rotate                                 | Operazioni 3/4/9/20/54                                                                   | JSON finale uguale dopo 53 Redo                           | PASS                                       |
| Replace                                               | R→C nel golden; R→L nella history                                                        | ID/mapping preservati; audit esaustivo del team           | PASS nei casi UI osservati                 |
| Arrow / curve / reverse                               | Operazioni 26–28                                                                         | JSON history e redone identici                            | PASS                                       |
| Current / polarity / voltage                          | Corrente sul filo; polarità source; tensione fra punti                                   | Operazioni 29–34/44–45 e golden                           | PASS con una frizione di hit area annotata |
| Loop / resize / arrowhead / reverse                   | Operazioni 35/46–49 e golden                                                             | JSON esatto; export finali                                | PASS                                       |
| Text / annotation                                     | `maglia 1`, `50 \ohm`, editing                                                           | Primo e ultimo golden                                     | PASS                                       |
| Multi-select / group move / duplicate / delete        | Preset spostato e duplicato; selezioni Shift                                             | Operazioni 51–55; golden 20/22–24                         | PASS                                       |
| Box selection                                         | Drag a rettangolo su due componenti e filo: tre elementi selezionati                     | Screenshot `ux-extra-box-selection.jpg`                   | PASS                                       |
| Copy/paste di oggetti                                 | Tentativi su selezione singola e multipla                                                | Intercettazione della clipboard del browser               | BLOCKED manuale                            |
| Clipboard TikZ / Obsidian / SVG                       | Copia attraverso i bottoni dell’app                                                      | File salvati dalla clipboard e toast UI                   | PASS                                       |
| Equal spacing / alignment                             | Tre centri equidistanti; drag e snap; verticale/top/bottom esaustivi delegati            | Coordinate finali osservate                               | PASS limitato al caso orizzontale          |
| Hysteresis / guide durante drag / zoom multipli       | Non acquisiti durante il gesto nella ripresa                                             | Non inferiti dalla sola posizione finale                  | NOT TESTED qui                             |
| Preset                                                | Serie nella history; RLC nel golden                                                      | Riferimenti nei JSON; tutti i preset audit team           | PASS nei casi osservati                    |
| Personal block                                        | Salva e reinsert; reload con blocco presente                                             | ID univoci e riferimenti del RLC rimappati                | PASS                                       |
| JSON / automatic save / reload / load                 | File menu + reload + file chooser                                                        | Uguaglianza di tutti i campi                              | PASS                                       |
| Undo / Redo                                           | 60 operazioni, 53 Undo e 53 Redo; atomica duplicazione e Nodo                            | Uguaglianza primo/undone e final/redone                   | PASS                                       |
| Title editing / Escape                                | Draft `QA cancel title`, Escape ripristina il titolo precedente                          | Retest manuale del fix titolo                             | PASS                                       |
| Pan / fit / zoom                                      | H + drag nella ripresa; fit dopo preset e load; precedenti screenshot a vari zoom        | Transform SVG aggiornato, coordinate helper lette dal DOM | PASS nei casi osservati                    |
| Sidebar hide/show durante placement                   | Ghost a coordinate corrette dopo hide; Escape e show                                     | Nessun oggetto aggiunto accidentalmente                   | PASS                                       |
| Sidebar resize/min/max/persistence/search/collapse    | Drag a min 200 / max 480; reload mantiene 480; collapse; ricerca condensatore; reset 232 | Placement successivo a `(0,-100)` corretto                | PASS                                       |
| Toolbar/popover/dialog/Export                         | Selezione, proprietà, replace, block name, file chooser, scope                           | Screenshot 1024 precedente e golden 1280                  | PASS nei flussi osservati                  |
| Focus/aria-label                                      | Controlli individuati tramite nomi accessibili; input con label                          | Non equivale a un audit WCAG/screen reader                | PASS pragmatico nei flussi osservati       |
| macOS trackpad / Safari / Firefox / browser zoom      | Non disponibili/verificati direttamente in questa ripresa                                | Browser matrix del coordinatore                           | NOT TESTED qui                             |

## Inventario shortcut e limiti della prova

Inventario dal codice effettivo e dalla Guida: V/W/N/T/A/L/H; R; Enter; Escape; G; 1; `+`/`=` e `−`; Delete/Backspace; Space+drag; Shift+click; Shift+click Nodo; Alt/Option per guide/placement e rimozione waypoint; Cmd/Ctrl A/C/V/D/Z; Cmd/Ctrl Shift Z; Ctrl/Cmd Y come Redo. Rotellina/trackpad per zoom e drag sul foglio per box selection sono gesti aggiuntivi.

| Shortcut/gesto                                 | Verifica registrata                                                                                                                            | Stato                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Escape                                         | Cancella placement; draft del titolo ripristinato                                                                                              | PASS                                                         |
| Enter                                          | Termina fili liberi; conferma label nel context input                                                                                          | PASS                                                         |
| Cmd D                                          | History operazione 18 aumenta 5 → 6 componenti                                                                                                 | PASS                                                         |
| Shift + click                                  | Due componenti; componente+nodo per export                                                                                                     | PASS tramite modifier della UI browser                       |
| Alt/Option placement                           | Preview anchor-target → free al medesimo terminale                                                                                             | PASS                                                         |
| H / V                                          | Pan attivato con H, drag, ritorno a Select con V                                                                                               | PASS                                                         |
| Cmd/Ctrl C e V                                 | Nessun aumento di oggetti; browser virtual clipboard intercettata                                                                              | BLOCKED                                                      |
| Cmd/Ctrl Z / Shift Z / Y                       | Component rotation 90→0→90 tramite Cmd Z / Cmd Shift Z, Ctrl Z / Ctrl Shift Z e Cmd/Ctrl Y                                                     | PASS                                                         |
| W/N/T/A/L/V                                    | Ogni tasto cambia il relativo tool a pressed=true                                                                                              | PASS                                                         |
| R/G/1/+/-                                      | R ruota corpo e ghost; G false→true; 1/+/- zoom 145→174→145%                                                                                   | PASS                                                         |
| Delete/Backspace                               | Delete elimina duplicato 3→2; Cmd A + Backspace elimina tre componenti e un filo; Undo recupera                                                | PASS                                                         |
| Alt-click waypoint / Cmd A / Shift-repeat Nodo | Waypoint rimosso; quattro elementi selezionati; due nodi inseriti con tool ancora attivo                                                       | PASS                                                         |
| Space+drag                                     | Tentativo non modifica transform; API drag espone modifier, senza tenere premuto Space come tasto normale                                      | BLOCKED — limite dell’automazione; H + drag PASS             |
| Shortcut mentre input/dialog è aperto          | Input con r/n/w non cambia tool/rotation; dialog con Cmd A / R / Delete non cambia selezione o componenti; Escape chiude dialog e popover File | PASS nei casi espliciti; non tutte le combinazioni possibili |

Le scorciatoie bloccate/non verificate rimangono tali anche con unit test verdi. Non viene classificato come bug del prodotto il limite della clipboard del browser: il sintomo osservato non permette di dimostrare che l’app abbia ricevuto il gesto.

## Pass aggiuntivo tastiera/sidebar

Su richiesta del coordinatore sono stati chiusi i gap UI fattibili in un documento QA separato. [Registro di 35 casi](evidence/ux-extra-keyboard-sidebar.json): 34 PASS e Space+drag BLOCKED. [Selezione a rettangolo](evidence/ux-extra-box-selection.jpg), [ricerca con sidebar a 480 px](evidence/ux-extra-sidebar-search-max-width.jpg), [console del pass aggiuntivo](evidence/ux-extra-console.json).

Sono state premute realmente le scorciatoie V/W/N/T/A/L, R sul componente e sul ghost, G, 1, +, −, Cmd D/A/Z/Shift Z/Y, Ctrl Z/Shift Z/Y, Delete e Backspace. La selezione a rettangolo comprende due componenti e un filo. La rimozione di waypoint è verificata con Alt su un handle reale. Shift su due inserimenti Nodo lascia il tool attivo. I tasti r/n/w nell’input non attivano tool globali; con dialog aperto Cmd A/R/Delete non modificano documenti o selezione. Escape chiude il dialog e il popover File.

Sidebar: drag al limite minimo 200 e massimo 480; reload mantiene 480; collapse nasconde il resistore; ricerca `condensatore` mostra il condensatore e nasconde la resistenza; placement dopo resize è esattamente `(0,-100)`; doppio clic sul separatore ripristina 232. Nessun errore/warning nella console del pass aggiuntivo.

Il golden finale è stato ripristinato tramite Apri JSON e fit. [JSON dopo il ripristino](evidence/ux-final-after-extra-qa.json) è esattamente uguale al golden finale: i sei export precedenti rimangono riferiti allo stesso documento. Nessun sorgente o test è stato modificato per questo pass.

## Frizioni UX osservate

| Frizione                                                                                      | Livello | Severity tecnica / stato                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Nodo sovrapposto che sembrava collegare un filo libero                                        | HIGH    | P1 RC09, corretto e retestato                                                                                                                |
| Polarità: clic sulla label sovrapposta al source non seleziona il corpo                       | MEDIUM  | Nella history il primo tentativo mostra una notifica; il clic sul corpo visibile funziona. Workaround semplice; nessun redesign implementato |
| Toolbar proprietà si chiude dopo un clic su Fit/File; clic sull’oggetto selezionato la riapre | LOW     | Comportamento osservato; non bloccante                                                                                                       |
| Durante placement la barra assistenze occupa un’area del foglio                               | LOW     | Un clic in quella barra non inserisce; la preview e lo spazio libero rendono recuperabile l’interazione. Nessuna perdita o corruzione        |
| Scope export e azioni clipboard cambiano nome con Solo selezione                              | LOW     | Comportamento coerente e verificato; la distinzione è leggibile nel dialog                                                                   |

Nessun miglioramento speculativo, nuova feature o redesign è stato implementato da questo agente. Le frizioni residue sono documentate con il loro comportamento concreto.

## Non testato / delegato

Copia/incolla nativo di oggetti e Space+drag: BLOCKED dal controllo del browser. Non sono certificate tutte le combinazioni input/dialog, il trackpad hardware, Safari/Firefox, browser zoom 80/125/150% e ogni direzione/zoom delle guide. Il pass Obsidian 34 è PASS con prova diretta; i render e la compilazione sono documentati nel [report export](export-qa.md). I passi pubblici 35–38 sono documentati in public-release-smoke.json e nella matrice finale. L’acquisizione dei nuovi download nell’ultimo smoke pubblico è BLOCKED; le prove locali precedenti restano distinte. Le prove live sono state aggiunte dopo il deployment, senza anticipare un PASS.

## Registro delle 60 operazioni della prima sessione

Il registro è riportato di seguito dal file di evidenza originale. Sono 60 tentativi/azioni reali e **53 transizioni di history**: i tentativi senza cambiamento e il salvataggio di una libreria personale non devono essere conteggiati come nuovi stati del circuito.

| #   | Operazione                                       | Riscontro registrato                                          |
| --- | ------------------------------------------------ | ------------------------------------------------------------- |
| 1   | Move wired R1 up                                 | 5 componenti / 9 fili                                         |
| 2   | Move only R1 label                               | 5 componenti / 9 fili                                         |
| 3   | Rotate wired R1 90                               | 5 componenti / 9 fili                                         |
| 4   | Rotate wired R1 180                              | 5 componenti / 9 fili                                         |
| 5   | Edit R1 LaTeX through context input              | 5 componenti / 9 fili                                         |
| 6   | Change R1 label to red                           | 5 componenti / 9 fili                                         |
| 7   | Resize R1 label                                  | 5 componenti / 9 fili                                         |
| 8   | Change R1 body color                             | 5 componenti / 9 fili                                         |
| 9   | Rotate only label                                | 5 componenti / 9 fili                                         |
| 10  | Duplicate styled R1                              | 6 componenti / 9 fili                                         |
| 11  | Move duplicate to free space                     | 6 componenti / 9 fili                                         |
| 12  | Replace duplicate R with capacitor               | 6 componenti / 9 fili                                         |
| 13  | Delete replaced duplicate                        | 5 componenti / 9 fili                                         |
| 14  | Paste R1 selection                               | NO CHANGE — browser copy/paste gesture could not be confirmed |
| 15  | Paste R1 again                                   | NO CHANGE — browser copy/paste gesture could not be confirmed |
| 16  | Delete selected original R1 after no-op paste    | 4 componenti / 9 fili                                         |
| 17  | Insert independent capacitor                     | 5 componenti / 9 fili                                         |
| 18  | Duplicate capacitor via CMD+D                    | PASS — component count increased 5 to 6                       |
| 19  | Move capacitor near lower circuit                | 6 componenti / 9 fili                                         |
| 20  | Rotate capacitor                                 | 6 componenti / 9 fili                                         |
| 21  | Edit capacitor with unit LaTeX                   | 6 componenti / 9 fili                                         |
| 22  | Create free wire with waypoint                   | 6 componenti / 10 fili                                        |
| 23  | Split free wire by junction                      | 6 componenti / 11 fili                                        |
| 24  | Rename inserted junction E                       | 6 componenti / 11 fili                                        |
| 25  | Drag renamed junction                            | 6 componenti / 11 fili                                        |
| 26  | Draw straight arrow                              | 6 componenti / 11 fili                                        |
| 27  | Convert arrow to curve                           | 6 componenti / 11 fili                                        |
| 28  | Reverse curve arrow                              | 6 componenti / 11 fili                                        |
| 29  | Attach polarity to source                        | NO CHANGE — voltage label overlapped source hit area          |
| 30  | Attach polarity to visible source body           | 6 componenti / 11 fili                                        |
| 31  | Edit source polarity label                       | 6 componenti / 11 fili                                        |
| 32  | Reverse source polarity                          | 6 componenti / 11 fili                                        |
| 33  | Reverse original current arrow                   | 6 componenti / 11 fili                                        |
| 34  | Edit current label                               | 6 componenti / 11 fili                                        |
| 35  | Move loop arrow                                  | 6 componenti / 11 fili                                        |
| 36  | Rename mesh text                                 | 6 componenti / 11 fili                                        |
| 37  | Move mesh text                                   | 6 componenti / 11 fili                                        |
| 38  | Edit node B with LaTeX                           | 6 componenti / 11 fili                                        |
| 39  | Move only node label                             | 6 componenti / 11 fili                                        |
| 40  | Move wired junction                              | 6 componenti / 11 fili                                        |
| 41  | Insert inductor                                  | 7 componenti / 11 fili                                        |
| 42  | Smart anchor insert resistor and wire atomically | 8 componenti / 12 fili                                        |
| 43  | Inline resistor insertion into existing wire     | 9 componenti / 13 fili                                        |
| 44  | Draw second voltage arrow                        | 9 componenti / 13 fili                                        |
| 45  | Edit voltage LaTeX label                         | 9 componenti / 13 fili                                        |
| 46  | Draw second loop                                 | 9 componenti / 13 fili                                        |
| 47  | Resize second loop using corner handle           | 9 componenti / 13 fili                                        |
| 48  | Move loop arrowhead along ellipse                | 9 componenti / 13 fili                                        |
| 49  | Reverse second loop                              | 9 componenti / 13 fili                                        |
| 50  | Insert series preset                             | 11 componenti / 16 fili                                       |
| 51  | Move inserted preset as group                    | 11 componenti / 16 fili                                       |
| 52  | Duplicate whole preset group                     | 13 componenti / 19 fili                                       |
| 53  | Delete duplicated preset group                   | 11 componenti / 16 fili                                       |
| 54  | Rotate multi selection                           | 11 componenti / 16 fili                                       |
| 55  | Change multi selection color                     | 11 componenti / 16 fili                                       |
| 56  | Save selected personal block (library operation) | 11 componenti / 16 fili                                       |
| 57  | Reinsert saved personal block                    | 12 componenti / 17 fili                                       |
| 58  | Insert free text annotation                      | 12 componenti / 17 fili                                       |
| 59  | Edit free text with ohm unit                     | 12 componenti / 17 fili                                       |
| 60  | Replace wired R2 with inductor                   | 12 componenti / 17 fili                                       |

Verifica finale della history: [iniziale](evidence/ux-first-time-golden.json) = [dopo Undo](evidence/ux-history-undone.json); [finale](evidence/ux-history-final.json) = [dopo Redo](evidence/ux-history-redone.json). Tutti e quattro i file restano disponibili, insieme ai trace e agli screenshot.
