# DrawCircuit — Libreria, blocchi e topologia

Data: 3 ottobre 2026. Sessione RC locale su `http://127.0.0.1:4185/`; le evidenze iniziali sono state conservate e verificate alla ripresa. Questo rapporto riguarda la libreria e la topologia. Build, pubblicazione, Actions e collaudo pubblico sono riportati in [report-finale.md](report-finale.md).

## Esito e metodo

PASS per **72 componenti**, **168 pin**, **672 posizioni dei pin** a 0°/90°/180°/270° e **23 preset**. Scollegamento e ricollegamento esplicito di un terminale eseguiti nel browser su **tutti i 23 preset**: il JSON scollegato contiene un endpoint libero; quello ricollegato recupera lo stesso `componentId` e `terminalId`, senza aggiungere oggetti.

La colonna **UI reale** indica interazioni mouse/tastiera automatizzate attraverso il browser dell’app: non è un test che chiama direttamente lo store. La colonna **automatico** indica prove Vitest su modello o DOM simulato. Le schermate e i codici prodotti dai controlli nativi sono evidenze separate. Non si attribuisce un collaudo umano indipendente alla matrice automatizzata.

- Inventario: [lib-inventory.json](evidence/lib-inventory.json).
- Cicli UI dei componenti: [lib-component-browser-results.json](evidence/lib-component-browser-results.json).
- Geometria e XML: [lib-browser-geometry-validation.log](evidence/lib-browser-geometry-validation.log).
- Cicli UI dei preset: [lib-preset-browser-results.json](evidence/lib-preset-browser-results.json).
- Scollegamento/ricollegamento dei 23 preset: [lib-preset-disconnect-reconnect-results.json](evidence/lib-preset-disconnect-reconnect-results.json).
- Validazione dei JSON realmente salvati: [lib-final-semantic-validation.json](evidence/lib-final-semantic-validation.json).

## Matrice completa dei 72 componenti

Per ogni riga il ciclo UI comprende ricerca e inserimento dalla palette, selezione, modifica label, trascinamento, collegamento di **ogni pin**, quattro rotazioni con fili collegati, duplicazione, cancellazione, Annulla/Ripeti, lettura dei tre export TikZ/Obsidian/SVG e persistenza dopo reload. Per ogni tipo sono conservati `lib-TIPO.png`, `.svg`, `.tikz` e `-obsidian.md`.

La matrice automatica aggiunge tutte le sostituzioni consentite a tutte e quattro le rotazioni, con ID, label, posizione e percorsi dei fili conservati, serializzazione valida e documento di partenza immutato. I tipi senza sostituzioni compatibili restano verificati come tali; non vengono inventate conversioni incompatibili.

