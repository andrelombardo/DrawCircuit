# Properties Inspector, precisione e annotazioni

Verifica locale dell’11 ottobre 2026, Node **26.5.0**, a partire da `47d54fe`. Questo report documenta l’implementazione e le prove eseguite prima della pubblicazione.

## Risultato

La toolbar contestuale è stata sostituita da un inspector destro persistente. Le operazioni geometriche usano il dominio esistente; il motore di guide e il relativo indice spaziale sono stati estesi. Fili tratteggiati/puntinati, divisione del filo, rettangoli e linee decorative condividono serializzazione, clipboard ed export. Copia/Taglia/Incolla funzionano sia da tastiera sia tramite eventi nativi del browser.

## Mappa delle azioni migrate

| Controlli precedenti                                                                       | Posizione nell’inspector  |
| ------------------------------------------------------------------------------------------ | ------------------------- |
| Label, nome nodo, contenuto testo, testo interno del blocco                                | Generale                  |
| Colore simbolo/label, colori personalizzati, opacità, spessore, font                       | Aspetto                   |
| Allineamento testo e tipo di freccia                                                       | Geometria                 |
| Offset annotazioni elettriche                                                              | Geometria                 |
| Corrente sul filo, polarità, inverti lato, inverti freccia                                 | Azioni, quando pertinenti |
| Mirror orizzontale/verticale, rotazione                                                    | Azioni                    |
| Duplica, sostituzione singola/multipla, blocco personale, copia PNG, elimina oggetto/label | Azioni                    |
| Shortcut e editing/handle diretti del canvas                                               | Conservati                |

La vecchia `ContextToolbar.tsx` è rimossa. Non rimangono controlli di modifica della selezione duplicati nella toolbar di disegno. I controlli degli strumenti in fase di creazione continuano a comparire sul canvas.

## Architettura e regole

- `PropertiesContent` usa un selettore Zustand con confronto shallow sugli oggetti selezionati. I draft degli input sono locali e si confermano su blur/Enter. Lo store gestisce gli aggiornamenti e la cronologia; slider e color picker raggruppano le anteprime in una transazione.
- Preferenze separate in `drawcircuit.inspector.v1`: default aperto, 292 px; limiti 252–440 px. Il pannello ha scroll indipendente e passa a overlay sotto 1050 px. Hide/show/resize conservano zoom e punto centrale della vista senza modificare il documento.
- `selectionGeometry.ts` offre sei allineamenti, distribuzione per centri/spazi liberi e distanza esatta. La distribuzione automatica fissa gli estremi; quella numerica fissa il primo oggetto sull’asse. `moveSelection` conserva gli endpoint semantici e aggiorna i percorsi.
- Le guide riutilizzano l’indice spaziale e il contesto preparato all’inizio del drag. Terminali/junction precedono assi/terminali, uguale distanza e griglia. Nei generatori paralleli si misurano centri e assi dei rami. Soglie in pixel schermo, valori in unità documento. Shift aggiunge quote, Alt/Option disabilita lo snap del drag, inclusa la griglia.
- `StrokeStyle` è opzionale; JSON v1 precedenti restano continui. Pattern SVG e TikZ usano la stessa sequenza in unità documento. Le hit area dei fili e delle linee restano continue. Anche i ponti degli incroci seguono lo stile del filo.
- **Dividi filo…** aggiunge una junction tra due fili con stile indipendente e rimappa le annotazioni di corrente. Non divide su endpoint o incroci estranei, per evitare connessioni implicite.
- Rettangoli e linee sono annotazioni grafiche senza endpoint elettrici. Sono dietro fili/componenti. Rettangoli vuoti selezionabili solo dal bordo; riempimento e contorno hanno opacità indipendenti. Handle normalizzati in ogni direzione, Escape annulla e il gesto produce un solo undo.
- La clipboard contiene una copia serializzata e validata prima del taglio. Il fallback interno è immediato, quindi una richiesta asincrona di permesso non può cancellare una selezione cambiata nel frattempo. Le copie/incolla usano le regole già esistenti di ID, label e connessioni esterne. Input, textarea, select e contenteditable mantengono i comandi nativi.
- SVG, CircuitikZ, Obsidian e blocchi personali conservano gli oggetti grafici e gli stili. Guide, handle e controlli non entrano negli export.

