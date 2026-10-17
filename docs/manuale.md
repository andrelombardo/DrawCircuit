# DrawCircuit

Un editor di circuiti elettrici per appunti e materiale didattico. React, TypeScript, Vite, Zustand e SVG: componenti, fili e annotazioni sono oggetti vettoriali modificabili. Funziona interamente nel browser, con font Inter per la UI e KaTeX per la matematica inclusi nel bundle. La libreria comprende **72 simboli generici** in 12 categorie. Comic Relief 1.210 è incluso nel sito nei pesi normale e grassetto: tutti i visitatori scaricano gli stessi file WOFF2, senza dipendere dai font di sistema. La licenza SIL OFL 1.1 e la fonte sono conservate in `src/fonts/comic-relief/`.

## Avvio

Richiede Node.js 26.5.0, come indicato in `.nvmrc`, e npm.

```sh
npm ci
npm run dev
```

Apri http://127.0.0.1:5173. Per generare e provare la versione di produzione:

```sh
npm run build
npm run preview
```

Verifica il codice con `npm run lint` e `npm run build`, poi prova disegno, modifica, salvataggio e copia immagine nel browser con `npm run preview`.

## Uso

- Scegli un componente nella palette, poi clicca sul foglio; puoi anche trascinarlo. Ogni clic continua a inserirlo. **R** ruota l’anteprima, **Esc** termina.
- **W**: clic su un terminale, nodo o filo, poi su un altro terminale, nodo o filo. I clic su punti liberi aggiungono svolte; doppio clic oppure Enter termina il filo su un punto libero. Il disegno si allinea al punto iniziale e all’ultima svolta anche fuori griglia, con tolleranza costante sullo schermo. Backspace/Delete rimuove l’ultima svolta; senza svolte annulla il filo in corso.
- **N**: inserisci un nodo sul foglio o su un filo; ogni clic ne inserisce un altro senza modificatori, fino a **Esc**, **V** o al cambio strumento. Ogni inserimento ha un proprio undo; cliccare un nodo esistente non lo duplica. Sul filo viene creato un vero collegamento e il filo viene diviso.
- **T**: mostra/nascondi Componenti. **Testo** si seleziona dalla toolbar. **A**: freccia dritta o Bézier. **L**: trascina un’area per una maglia ellittica; gli angoli ne cambiano larghezza e altezza, il punto sulla punta la sposta continuamente. La toolbar inverte il verso mantenendo il percorso.
- **V** o Esc: selezione. Shift + clic seleziona più oggetti; trascinare sullo sfondo crea una selezione rettangolare.
- Trascina un oggetto per spostarlo, oppure la sua label per riposizionarla. I fili seguono i terminali e i nodi. Trascinare un tratto del filo lo sposta perpendicolarmente mantenendo collegate le estremità; sui fili ortogonali lo spostamento segue la griglia. Per traslare un filo intero, includilo in una selezione multipla. Doppio clic sul filo aggiunge una svolta modificabile. Gli handle alle estremità consentono di ricollegare il filo e mantengono l’allineamento al percorso.
- Doppio clic su una label o un testo per modificarlo. Conferma con Enter o un clic esterno; Esc annulla. Il cursore appare direttamente sul testo, senza riquadri, usando lo stesso rendering SVG/KaTeX del circuito anche con zoom, colore e rotazione personalizzati. L’inspector **Proprietà** sulla destra permette di cambiare label, colore, opacità, spessore, dimensione e allineamento. Per i blocchi, **Testo interno** modifica il testo nel simbolo.
- **R** ruota i componenti di 45° e gli altri oggetti di 90°. **Delete/Backspace** elimina. **Cmd/Ctrl D** duplica. **Cmd/Ctrl C/X/V** copia/taglia/incolla. **Cmd/Ctrl A** seleziona tutto.
- **Cmd/Ctrl Z** annulla; **Cmd/Ctrl Shift Z** oppure **Ctrl Y** ripete. Uno spostamento completo occupa una sola voce di cronologia.
- **Space + trascina** o **H** sposta la vista. Rotellina/trackpad e i pulsanti +/− controllano lo zoom. **1** adatta alla vista. **G** nasconde la griglia.
- Il workspace parte dal bordo superiore, senza header, branding o gestione File. Il circuito viene salvato automaticamente in localStorage dopo 400 ms di inattività e prima di chiusura/reload. La cronologia conserva le ultime 100 operazioni durante la sessione.
- Trascina il grip della toolbar per spostarla: la posizione viene conservata separatamente dal circuito e adattata a resize e sidebar. Il pulsante **Aiuto** è in basso a destra; zoom e griglia restano in basso a sinistra.