|   # | Tipo                   | Componente                     | Categoria     | Pin | UI reale | Rotazioni | Export 3 | Automatico |
| --: | ---------------------- | ------------------------------ | ------------- | --: | -------- | --------- | -------- | ---------- |
|   1 | `resistor`             | Resistenza                     | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   2 | `americanResistor`     | Resistenza statunitense        | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   3 | `capacitor`            | Condensatore                   | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   4 | `polarizedCapacitor`   | Condensatore polarizzato       | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   5 | `inductor`             | Induttore                      | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   6 | `variableResistor`     | Resistenza variabile           | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|   7 | `potentiometer`        | Potenziometro                  | Passivi       |   3 | PASS     | 4/4       | PASS     | PASS       |
|   8 | `voltageSource`        | Generatore di tensione DC      | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|   9 | `currentSource`        | Generatore di corrente DC      | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  10 | `battery`              | Batteria multicella            | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  11 | `dependentVoltage`     | Tensione dipendente            | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  12 | `dependentCurrent`     | Corrente dipendente            | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  13 | `diode`                | Diodo                          | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  14 | `led`                  | LED                            | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  15 | `zener`                | Diodo Zener                    | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  16 | `openSwitch`           | Interruttore aperto            | Interruttori  |   2 | PASS     | 4/4       | PASS     | PASS       |
|  17 | `closedSwitch`         | Interruttore chiuso            | Interruttori  |   2 | PASS     | 4/4       | PASS     | PASS       |
|  18 | `ground`               | Massa / terra                  | Riferimenti   |   1 | PASS     | 4/4       | PASS     | PASS       |
|  19 | `ammeter`              | Amperometro                    | Misura        |   2 | PASS     | 4/4       | PASS     | PASS       |
|  20 | `voltmeter`            | Voltmetro                      | Misura        |   2 | PASS     | 4/4       | PASS     | PASS       |
|  21 | `transformer`          | Trasformatore                  | Trasformatori |   4 | PASS     | 4/4       | PASS     | PASS       |
|  22 | `blackBox`             | Blocco rettangolare            | Blocchi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  23 | `thermistor`           | Termistore                     | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  24 | `photoresistor`        | Fotoresistenza / LDR           | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  25 | `variableCapacitor`    | Condensatore variabile         | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  26 | `variableInductor`     | Induttore variabile            | Passivi       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  27 | `acVoltageSource`      | Generatore di tensione AC      | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  28 | `acCurrentSource`      | Generatore di corrente AC      | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  29 | `genericVoltageSource` | Tensione generica              | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  30 | `genericCurrentSource` | Corrente generica              | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  31 | `singleCellBattery`    | Batteria a cella singola       | Generatori    |   2 | PASS     | 4/4       | PASS     | PASS       |
|  32 | `photodiode`           | Fotodiodo                      | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  33 | `schottky`             | Diodo Schottky                 | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  34 | `varactor`             | Diodo varicap                  | Diodi         |   2 | PASS     | 4/4       | PASS     | PASS       |
|  35 | `npn`                  | Transistor NPN                 | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  36 | `pnp`                  | Transistor PNP                 | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  37 | `nmos`                 | MOSFET NMOS                    | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  38 | `pmos`                 | MOSFET PMOS                    | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  39 | `njfet`                | JFET canale N                  | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  40 | `pjfet`                | JFET canale P                  | Transistor    |   3 | PASS     | 4/4       | PASS     | PASS       |
|  41 | `spdt`                 | Commutatore SPDT               | Interruttori  |   3 | PASS     | 4/4       | PASS     | PASS       |
|  42 | `pushButtonNO`         | Pulsante normalmente aperto    | Interruttori  |   2 | PASS     | 4/4       | PASS     | PASS       |
|  43 | `pushButtonNC`         | Pulsante normalmente chiuso    | Interruttori  |   2 | PASS     | 4/4       | PASS     | PASS       |
|  44 | `dpst`                 | Interruttore DPST              | Interruttori  |   4 | PASS     | 4/4       | PASS     | PASS       |
|  45 | `dpdt`                 | Commutatore DPDT               | Interruttori  |   6 | PASS     | 4/4       | PASS     | PASS       |
|  46 | `ohmmeter`             | Ohmmetro                       | Misura        |   2 | PASS     | 4/4       | PASS     | PASS       |
|  47 | `galvanometer`         | Galvanometro                   | Misura        |   2 | PASS     | 4/4       | PASS     | PASS       |
|  48 | `signalGround`         | Massa segnale                  | Riferimenti   |   1 | PASS     | 4/4       | PASS     | PASS       |
|  49 | `chassisGround`        | Massa telaio                   | Riferimenti   |   1 | PASS     | 4/4       | PASS     | PASS       |
|  50 | `centerTapTransformer` | Trasformatore a presa centrale | Trasformatori |   5 | PASS     | 4/4       | PASS     | PASS       |
|  51 | `coupledInductors`     | Induttori accoppiati           | Trasformatori |   4 | PASS     | 4/4       | PASS     | PASS       |
|  52 | `opAmp`                | Amplificatore operazionale     | Analogici     |   3 | PASS     | 4/4       | PASS     | PASS       |
|  53 | `comparator`           | Comparatore                    | Analogici     |   3 | PASS     | 4/4       | PASS     | PASS       |
|  54 | `andGate`              | Porta AND                      | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  55 | `orGate`               | Porta OR                       | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  56 | `notGate`              | Porta NOT                      | Digitali      |   2 | PASS     | 4/4       | PASS     | PASS       |
|  57 | `nandGate`             | Porta NAND                     | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  58 | `norGate`              | Porta NOR                      | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  59 | `xorGate`              | Porta XOR                      | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  60 | `xnorGate`             | Porta XNOR                     | Digitali      |   3 | PASS     | 4/4       | PASS     | PASS       |
|  61 | `buffer`               | Buffer                         | Digitali      |   2 | PASS     | 4/4       | PASS     | PASS       |
|  62 | `terminal`             | Terminale                      | Utilità       |   1 | PASS     | 4/4       | PASS     | PASS       |
|  63 | `testPoint`            | Punto di test                  | Utilità       |   1 | PASS     | 4/4       | PASS     | PASS       |
|  64 | `connector2`           | Connettore 2 pin               | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  65 | `connector3`           | Connettore 3 pin               | Utilità       |   3 | PASS     | 4/4       | PASS     | PASS       |
|  66 | `port`                 | Porta generica                 | Utilità       |   1 | PASS     | 4/4       | PASS     | PASS       |
|  67 | `fuse`                 | Fusibile                       | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  68 | `lamp`                 | Lampadina                      | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  69 | `motor`                | Motore                         | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  70 | `speaker`              | Altoparlante                   | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  71 | `buzzer`               | Buzzer                         | Utilità       |   2 | PASS     | 4/4       | PASS     | PASS       |
|  72 | `circleBlock`          | Blocco circolare               | Blocchi       |   2 | PASS     | 4/4       | PASS     | PASS       |