## Test automatici

I nuovi file `properties-precision.test.ts` e `properties-inspector-interactions.test.tsx` coprono geometria, riferimenti elettrici, stati misti, transazioni, snap e zoom, resize, divisione del filo, clipboard negata, eventi nativi, focus, serializzazione ed export. I test UI esistenti sono aggiornati alla posizione dei controlli nell’inspector; le aspettative del menu Disegno comprendono i due nuovi strumenti. La selezione di un gruppo ora include i suoi terminali tra i candidati geometrici.

| Comando                | Risultato                               |
| ---------------------- | --------------------------------------- |
| `npm run format:check` | Superato                                |
| `npm run lint`         | Superato                                |
| `npm run test`         | **1.767/1.767**, 59 file, 61,53 secondi |
| `npm run build`        | Superato, PWA generata                  |

Rispetto ai 1.704 test iniziali sono aggiunti 63 casi. L’ultima esecuzione comprende anche la correzione delle misure delle linee decorative orizzontali/verticali: il bounding box geometrico conserva l’estensione nulla sull’asse corrispondente, senza introdurre il padding dell’area cliccabile nelle coordinate dell’inspector.

Il build avvisa che il bundle principale è **500,20 kB** (160,23 kB gzip), appena oltre la soglia Vite di 500 kB. La PWA genera 111 voci di precache. Node 26 emette nei test un avviso sperimentale relativo a localStorage; i test usano lo storage simulato e terminano tutti correttamente.

## Prova nel browser

Il circuito di riferimento riproduce i tre generatori verticali I₁/I₂/I₃, i due rail e i prolungamenti a destra. Le verifiche usano un’origine locale separata dal disegno dell’utente.

1. Selezione dei tre generatori e distribuzione orizzontale: coordinate dei centri **0, 150, 300**; i riferimenti dei fili rimangono validi. Distanza numerica 120: **0, 120, 240**.
2. Drag reale del generatore centrale: le guide SVG temporanee passano da **140/160** a **150/150**, entrambe marcate come distanze per centri uguali. Le guide scompaiono al rilascio.
3. Selezione dei due prolungamenti e stile Tratteggiata: pattern **8 4** su entrambi; geometria dei due percorsi invariata.
4. Creazione del rettangolo senza riempimento: **520 × 280**, contorno puntinato **0 6**; resize con handle fino a **540 × 300**. Un clic sul generatore interno seleziona il componente.
5. Cmd X nel campo Etichetta componente taglia il testo e lascia i **tre componenti** intatti; Escape annulla il draft. Cmd X sulla selezione complessa svuota il documento, Cmd V reinserisce il circuito e due undo ripristinano gli originali.
6. Il browser incorporato inizialmente emetteva Cut senza keydown. La prova ha portato all’integrazione di eventi nativi Copy/Cut/Paste, verificati nel browser e nei test DOM.

Le prove finali usano il build di produzione tramite `npm run preview`, all’indirizzo `http://127.0.0.1:5174/`. Il browser ha caricato `assets/index-C-HetTxe.js`, lo stesso asset dell’ultimo build. È stato usato il pulsante di aggiornamento PWA per sostituire la precedente versione in cache; il circuito è rimasto disponibile dopo l’aggiornamento.

| Viewport   | Configurazione verificata                            | Evidenza                                                                                                        |
| ---------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1440 × 900 | Entrambe le sidebar, inspector 340 px                | [Desktop](evidence/desktop.jpg)                                                                                 |
| 1180 × 820 | Entrambe le sidebar, scroll indipendente             | [Laptop](evidence/laptop.jpg)                                                                                   |
| 800 × 700  | Entrambe aperte, inspector sovrapposto               | [Due sidebar](evidence/narrow-both.jpg)                                                                         |
| 800 × 700  | Solo sinistra / solo destra / entrambe chiuse        | [Sinistra](evidence/narrow-left.jpg), [destra](evidence/narrow-right.jpg), [chiuse](evidence/narrow-closed.jpg) |
| 600 × 760  | Inspector sovrapposto e chiusura per usare il canvas | [Compatta](evidence/compact-both.jpg), [canvas libero](evidence/compact-left.jpg)                               |