La sidebar si nasconde e riapre dal bordo, si ridimensiona tra 200 e 480 px e si ripristina con doppio clic sul separatore. Visibilità e larghezza sono preferenze locali separate dal JSON; pan e zoom si conservano durante il resize.

## Interazioni del disegno

- **Fili diagonali:** con W scegli **Ortogonale**, **45°** o **Libero** nel controllo sul canvas; **Shift + W** passa alla modalità successiva anche durante il disegno. Ogni filo conserva la modalità scelta. Il routing libero collega direttamente i punti, quello a 45° usa diagonali e un eventuale tratto orizzontale/verticale. Trascina il tratto selezionato per modificarlo: i terminali rimangono collegati. Inserisci N su una diagonale per dividerla con un nodo reale. Gli incroci restano scollegati senza junction.
- **Corrente sul filo:** il comando applica direttamente una corrente integrata. La freccia segue il ramo e si accorcia sui segmenti brevi; la toolbar ne inverte il verso. Le vecchie correnti esterne vengono lette come integrate, conservando testo, direzione e riferimenti.
- **Sostituzione multipla:** seleziona componenti con Shift + clic o con un rettangolo, poi **clic destro → Sostituisci…**. Il dialogo propone soltanto simboli compatibili con tutti i componenti selezionati e spiega quando non ci sono destinazioni comuni. Fili e nodi eventualmente selezionati rimangono intatti; un solo undo ripristina l’intero gruppo.
- **Label dei nodi:** la posizione iniziale evita per quanto possibile simboli, testi e fili vicini. Le label già spostate restano dove sono. Clicca e trascina il testo per muoverlo indipendentemente dal nodo; i tasti freccia lo spostano di una unità, Shift + freccia di dieci. **Alt/Option + clic** passa tra label sovrapposte nello stesso punto.
- **Opacità:** in **Proprietà → Aspetto** inserisci una percentuale da 0 a 100 nel campo accanto al colore. Simbolo e label hanno controlli indipendenti; il testo autonomo ha un solo controllo. Enter o un clic esterno conferma la modifica, Escape annulla. Funziona anche sulla selezione multipla, con un solo undo per conferma. Colore HEX e opacità sono salvati separatamente e rimangono nella copia immagine.
- **Frecce e maglie:** **Specchia orizzontalmente/verticalmente** riflette forma e punti di controllo; **Inverti freccia** cambia invece il verso della punta. I comandi di mirroring agiscono anche su più frecce selezionate. Avvicina il mouse a una freccia selezionata e trascina il piccolo handle esterno per ruotarla; **Shift** aggancia l’orientamento a multipli di 15°, **Esc** annulla. La rotazione conserva curva, punta e dimensioni dell’ellisse, viene salvata e rimane nella copia immagine.

Il JSON resta alla versione 1: i nuovi campi opzionali hanno default compatibili (opacità 1, routing ortogonale, rotazione delle maglie 0). La scelta iniziale delle label è euristica; in disegni molto affollati può essere necessario trascinarle. L’editor inline modifica il sorgente LaTeX: la formula resta renderizzata, ma il cursore dentro comandi e formule composte segue un’approssimazione delle posizioni del sorgente, non un editor matematico strutturato.

## Architettura e file principali