## Matrice completa dei 23 preset

Ogni preset è stato cercato, mostrato come ghost, inserito, mosso come selezione nativa e ruotato nelle quattro direzioni. Il ciclo comprende inserimento e trascinamento di un bend, Annulla/Ripeti, TikZ/Obsidian/SVG, Salva JSON, reload e reimportazione tramite il selettore file. Nel passaggio finale un endpoint di filo realmente collegato a un componente è stato trascinato in spazio libero e poi riportato sul pin originale. I due JSON per ciascun preset sono `lib-preset-ID-detached.json` e `lib-preset-ID-reconnected.json`.

Gli assert automatici coprono registro, allocazione label, inserimento/rotazione, collegamenti, proprietà del grafo e integrazione UI. La semantica della stella e del triangolo è stata ricontrollata sui JSON scaricati dal browser, quindi senza affidarsi al solo nome o aspetto del preset.

|   # | ID                     | Preset                                | UI reale e 4 rotazioni | Export 3 | JSON reload/reimport | Scollega/ricollega | Automatico |
| --: | ---------------------- | ------------------------------------- | ---------------------- | -------- | -------------------- | ------------------ | ---------- |
|   1 | `resistors-series-2`   | 2 resistenze in serie                 | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   2 | `resistors-series-3`   | 3 resistenze in serie                 | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   3 | `resistors-parallel-2` | 2 resistenze in parallelo             | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   4 | `resistors-parallel-3` | 3 resistenze in parallelo             | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   5 | `resistor-star`        | Stella di resistenze / Y              | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   6 | `resistor-delta`       | Triangolo di resistenze / Delta       | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   7 | `voltage-divider`      | Partitore di tensione                 | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   8 | `current-divider`      | Partitore di corrente                 | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|   9 | `wheatstone-bridge`    | Ponte di Wheatstone                   | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  10 | `real-voltage-source`  | Generatore reale di tensione          | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  11 | `real-current-source`  | Generatore reale di corrente          | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  12 | `thevenin`             | Equivalente di Thévenin               | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  13 | `norton`               | Equivalente di Norton                 | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  14 | `rc-series`            | RC serie                              | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  15 | `rl-series`            | RL serie                              | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  16 | `rlc-series`           | RLC serie                             | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  17 | `rc-parallel`          | RC parallelo                          | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  18 | `rl-parallel`          | RL parallelo                          | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  19 | `rlc-parallel`         | RLC parallelo                         | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  20 | `source-resistor`      | Generatore di tensione e resistenza   | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  21 | `two-meshes`           | Rete a due maglie                     | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  22 | `three-branches`       | Rete a tre rami                       | PASS                   | PASS     | PASS                 | PASS               | PASS       |
|  23 | `source-series-load`   | Generatore, resistenza serie e carico | PASS                   | PASS     | PASS                 | PASS               | PASS       |

### Semantica stella e triangolo

