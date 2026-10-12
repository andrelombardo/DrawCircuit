# Properties Inspector e comandi contestuali

Verifica completata il 12 ottobre 2026, con Node 26.5.0.

## Layout condiviso

`PropertyRow` definisce un'unica griglia per etichetta, controllo principale e valore secondario. `PropertyField`, `PropertySelect` e le righe colore usano questa griglia: lo spessore parte sullo stesso asse dei colori. La scala CSS condivisa usa controlli di 30 px, gap di 8 px, padding di sezione di 12 px e radius di 5 px.

L'header è compatto e distingue il tipo dell'oggetto, con anteprima del simbolo, dall'etichetta modificabile. Il menu a tre puntini è stato rimosso. Le proprietà rimangono specifiche per tipo e le opacità di simbolo, etichetta e riempimento restano indipendenti.

## Posizione dei comandi

| Comando                                      | Posizione                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Annulla / Ripristina                         | Menu Modifica, toolbar e shortcut                                                             |
| Taglia / Copia / Incolla / Duplica / Elimina | Menu Modifica, clic destro sugli elementi e shortcut                                          |
| Seleziona tutto                              | Menu Modifica, clic destro sul canvas vuoto e shortcut                                        |
| Sostituisci                                  | Clic destro sulle selezioni con sostituzioni compatibili                                      |
| Rotazione e incremento 45° / 90°             | Posizione nell'inspector; incremento e shortcut R richiamano la stessa operazione nello store |
| Polarità                                     | Proprietà elettriche dei componenti compatibili; resta anche lo strumento di disegno          |
| Inverti lato / direzione, specchia           | Geometria nell'inspector                                                                      |
| Corrente sul filo / Dividi filo              | Clic destro su un singolo filo                                                                |
| Salva come blocco                            | Clic destro e libreria Blocchi personali                                                      |
| Copia come immagine                          | Esporta → Copia PNG, con ambito tutto / selezione                                             |

I menu riusano le operazioni esistenti nello store e un solo sistema di dialoghi per sostituzione e blocchi. Le scorciatoie sono mostrate per la piattaforma corrente. Incolla rimane raggiungibile perché i permessi degli appunti non permettono di prevederne affidabilmente il contenuto senza una lettura esplicita.

I menu sono opachi, compatti e ancorati al puntatore. Il posizionamento rispetta i bordi della finestra; i pannelli vengono montati in un portal per evitare il clipping della sidebar. Escape, clic esterno, frecce, Home/End, ricerca per iniziale ed Enter sono supportati. Shift+F10 apre il menu dalla tastiera. Il clic destro su un elemento già selezionato conserva la multiselezione; su un altro elemento lo seleziona, oppure lo aggiunge con Shift. Sul canvas vuoto il menu non cancella la selezione.

## Verifiche eseguite

| Verifica                               | Risultato                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm ci`                               | Completato, 0 vulnerabilità riportate                                                                       |
| `npm run format:check`                 | Superato                                                                                                    |
| `npm run lint`                         | Superato                                                                                                    |
| `npm run test`                         | 59 file, 1792 test superati                                                                                 |
| `npm run build`                        | Superato, inclusa generazione PWA                                                                           |
| Browser locale sviluppo                | Resistenza, filo, rettangolo con riempimento/opacità, multiselezione e relativi menu verificati visivamente |
| Ridimensionamento                      | 252 px, 440 px, trascinamento a 340 px e ripristino a 292 px verificati                                     |
| Finestra stretta                       | Toolbar contenuta nello spazio visibile davanti alla sidebar; menu leggibili sopra il pannello              |
| Browser build di produzione            | Inspector e menu verificati, aggiornamento PWA applicato, nessun errore o warning in console                |
| Allineamento nel build finale a 252 px | Simbolo, Etichetta e Spessore: origine X 1121 px, altezza 30 px, nel viewport di prova                      |
| Tema scuro                             | Non applicabile: l'app attualmente offre solo il tema chiaro                                                |

Il build segnala un chunk JavaScript superiore a 500 kB; la compilazione e la generazione della PWA terminano correttamente. Gli screenshot prima/dopo e dei casi controllati sono conservati come artefatti locali della verifica.

I test aggiunti coprono i menu per componenti, fili, nodi, testi, graffe, frecce, maglie, rettangoli e linee; selezione singola/multipla, targeting del clic destro, stati abilitati del menu Modifica, navigazione da tastiera, chiusura, posizionamento ai bordi, scorciatoie macOS/Windows/Linux, input protetti e salvataggio dalla libreria. I test di regressione esistenti continuano a coprire rendering, geometria, undo/redo, clipboard, sostituzione, export, persistenza e pan/zoom.

## File interessati

- `src/App.tsx`
- `src/components/editor/Canvas.tsx`
- `src/components/properties/PropertiesContent.tsx`
- `src/components/properties/PropertyControls.tsx`
- `src/components/properties/SelectionActions.tsx`
- `src/components/properties/SelectionStyle.tsx`
- `src/components/toolbar/ActionMenu.tsx`
- `src/components/toolbar/ExportDialog.tsx`
- `src/components/toolbar/HelpDialog.tsx`
- `src/components/toolbar/Toolbar.tsx`
- `src/components/toolbar/useFloatingToolbar.ts`
- `src/personalBlocks/PersonalBlockPalette.tsx`
- `src/styles.css`
- `src/utils/platform.ts`
- `tests/contextual-ux.test.tsx`
- `tests/drawing-menu.test.tsx`
- `tests/editor-upgrades-interactions.test.tsx`
- `tests/helpers/selectionMenu.ts`
- `tests/obsidian-export-dialog.test.tsx`
- `tests/properties-inspector-interactions.test.tsx`
- `tests/ui-restyling.test.tsx`
- `tests/ux-cleanup.test.tsx`
- `tests/ux-refinement-interactions.test.tsx`
- `src/components/properties/EditorCommandContext.ts`
- `src/components/toolbar/useEditActions.tsx`