| Area        | File                                                           | Responsabilità                                                                                            |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Modello     | `src/model/types.ts`, `catalog.ts`, `serialization.ts`         | Unione discriminata degli oggetti, 72 tipi di componente, terminali locali, JSON versionato e validazione |
| Stato       | `src/store/editorStore.ts`                                     | Documento immutabile, selezione, strumenti, transazioni drag, undo/redo, salvataggio locale               |
| Geometria   | `src/utils/geometry.ts`, `operations.ts`                       | Trasformazioni, rotazioni, routing ortogonale/45°/libero, snapping, bounds, duplicazione e cancellazione  |
| Editor      | `src/components/editor/Canvas.tsx`, `useCanvasInteractions.ts` | SVG, viewport, pointer events, scorciatoie, drag, nodi su fili, handle e anteprime                        |
| Rendering   | `src/circuit/`, `CircuitLayer.tsx`                             | Simboli SVG riutilizzabili, fili, nodi, testo con pedici e frecce; componenti React memoizzati            |
| Interfaccia | `src/components/toolbar/`, `palette/`, `properties/`           | Palette ricercabile, toolbar, inspector delle proprietà, copia immagine e guida                                   |

Il documento contiene `objects[]`: componenti, junction, wire, testi e frecce. Gli endpoint dei fili sono riferimenti `{kind:'terminal', componentId, terminalId}`, `{kind:'junction', junctionId}` oppure punti liberi. Le coordinate dei terminali vengono risolte al rendering e durante la copia immagine; non sono copie assolute da aggiornare manualmente. Rimuovere un componente o nodo conserva i fili, trasformando le estremità collegate in punti liberi alle posizioni precedenti.

Le anteprime del mouse e la viewport sono separate dal documento. Il rendering dei simboli è memoizzato; un indice del documento rende costante la ricerca dei componenti collegati. Pan, zoom e anteprime non ricreano i simboli. Durante il drag vengono aggiornati gli oggetti spostati e i percorsi dei fili; la cronologia registra solo la fine del gesto.

## Copia come immagine

Seleziona gli elementi da copiare, apri il menu con il tasto destro e scegli **Copia come immagine**. Per includere tutto il circuito, usa prima **Cmd/Ctrl A**. L’app copia un PNG trasparente a 4× negli appunti, pronto da incollare in altre applicazioni. Include fili interni, etichette, annotazioni associate ed evidenziazioni; griglia, guide e controlli restano esclusi. I font del circuito sono incorporati nella rappresentazione SVG interna prima della rasterizzazione.

Non ci sono pulsanti di esportazione, download di file, formati TikZ/Obsidian o archivi JSON scaricabili. Il documento e i blocchi personali continuano a salvarsi nel browser. È possibile importare librerie di blocchi già disponibili.

## Limiti intenzionali

- Il routing può essere ortogonale, a 45° o libero; non cerca di evitare automaticamente ostacoli o incroci. Gli incroci sono scollegati finché non inserisci una junction.
- Le nuove maglie sono ellissi di 324° con apertura di 36°; quelle circolari della prima versione rimangono compatibili. La copia immagine mantiene gli archi ellittici.
- Il testo matematico usa KaTeX: pedici, apici, frazioni, radici e i comandi supportati dall’engine. Il source rimane nel JSON; il LaTeX non valido appare letterale e resta modificabile. `\ohm` è l’unico alias dell’editor e diventa `\Omega` durante rendering e copia immagine. Il testo normale, i caratteri delle formule e la preview usano Comic Relief incluso nel sito; la UI mantiene Inter. Il canvas viene montato dopo il caricamento dei due pesi, così le misure iniziali usano il font corretto. La rappresentazione SVG interna e il PNG incorporano gli stessi font: non richiedono Comic Relief installato. I glifi matematici speciali mantengono le metriche e i tracciati KaTeX.
- I simboli nativi CircuitikZ possono differire leggermente nelle proporzioni rispetto agli SVG; terminali, orientamento, colori e posizioni delle annotazioni rimangono coerenti.
- La copia negli appunti dipende dai permessi del browser. Copia/incolla degli oggetti ha un fallback interno durante la sessione; la copia immagine mostra un errore se il browser non la consente.
- Il salvataggio locale appartiene a quel browser e a quell'origine. Per utilizzare il disegno in altri strumenti scegli **Clic destro → Copia come immagine**. Nessun backend, account, simulazione o servizio cloud.