Nel JSON di [stella](evidence/lib-preset-resistor-star.json), A/B/C/N sono quattro net distinte. `R_1` collega A–N, `R_2` B–N, `R_3` C–N. Nel JSON di [triangolo](evidence/lib-preset-resistor-delta.json), A/B/C restano tre net distinte; `R_{AB}`, `R_{BC}`, `R_{CA}` collegano rispettivamente A–B, B–C, C–A. Il calcolo usa i riferimenti di endpoint e i fili; le pieghe non creano collegamenti elettrici aggiuntivi. Tutti i 23 documenti hanno ID univoci e riferimenti a terminali/giunzioni esistenti.

## Blocchi personali — ciclo completo

Il blocco complesso è stato creato nell’UI da un transistor NPN, un operazionale, sei fili verso i rispettivi pin, due fili incrociati, corrente associata a un filo, tensione tra due punti e Loop Arrow: **13 oggetti**. È stato salvato con nome, ricaricato, inserito una seconda volta, rinominato due volte, esportato, eliminato dalla libreria e reimportato dal file esportato. Il nome rinominato e il blocco reimportato restano disponibili dopo reload.

- Originale: [13 oggetti](evidence/lib-personal-original.json).
- Due istanze: [26 oggetti](evidence/lib-personal-twice.json), label automatiche `Q_1/U_1` e `Q_2/U_2`, ID e riferimenti dei fili distinti; la corrente di ciascuna copia punta al proprio filo.
- Quattro rotazioni della selezione: [risultato](evidence/lib-personal-four-rotations.json) con oggetti esattamente uguali al documento prima delle rotazioni.
- Nuova istanza ruotata 90° dopo il reload: [41 oggetti](evidence/lib-personal-third-rotated.json). Il documento di partenza aveva 28 oggetti perché la giunzione dell’incrocio era stata creata, aveva spezzato due fili in quattro, ed era stata poi cancellata.
- Annulla inserimento torna a [28 oggetti](evidence/lib-personal-insert-undo.json); Ripeti torna agli [stessi 41 oggetti](evidence/lib-personal-insert-redo.json).
- Libreria rinominata esportata: [lib-personal-library-final.json](evidence/lib-personal-library-final.json). Eliminazione e importazione provate attraverso i pulsanti nativi; persistenza del documento dopo import: [lib-personal-after-library-import.json](evidence/lib-personal-after-library-import.json).
- Export finali: [TikZ](evidence/lib-personal-final.tikz), [Obsidian](evidence/lib-personal-final-obsidian.md), [SVG](evidence/lib-personal-final.svg), [schermata](evidence/lib-personal-final.png).

Un precedente ciclo di blocco derivato da tre bipoli conserva inoltre [le quattro rotazioni UI](evidence/lib-personal-rotations.json) e i quattro gruppi di export `lib-personal-0/90/180/270`. La prova finale complessa estende la copertura a multiterminali, corrente, tensione, Loop Arrow e incroci.

La validazione finale verifica ID univoci, riferimenti di tutti i fili, riferimenti delle correnti e label distinte nelle copie. I cinque test in `release-candidate-block-persistence.test.ts` coprono anche backup del dato corrotto, fallimento del backup, import atomico e mancata riscrittura della libreria valida. Questi casi di storage sono fault injection automatizzata, non manipolazione della libreria personale del browser.

## Circuiti golden e operazioni distruttive

