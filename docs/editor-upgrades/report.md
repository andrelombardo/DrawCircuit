# Editor: nove miglioramenti e verifiche

Verifica preliminare alla pubblicazione completata l’11 ottobre 2026 su Node **26.5.0**. Le prove e le evidenze descritte qui riguardano le modifiche locali.

## Funzioni disponibili

| Funzione           | Comportamento e uso                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nodi continui      | **N**, poi clic ripetuti senza Shift. **Esc/V** termina. Nessun duplicato nello stesso punto; ogni inserimento ha un undo.                                                                                                      |
| Testo inline       | Doppio clic o **Enter** sul testo selezionato. Il rendering SVG/KaTeX resta sul foglio, con cursore e selezione discreta. **Enter/clic esterno** conferma, **Esc** annulla.                                                     |
| Corrente integrata | Il comando Corrente agisce direttamente sul filo. Le vecchie correnti esterne vengono migrate preservando testo, verso e riferimento al ramo. Sui tratti brevi la freccia si accorcia.                                          |
| Opacità            | **Stile** offre slider 0–100% indipendenti per simbolo e label, anche nelle selezioni multiple. Anteprima immediata, una transazione per gesto.                                                                                 |
| Routing diagonale  | Con **W** scegli Ortogonale, 45° o Libero; **Shift+W** cambia modalità. Ogni filo conserva il proprio routing. I segmenti restano modificabili e i terminali mantengono riferimenti semantici.                                  |
| Sostituzione batch | Seleziona con Shift+clic o rettangolo, poi **••• → Sostituisci**. Solo destinazioni comuni compatibili; fili e nodi esclusi dalla sostituzione. Un solo undo.                                                                   |
| Label dei nodi     | Posizione iniziale deterministica fra candidati locali; le label già spostate restano ferme. Drag e frecce muovono solo il testo; **Alt/Option+clic** sceglie fra label sovrapposte.                                            |
| Specchia frecce    | Comandi orizzontale/verticale nella toolbar contestuale, anche per gruppi. Si riflettono forma, controlli Bézier e punta; Inverti conserva il significato precedente.                                                           |
| Rotazione a mouse  | Avvicina il puntatore alla freccia selezionata e trascina l’handle esterno. **Shift** aggancia l’orientamento a multipli di 15°; **Esc** annulla. Anche maglie ellittiche, copia e blocchi personali conservano l’orientamento. |

Il formato resta **JSON v1**, con campi opzionali validati e default compatibili: opacità 1, routing ortogonale e rotazione della maglia 0. Nessuna nuova dipendenza.

## File principali

- `src/components/editor/InlineTextEditor.tsx`, `Canvas.tsx`, `CircuitLayer.tsx`, `SelectionLayer.tsx`, `useCanvasInteractions.ts`: editing, targeting, strumenti, gesti e handle.
- `src/components/properties/SelectionStyle.tsx`, `ReplaceDialog.tsx`, `ContextToolbar.tsx`: opacità, batch e toolbar che evita l’handle di rotazione.
- `src/model/types.ts`, `serialization.ts`, `replacement.ts`, `src/store/editorStore.ts`: dati, compatibilità, operazioni atomiche e storia.
- `src/utils/arrows.ts`, `nodeLabels.ts`, `wireRendering.ts`, `geometry.ts`, `wires.ts`, `loops.ts`, `crossings.ts`, `operations.ts`: geometria condivisa e routing.
- `src/annotations/electrical.ts`, `src/personalBlocks/library.ts`, `src/circuit/`, `src/svg/exporter.tsx`, `src/tikz/`: corrente integrata, blocchi, rendering ed esportazioni.
- `tests/editor-upgrades.test.ts`, `tests/editor-upgrades-interactions.test.tsx`: nuovi scenari; le suite precedenti sono aggiornate dove cambia intenzionalmente il comportamento.
- `README.md`, `docs/manuale.md`, `docs/nuove-feature.md`, `HelpDialog.tsx`: guida e shortcut.

Sono state corrette anche le formattazioni preesistenti segnalate da Prettier. Le catture generate nelle cartelle `evidence` e la pagina di confronto generata restano escluse, comprese le due fixture JSON volutamente malformate usate dagli audit: il contenuto delle fixture non è stato corretto artificialmente.

## Controlli automatici