### Connessioni e selezione

- **W + clic su filo** crea un nodo e avvia o termina un ramo. Tutti i fili che passano per il punto vengono divisi e riferiti al nodo. Nodo e ramo sono una sola operazione Annulla; Esc o cambio strumento annulla i nodi provvisori. Space + trascina mantiene il filo in corso.
- **Enter** su un nodo, componente o testo selezionato apre l’editor inline. Enter conferma, Esc cancella; il doppio clic continua a funzionare.
- Doppio clic sul filo aggiunge una svolta, trascina il quadrato per modificarla, **Alt/Option + clic** sul quadrato la rimuove. La normalizzazione rimuove ridondanze solo quando il percorso visibile rimane identico, senza eliminare ritorni intenzionali.
- Snap: terminale vicino, nodo/terminale, filo, griglia; soglie in pixel dello schermo. Hit area di fili, terminali e handle indipendenti dallo zoom.
- **Cmd/Ctrl D** genera nuovi ID e numeri di label automatiche, mantenendo le label personalizzate. Le connessioni esterne alla selezione vengono scollegate dalle copie.
- Inspector destro persistente con sezioni Generale, Posizione, Aspetto, Testo e Geometria; le proprietà dipendono dal tipo e dalla selezione. I comandi sono nel menu contestuale del canvas; la toolbar conserva Annulla/Ripeti senza il menu Modifica.
- Livelli del canvas: rettangoli e linee decorative, fili, componenti, nodi, altre annotazioni, label associate; selezione e handle sono sempre sopra e non entrano nella copia immagine.
- Il JSON v1 rimane compatibile con i documenti precedenti; aggiunge l’oggetto `loop-arrow` con bounding box, verso, posizione della punta, colore e spessore.

### Libreria e font

In **Passivi** trovi anche **Resistenza statunitense**, il simbolo a zig zag, ricercabile con `zig zag` o `americana`.

La palette usa categorie collassabili, anteprime del vero simbolo, tooltip e alias italiani/inglesi (ad esempio `res`, `mos`, `ground`). Ora si può nascondere, riaprire e ridimensionare. Comic Relief è il font unico del circuito; KaTeX compone le formule; i loro caratteri usano Comic Relief anche nella preview inline.

Il JSON rimane alla versione 1. Al caricamento una label non vuota prevale sul vecchio `value`; una label vuota o mancante usa il valore legacy. Il campo `value` e le scelte `fontFamily` vengono rimossi dal modello interno. Nei nuovi dati rimane il source originale, con posizione, colore e dimensione della label. Le preferenze sidebar sono separate, sotto `drawcircuit.sidebar.v1`.

Il registry centrale in `src/model/catalog.ts` raccoglie nomi, categorie, alias, terminali, assi di uscita, bounds, label offset, geometria e metadati dei simboli. `src/model/symbolGeometry.ts` contiene primitive vettoriali comuni; il canvas renderizza solo gli oggetti presenti. I terminali nuovi hanno ID e nomi semantici; quelli dei 21 componenti iniziali conservano le coordinate e gli ID originali.

### Smart Placement

Durante l’inserimento sono visibili i terminali e i nodi collegabili: avvicina un terminale del ghost al target, verifica l’alone verde e clicca per inserire e collegare. Il clic diretto su un terminale/nodo avvia invece un’ancora; sposta il componente e conferma con un secondo clic. I bipoli si orientano durante l’ancoraggio; **R** ruota l’anteprima e dà priorità alla scelta manuale. **Alt/Option** ignora temporaneamente le assistenze, **Esc** torna a Select.