| Caso                                                     | UI reale            | Verifica concreta                                                                                                | Evidenza                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLC serie: R→C→L                                         | PASS                | stesso ID e label, tutti i percorsi SVG dei fili identici; Annulla ripristina R, Ripeti ripristina C             | [risultati](evidence/lib-replacement-ui-results.json), [JSON finale](evidence/lib-rlc-capacitor-to-inductor-ui.json), [schermata](evidence/lib-rlc-replacement-final.png) |
| NPN→PNP con tre pin collegati                            | PASS                | stesso ID, percorsi dei sei fili complessivi identici                                                            | [JSON](evidence/lib-npn-to-pnp-ui.json)                                                                                                                                   |
| Operazionale→comparatore                                 | PASS                | stesso ID, fili ai tre pin invariati                                                                             | [JSON](evidence/lib-opamp-to-comparator-ui.json)                                                                                                                          |
| Incrocio senza giunzione                                 | PASS                | endpoint liberi distinti e ponte negli export TikZ/SVG                                                           | [TikZ](evidence/lib-crossing-without-junction.tikz), [SVG](evidence/lib-crossing-without-junction.svg), [schermata](evidence/lib-crossing-without-junction.png)           |
| Incrocio con giunzione                                   | PASS                | nodo unico e quattro endpoint riferiti a quel nodo, split dei due fili                                           | [JSON](evidence/lib-crossing-with-junction.json), [SVG](evidence/lib-crossing-with-junction.svg), [schermata](evidence/lib-crossing-with-junction.png)                    |
| Cancellazione giunzione con quattro rami                 | PASS                | tutti gli endpoint diventano liberi, nessun riferimento pendente; Annulla/Ripeti ripristinano gli oggetti esatti | [delete](evidence/lib-junction-deleted.json), [undo](evidence/lib-junction-delete-undo.json), [redo](evidence/lib-junction-delete-redo.json)                              |
| Cancellazione terminale e filo esportato senza terminale | PASS dopo fix RC-03 | percorso `M 0 -40 L 0 100 L 160 100` identico prima/dopo                                                         | [retest](evidence/lib-delete-terminal-retest.json), [prima](evidence/lib-delete-terminal-before.png), [dopo](evidence/lib-delete-terminal-fixed.png)                      |

La sostituzione conserva la label semantica: dopo R→C→L la prima induttanza continua a chiamarsi `R_1`, come richiesto dalla proprietà di preservazione; non è una rietichettatura automatica.

## Bug verificati pertinenti alla libreria e topologia

Il conteggio dell’audit completo resta **9 bug: 2 P0, 1 P1, 4 P2, 2 P3**; le righe seguenti sono un sottoinsieme, non bug aggiuntivi. Tutti sono corretti e ricontrollati nelle rispettive prove.

### RC-09 — P1: nodo già presente maschera un filo scollegato

**Passi riproducibili:** creare A a (40,100) sul filo orizzontale, poi disegnare un filo libero verticale da (40,20) a (40,160) che passa per A, senza terminarlo sul nodo. **Atteso:** ponte visibile finché non si esegue un collegamento esplicito; Nodo sul punto deve collegare il nuovo filo usando lo stesso A. **Prima del fix:** il dot di A sopprimeva il ponte, pur avendo entrambi gli endpoint verticali `free`; spostando A il verticale non seguiva il nodo. Nodo sul punto non riparava la topologia.

**Root cause:** `wireCrossings` eliminava qualunque incrocio alle coordinate di una giunzione, senza verificare i riferimenti; `insertJunction` e l’azione Nodo tornavano subito quando trovavano un nodo esistente. **Fix:** soppressione del ponte solo per terminale/giunzione realmente condiviso; Quick Junction riusa la giunzione e divide/riancora i fili passanti. La sola coincidenza geometrica non collega automaticamente il filo. Un secondo comando Nodo senza nuovi fili è idempotente.

La revisione finale ha esteso lo stesso RC-09 alla **proprietà visiva del dot**: disegnare sempre il ponte orizzontale lasciava A sulla verticale scollegata, mentre i suoi endpoint appartenevano all’orizzontale. Ora il filo estraneo scavalca il nodo e il filo che lo possiede resta dritto attraverso il dot. In questa riproduzione il ponte verticale usa raggio 12 px: il dot da 4,5 px conserva 1,5 px di spazio anche rispetto all’alone bianco del ponte. Gli incroci ordinari mantengono ponte orizzontale e raggio 7 px. Editor, SVG, TikZ nativo e Obsidian consumano la stessa geometria e usano colore e spessore del filo corretto.

**Regressione:** cinque casi di modello coprono nodo usato solo dall’orizzontale o solo dalla verticale, nodo sovrapposto ma estraneo, collegamento esplicito con corrente mantenuta ed endpoint libero su nodo esistente. I due orientamenti verificano endpoint, distanza dal dot e dall’alone, editor SSR e geometria/colore/spessore nei tre export con le rispettive unità. Un test UI copre click Nodo, split, giunzione non duplicata e Annulla/Ripeti in un solo passo. Prima estensione: **149 test / 5 file PASS**, [log](evidence/lib-final-topology-regression-tests.log). Estensione alla proprietà del dot: **291 test / 6 file PASS**, poi **83 test / 1 file PASS** dopo l’ultima assert sul ponte ordinario, [log](evidence/lib-rc09-dot-ownership-regression-tests.log).