| Controllo                                       | Risultato                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run format:check`                          | Superato                                                                                    |
| `npm run lint`                                  | Superato                                                                                    |
| `npm run test`                                  | **57 file, 1.704 test superati**                                                            |
| Test di interazione dopo gli ultimi affinamenti | **10/10 superati**, inclusa l’invarianza delle frecce non selezionate durante una rotazione |
| `npm run build`                                 | Superato: TypeScript, Vite e generazione PWA                                                |
| `git diff --check`                              | Superato                                                                                    |
| Compilazione export `.tex` dal browser          | Superata con il compilatore LaTeX integrato                                                 |
| Compilazione Obsidian dal browser               | Superata dopo aggiunta della sola classe standalone al blocco TikZ                          |

I test verificano anche il triangolo chiuso con tre resistenze, due componenti ruotati, connessioni terminale/nodo, salvataggio/riapertura, movimento e rotazione dei componenti, copia, suddivisione delle diagonali ed export. Sono coperti 0/50/100% di opacità, rasterizzazione SVG, trasparenza indipendente delle label, incroci traslucidi, JSON legacy e invalidi, sostituzione di cinque componenti con undo unico, incompatibilità senza cambiamenti parziali, mirroring esatto e gesti sotto pan/zoom.

Log: [test](evidence/tests.log), [interazioni](evidence/interactions.log), [build](evidence/build.log), [lint](evidence/lint.log), [formattazione](evidence/format.log), [compilazione](evidence/latex-checks.json).

## Browser reale

Le prove iniziali sul server di sviluppo hanno verificato cinque nodi senza Shift, deduplicazione, Esc e undo; rinomina inline con conferma/annullamento; percorso diagonale diretto; slider al 50% con label indipendenti e sostituzione di tre componenti dentro una selezione mista. A zoom 87% il passaggio del testo matematico all’editor ha variato il rettangolo misurato di meno di 0,01 pixel.

La verifica conclusiva usa la **build di produzione** su `http://127.0.0.1:52781/`, bundle `index-BgzLp2oi.js`, su un’origine nuova per evitare cache PWA di audit precedenti. Il fixture è stato importato tramite **Importa blocchi**, poi inserito sul canvas. Sono verificati mirroring, undo esatto, rotazione tramite handle, mancata modifica della maglia non selezionata e conservazione dopo reload. La toolbar è stata corretta dopo aver osservato che poteva coprire l’handle.

Gli export sono stati letti dal dialogo reale; il PNG è stato scaricato e ispezionato. Il codice TikZ nativo e quello Obsidian sono stati compilati con successo. Il log del browser contiene un precedente errore di riconnessione WebSocket del server di sviluppo; non risultano errori attribuiti all’origine della verifica di produzione.

- [Evidenze produzione](evidence/production-checks.json)
- [Editor finale](evidence/editor-final.png) e [editing inline](evidence/inline-editor.png)
- [SVG reale](evidence/browser.svg) e [PNG reale](evidence/browser.png)
- [TikZ nativo compilato](evidence/browser-native.tex)
- [Blocco Obsidian](evidence/browser-obsidian.md) e [versione standalone compilata](evidence/browser-obsidian.tex)
- [Triangolo JSON](evidence/triangle.json) e [libreria importabile](evidence/triangle-block.json)

Per rigenerare il fixture di partenza: `node scripts/create-editor-upgrades-fixture.mjs`. Gli export `browser-*` includono invece la rotazione aggiuntiva eseguita manualmente durante la verifica.

## Limiti espliciti

- Il posizionamento delle label è un’euristica locale: disegni molto densi possono richiedere un aggiustamento manuale.
- Il cursore usa le misure dei caratteri SVG per il testo normale. Per formule complesse mappa approssimativamente le posizioni del sorgente LaTeX sul rendering; non è un editor matematico strutturato. Contenuto e preview KaTeX restano preservati.
- I simboli nativi CircuitikZ possono differire nelle proporzioni dal canvas; SVG/PNG e Obsidian usano la geometria vettoriale del disegno.
- La compilazione Obsidian è stata verificata come TeX standalone; non è stata eseguita nell’app Obsidian o nei suoi plugin. Non sono stati misurati FPS su altri dispositivi.
- L’incolla JSON dagli appunti del browser integrato non ha importato il fixture nella prima prova; è stata usata l’importazione di blocchi tramite file. I percorsi copia/incolla restano coperti dai test automatici.
- Le evidenze raccolte qui precedono la pubblicazione; i controlli sul sito pubblico devono riferirsi al commit del relativo deploy GitHub Pages.