**Inserisci in filo** abilita esplicitamente l’inserimento inline dei bipoli: conferma solo quando l’anteprima mostra il filo interrotto ai due terminali. Segmenti troppo corti o attraversati da rami/incroci conservano il placement libero. Per transistor, trasformatori, op amp, connettori e porte il terminale viene scelto automaticamente dalla preview più vicina al target; il clic diretto su un terminale o nodo avvia un’ancora. La preview mostra indicatori grafici senza nomi dei pin. Il normale placement, il drag degli oggetti esistenti e Wire mantengono le loro interazioni.

Le connessioni usano gli endpoint semantici esistenti e ogni smart placement occupa una sola voce di Undo. JSON v1, localStorage e copia immagine restano compatibili.

### Blocchi rapidi

La sezione **Blocchi rapidi** aggiunge 23 configurazioni nella palette, separate dai 72 componenti. È inizialmente chiusa e offre categorie collassabili, miniature circuitali e ricerca con alias italiani/inglesi. Scegli un blocco, sposta la ghost sulla griglia, usa **R** per ruotarla di 90° e clicca per inserire; **Esc** annulla.

Sono disponibili serie/parallelo di 2 o 3 resistenze, stella, delta, partitori V/I, Wheatstone, generatori reali V/I, Thévenin, Norton, RC/RL/RLC serie e parallelo, generatore + R, due maglie, tre rami e generatore + resistenza serie + carico.

Il registro dichiarativo in `src/presets/registry.ts` genera normali componenti, fili e junction con factory condivise, nuovi UUID e label senza collisioni. Tutti gli oggetti vengono selezionati dopo l’inserimento e costituiscono una sola operazione Undo. Puoi poi modificarli individualmente usando gli strumenti esistenti. JSON v1, LaTeX e Comic Relief seguono i percorsi normali dell’editor.

### Selezione, guide e copia immagine

La selezione singola evidenzia il simbolo senza cornice; quella multipla conserva un bounds comune. Corpo e label usano grab/grabbing, con drag indipendente delle label. Durante lo spostamento compaiono quote locali e allineamenti: la spaziatura uniforme scatta entro 7 pixel dello schermo; Alt/Option ignora le assistenze. Le quote spariscono a fine gesto e non entrano nel documento, nelle immagini copiate o nella cronologia.

Per copiare tutto il circuito come immagine seleziona prima tutti gli oggetti; per copiarne una parte seleziona soltanto gli elementi desiderati. La selezione include automaticamente i fili interni; esclude i collegamenti verso oggetti esterni se non selezionati esplicitamente. L’inspector mostra le proprietà del tipo di oggetto e offre Sostituisci anche nei gruppi che contengono componenti.

## Sidebar e logo

**T** mostra/nasconde Componenti usando lo stesso comando del pulsante sidebar. Non agisce durante la scrittura in input, ricerca, etichette, testo, contenteditable o dialoghi. Testo si seleziona dalla toolbar e non ha una nuova shortcut. Il precedente ⌘/Ctrl T resta compatibile quando ricevuto dall’app.

Gli hint di placement omettono Alt/Option, che continua a disattivare temporaneamente le assistenze. La precedente toolbar contestuale è stata sostituita dall’inspector delle proprietà. Il branding usa un unico [master XNOR vettoriale trasparente](../assets/brand/drawcircuit-logo.svg); favicon, PNG e icone PWA derivano dal master, senza branding nel workspace.

## Proprietà, precisione e annotazioni

**Proprietà** è la sidebar destra. Il pulsante nell’intestazione la nasconde; quello sul canvas la riapre. Trascina il bordo sinistro per ridimensionarla (252–440 px, inizialmente 292 px); doppio clic ripristina la larghezza. Il separatore è utilizzabile anche con frecce, Home ed End. Stato e larghezza sono salvati in `drawcircuit.inspector.v1`, separatamente dal circuito e dalla palette sinistra. Su finestre fino a 1050 px l’inspector si sovrappone al canvas e può essere chiuso. L’apertura e il ridimensionamento conservano zoom e punto al centro della vista.