Alle larghezze misurate di 1440, 1180, 800 e 600 px, `documentElement.scrollWidth` coincide con `clientWidth`: nessuno scroll orizzontale del workspace. Nelle finestre strette il pannello destro copre parte del canvas; il pulsante di chiusura resta accessibile. La toolbar resta presente nel canvas quando l’inspector è chiuso.

La larghezza di 340 px e lo stato nascosto sono sopravvissuti al reload; la riapertura ha ripristinato 340 px. Gli oggetti e gli stili sono sopravvissuti al salvataggio automatico e alla riapertura. Dopo tutte le prove responsive e l’aggiornamento PWA, la copia nativa del documento completo contiene **23 oggetti** e il JSON è identico a quello conservato prima del taglio: tre componenti, sei junction, dodici fili, un rettangolo e una linea decorativa. Anche redo del taglio e undo di ripristino sono stati verificati nel browser.

L’override temporaneo della viewport è stato rimosso al termine delle prove.

## File principali

| Area                     | File                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspector                | `src/components/properties/PropertiesInspector.tsx`, `PropertiesContent.tsx`, `PropertyControls.tsx`, `useInspectorPreferences.ts`, `SelectionStyle.tsx`; rimosso `ContextToolbar.tsx` |
| Operazioni e interazioni | `src/store/editorStore.ts`, `src/components/editor/useCanvasInteractions.ts`, `Canvas.tsx`, `SelectionLayer.tsx`                                                                       |
| Geometria e guide        | `src/utils/selectionGeometry.ts`, `smartGuides.ts`, `measurementGeometry.ts`, `rectangles.ts`                                                                                          |
| Modello e rendering      | `src/model/types.ts`, `factories.ts`, `serialization.ts`, `src/circuit/annotations/GraphicView.tsx`, `src/circuit/wires/WireView.tsx`, `WireBridges.tsx`, `src/styles.css`             |
| Clipboard ed export      | `src/utils/clipboard.ts`, `strokeStyle.ts`, `src/svg/exporter.tsx`, `src/tikz/exporter.ts`, `validation.ts`, `src/personalBlocks/library.ts`                                           |
| Test e documentazione    | `tests/properties-precision.test.ts`, `properties-inspector-interactions.test.tsx`, test UI aggiornati, `README.md`, `docs/manuale.md`                                                 |

## Evidenze

- [Circuito iniziale](evidence/parallel-sources.json).
- [Circuito completo con distanza 120, rettangolo e linea](evidence/parallel-sources-complete.json).
- [JSON del circuito costruito e verificato nel browser](evidence/browser-circuit.json), [canvas dopo il taglio](evidence/cut-empty.jpg).
- [SVG](evidence/parallel-sources.svg), [CircuitikZ standalone](evidence/parallel-sources.tex), [blocco Obsidian](evidence/parallel-sources-obsidian.md).
- [Wrapper standalone del blocco Obsidian](evidence/parallel-sources-obsidian.tex) per la verifica di compilazione.

Entrambi i documenti `.tex` hanno compilato con successo tramite il compilatore integrato del desktop. Non è stata eseguita una verifica dentro l’app Obsidian o un confronto pixel per pixel del renderer TikZJax.

## Limiti e scelte esplicite

- Le junction non selezionate restano ferme quando si distribuiscono i componenti: il routing esistente può aggiungere gomiti. Le connessioni semantiche restano valide.
- I rettangoli sono allineati agli assi. Una rotazione di 90° scambia larghezza/altezza; in una selezione mista ruotata di 45° cambia il loro centro ma il contorno resta allineato.
- Il progetto non prevede un tema scuro; l’inspector usa il tema e la tipografia esistenti.
- Clipboard di sistema dipendente dai permessi; il fallback riguarda la sessione corrente. I test DOM e geometrici non costituiscono un benchmark FPS/heap su tutti gli hardware.