**Retest browser indipendente dell’editor:** prima [JSON](evidence/ux-cross-existing-node-before.json) e [schermata](evidence/ux-cross-existing-node-before.jpg); spostamento che dimostra il mancato collegamento [schermata](evidence/ux-cross-existing-node-moved.jpg). Dopo fix il [ponte è visibile](evidence/ux-cross-existing-node-fixed-unconnected.jpg); Nodo porta i fili da 16 a 17 e crea quattro endpoint riferiti allo stesso A. Annulla torna a 16, Ripeti a 17. Spostando A da (40,100) a (80,120) [tutti e quattro i rami seguono](evidence/ux-cross-existing-node-fixed-connected-moved.jpg); [undo dello spostamento](evidence/ux-cross-existing-node-fixed-connected.jpg). [JSON golden finale](evidence/ux-final-golden.json), [dopo reload](evidence/ux-final-golden-reloaded.json) e [dopo reimport](evidence/ux-final-golden-loaded.json).

**Retest finale della proprietà visiva:** il responsabile del rilascio ha ricaricato lo stesso JSON sull’editor locale `http://127.0.0.1:4194/`. La [schermata al 75%](evidence/rc09-final-ownership-75.jpg) mostra A sul ramo orizzontale e il filo verticale libero che passa al lato del dot con spazio visibile; revisione indipendente dell’immagine PASS. Gli export letti dai controlli UI — [SVG](evidence/rc09-final-ownership.svg), [TikZ nativo](evidence/rc09-final-ownership.tikz), [Obsidian](evidence/rc09-final-ownership-obsidian.md) — contengono lo stesso ponte verticale intorno ad A e conservano quello orizzontale ordinario a sinistra. Il percorso SVG del ponte di A è `M 40 88 C 52 92.8 52 107.2 40 112`; le coordinate e gli spessori dei due TikZ sono coerenti dopo le rispettive conversioni di unità. Il ciclo finale Nodo/Annulla/Ripeti/spostamento e il nuovo gate sono documentati dal responsabile nel rapporto finale.

### RC-03 — P2: detach cambia il percorso del filo

Cancellare un componente o estrarre il solo filo perdeva la direzione del terminale e ricalcolava un percorso diverso. Il fix conserva prima il percorso visibile e usa i punti intermedi quando l’endpoint diventa libero. Test nelle quattro rotazioni, copia del solo filo, cancellazione di entrambi i terminali, serializzazione e documento sorgente immutato; retest reale riportato nella tabella.

### RC-01 — P0 e RC-06 — P3: libreria corrotta e import non leggibile

Il loader della libreria poteva aprire un fallback e poi sostituire il dato corrotto al salvataggio. Ora l’errore è visibile, il raw originale viene copiato in un backup di recupero prima della nuova scrittura e, se il backup fallisce, l’originale resta intatto. Import JSON sintatticamente invalido è rifiutato atomicamente con messaggio italiano. Prove: [lib-block-persistence-tests.log](evidence/lib-block-persistence-tests.log) e rapporto [persistenza](persistence-pwa-performance.md).

## Limiti e gate finale

Il rendering di TikZ/Obsidian su renderer esterno, la compilazione LaTeX e il collaudo pubblico sono coperti dai rapporti delle rispettive aree, non dedotti dalla sola presenza del codice nella textarea. Questo passaggio ha controllato 105 SVG come XML validi e ha conservato i tre formati richiesti.

Il driver browser non ha notificato l’evento download durante i salvataggi finali; i file effettivamente prodotti dal browser nella cartella Download sono stati letti e copiati nelle evidenze. È un limite del controllo del driver, non un fallimento della funzione Salva JSON.

Il primo gate dopo RC-09 aveva confermato `npm ci`, lint, **955 test / 33 file**, build senza errori TypeScript. L’estensione alla proprietà visiva del dot richiede il nuovo gate completo e il retest browser, riportati nel [rapporto finale](report-finale.md). I documenti di prova contengono solo circuiti e nomi QA; nessun dato personale o credenziale è stato inserito.