Il riepilogo mostra il tipo oppure il numero di elementi selezionati. Per una selezione multipla X/Y sono l’angolo superiore sinistro dei limiti geometrici; modificare una coordinata trasla l’intera selezione. L’etichetta è in alto. **Posizione** contiene un unico campo **Rotazione** per un oggetto orientabile o per la sua label selezionata. **Trasformazioni** distingue esplicitamente **Ruota gruppo di…** nelle selezioni compatibili e le riflessioni. Dimensione e allineamento del testo sono in **Aspetto**, insieme ai controlli pertinenti; **Geometria** raccoglie le proprietà specifiche e la disposizione. Nelle selezioni eterogenee sono disponibili soltanto le proprietà comuni; per proprietà specifiche seleziona gli oggetti del tipo interessato. Valori diversi mostrano **Valori misti**, **Misto** o un trattino. Una modifica comune riguarda tutta la selezione, con un solo undo. I campi numerici/testuali, comprese le percentuali di opacità, si confermano con Enter o perdendo il focus; Escape annulla il draft. Le proprietà locali ancora in scrittura non modificano il circuito.

X/Y e W/H sono affiancati in campi compatti. Ogni riga colore mostra una swatch, il valore HEX e l’opacità indipendente; clicca il colore per i cinque preset o **Colore personalizzato…**. Il selettore nativo raggruppa le anteprime in un solo gesto. Il clic destro sulla selezione offre Duplica, Copia, Taglia, Incolla, Elimina, Sostituisci, Salva come blocco, Copia come immagine e i comandi pertinenti al tipo. Le evidenziazioni offrono anche Elimina e, quando associate a un filo o componente, il comando per scollegarle. I toggle delle due sidebar usano lo stesso componente con icone specchiate.

### Allineare e distribuire

Seleziona più oggetti e usa i sei pulsanti in **Geometria** per allineare bordi o centri. **Distribuisci orizzontalmente/verticalmente** tiene fermi gli estremi e sposta gli oggetti intermedi. **Per centri** è il default: nel circuito con tre generatori produce distanze uguali tra i centri. **Per spazi liberi** uguaglia gli intervalli tra i bounding box, utile per dimensioni diverse. Le label non influenzano le misure del simbolo. Distribuzione e spaziatura sono gruppi separati. I comandi si disabilitano quando mancano elementi o la distanza sovrapporrebbe i loro limiti sull’asse scelto; il tooltip spiega il motivo. I fili collegati e le annotazioni associate non sono disposti una seconda volta: seguono i loro riferimenti. Se l’operazione riguarda un sottoinsieme, il pannello ne indica il numero.

In **Geometria → Spaziatura esatta**, scegli **Distanza tra i centri** oppure **Spazio libero tra i bordi**, poi inserisci il valore in **Orizzontale (X)** o **Verticale (Y)** e conferma con il pulsante accanto o Enter. I campi iniziano vuoti: sono distanze da applicare, non misure attuali della selezione. Entrambi gli assi sono sempre visibili. Il primo oggetto sull’asse rimane fermo; gli altri si spostano nell’ordine geometrico. Il valore è in unità documento (`u`); la griglia è 20 u. I comandi riutilizzano lo spostamento dei componenti: terminali, junction e riferimenti elettrici vengono conservati. Le junction non selezionate restano ferme e il routing può aggiungere gomiti ai fili per mantenere la connessione.

Durante un drag le guide mostrano allineamenti, terminali, quote e spaziatura uniforme. Nei rami paralleli si privilegiano i centri dei generatori e gli assi dei rami. Le quote usano le coordinate del documento e restano leggibili allo zoom; spariscono al rilascio. **Shift** mostra ulteriori quote di centri e spazi liberi; **Alt/Option** disabilita temporaneamente anche lo snap alla griglia. In assenza di selezione, **Aggancia durante spostamento** abilita/disabilita le assistenze del drag. Inserimento e disegno mantengono i propri comandi di snapping.

### Stili di linea e continuazioni

Per fili, linee decorative e rettangoli scegli **Stile linea → Continua / Tratteggiata / Puntinata**. Trattino e intervallo si misurano in unità documento e possono essere modificati anche per più oggetti. Un filo privo di stile nei JSON precedenti resta continuo. Il tratteggio mantiene endpoint e topologia; una hit area continua permette di selezionarlo anche nei vuoti.

Per rendere tratteggiata solo una continuazione, seleziona il filo, usa **clic destro → Dividi filo…**, poi clicca sul punto desiderato. Il filo viene diviso in due oggetti collegati da una junction; il secondo rimane selezionato e può ricevere uno stile indipendente. Escape annulla la scelta del punto. La divisione conserva eventuali annotazioni di corrente e non viene eseguita sugli endpoint o su incroci con altri oggetti, evitando collegamenti involontari.

### Rettangoli e linee decorative

In **Disegno e annotazioni** trovi **Rettangolo** e **Linea decorativa**. Trascina per creare; la preview segue la griglia. Per il rettangolo **Shift** crea un quadrato e **Alt/Option** disegna dal centro; tutti i versi di trascinamento sono supportati. Per la linea **Shift** vincola a multipli di 45°. Escape annulla la preview.

Il rettangolo nasce senza riempimento. Selezionalo sul bordo, spostalo, trascina i quattro handle oppure modifica larghezza e altezza nell’inspector. **Aspetto** controlla colore, spessore e stile del contorno, riempimento e opacità indipendenti. Un rettangolo vuoto lascia selezionabili gli oggetti interni; entrambi i nuovi oggetti vengono disegnati dietro i componenti e non creano connessioni elettriche. La rotazione di 90° scambia larghezza e altezza: il rettangolo resta allineato agli assi. Un ridimensionamento completo è un solo undo; Escape ripristina la geometria iniziale.

### Evidenziatore

Scegli **Disegno e annotazioni → Evidenziatore**. L’inspector Proprietà mostra le impostazioni del prossimo tratto: **Intelligente** evidenzia un componente con un clic oppure segue in un solo trascinamento fili, nodi e componenti collegati, senza aggancio alla griglia; **Libera** disegna ovunque, anche su simboli o zone vuote. Trascina e rilascia per confermare; lo strumento rimane attivo. **Esc** torna alla selezione e annulla una pennellata in corso. Cambio strumento, perdita di focus e interruzione del puntatore eliminano la preview senza oggetti incompleti.

I valori iniziali sono giallo `#FACC15`, opacità 40% e spessore 12 u. Il menu colore con sei preset e selettore personalizzato, l’opacità affiancata e il campo spessore usano gli stessi controlli compatti degli altri oggetti; le impostazioni si mantengono fra pennellate. Le evidenziazioni si disegnano dietro a circuito e testi, con estremità e giunzioni arrotondate.

Seleziona un tratto sul suo bordo o con **Alt/Option + clic** quando è coperto dal circuito; **Shift + Alt/Option + clic** aggiunge o rimuove evidenziazioni sovrapposte dalla multiselezione. Le proprietà comuni modificano colore, opacità e spessore. Le evidenziazioni dei componenti seguono corpo, posizione e rotazione del simbolo. **Scollega dal componente** congela il tratto per spostarlo liberamente. Il gesto può attraversare più componenti, cambiare direzione nei nodi e tornare indietro per accorciare il percorso. Alle biforcazioni segue il ramo indicato dal puntatore; gli incroci senza nodo e gli estremi liberi soltanto coincidenti restano separati. Anche movimenti rapidi attraversano più elementi nello stesso gesto. Gli handle modificano gli estremi dei tratti liberi o intelligenti; **Inizio/Fine** regolano le posizioni esatte sul primo e sull’ultimo elemento del percorso. Gli estremi sono proporzionali alla lunghezza dell’elemento di riferimento: seguono spostamenti, rotazioni, vertici e cambi di routing. Il corpo dei componenti rimane evidenziato insieme ai fili, senza giunture più scure. Un filo diviso mantiene i riferimenti sui rami risultanti; eliminando un riferimento il tratto resta libero sul foglio con lo stesso aspetto. **Scollega dal percorso** permette di spostare liberamente una copia geometrica dell’intera evidenziazione. I percorsi liberi si spostano anche con i tasti freccia.

Copia, taglia, incolla, duplicazione, eliminazione, blocchi personali e Undo/Redo usano il normale sistema degli oggetti. Copiare soltanto un’evidenziazione intelligente produce un percorso indipendente; copiarla con i suoi fili o componenti rimappa i riferimenti. Il JSON v1 continua a leggere i documenti precedenti e valida le nuove geometrie. La copia immagine include le evidenziazioni della selezione, usando lo stesso percorso vettoriale del canvas prima della rasterizzazione.

### Taglia e appunti

**Cmd/Ctrl X** oppure **clic destro → Taglia** copia la selezione nella stessa rappresentazione JSON di Copia e poi rimuove gli originali. La copia interna validata è disponibile prima della cancellazione; appunti negati non impediscono l’incolla nella stessa sessione. Se non è possibile ottenere una copia valida, il documento non viene modificato. Incolla genera nuovi ID, rimappa i collegamenti interni e usa le regole esistenti per le connessioni esterne. Undo e redo registrano il taglio come un’azione.

Gli eventi nativi Copia/Taglia/Incolla dei menu del browser sono supportati anche quando non viene inviato un keydown. In input, textarea, ricerca, editing inline e contenteditable rimane il comportamento nativo del testo.

Il salvataggio locale, i blocchi personali e la copia immagine conservano rettangoli, linee, stili e opacità. Guide, griglia, selezione e handle restano fuori dalle immagini copiate.

## Annotazioni integrate e PNG della selezione

Seleziona un bipolo compatibile e attiva **Annotazioni elettriche → Polarità e tensione**: il componente rimane selezionato. Nella stessa sezione modifica la label LaTeX, **Inverti polarità**, offset dell’annotazione e della label, colori, opacità, spessore e dimensione del testo. La label si chiama **Etichetta tensione**; colori, opacità, spessore e dimensione sono nel gruppo richiudibile **Stile annotazione**. Gli offset indicano spostamenti relativi in unità canvas. Disattivare la casella rimuove l’annotazione; Undo la ripristina con tutte le proprietà.

Selezionando un filo, **Annotazioni elettriche → Corrente** aggiunge o mostra la corrente integrata. Su fili con più tratti, **Riferimento corrente** permette di scegliere **Lungo il filo** oppure un singolo **Tratto**, mantenendo la percentuale quando cambi riferimento. Puoi modificare posizione percentuale, label, **Inverti verso corrente** e offset della label. La freccia resta sul filo. Le correnti non vengono applicate artificialmente ai bipoli. Eventuali annotazioni multiple dei documenti precedenti restano modificabili singolarmente.

I menu delle proprietà seguono lo stesso stile dei menu dell’editor e indicano la scelta corrente con una spunta. Frecce e Home/End navigano tra le opzioni; Enter conferma, Escape chiude, Tab passa al controllo successivo. Quando scegli un altro oggetto, il pannello torna all’inizio; le modifiche dello stesso oggetto conservano invece lo scorrimento.

**Clic destro → Copia come immagine** copia la selezione negli appunti come PNG trasparente a 4×, usando la rappresentazione SVG interna e includendo i collegamenti interni. Include le annotazioni associate ai componenti/fili, esclude griglia, guide e controlli dell’editor. Gli incroci usano tagli geometrici senza aloni bianchi. I PNG molto grandi mantengono i limiti di allocazione esistenti.

Enter e Space sui controlli del pannello non avviano comandi del canvas. Undo/redo da selettori, pulsanti e gruppi del pannello conservano il contesto degli oggetti ancora presenti; durante la scrittura nei campi testuali rimane l’undo nativo.
