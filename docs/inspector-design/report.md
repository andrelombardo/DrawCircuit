# Inspector delle proprietà — revisione UX/UI

11 ottobre 2026. Revisione della sidebar destra a partire dalla versione `e854a9b`.

## Confronto con i riferimenti

Prima dell’implementazione sono stati confrontati i tre screenshot dell’inspector esistente e i quattro riferimenti Figma forniti dall’utente. I problemi osservati erano campi sproporzionati, due slider di opacità sempre esposti, palette di colori ingombranti, tipografia mescolata all’aspetto e una lunga lista finale di azioni.

Dal riferimento sono stati ripresi la griglia regolare, i campi con prefisso interno, le righe colore/percentuale, i separatori sottili, la tipografia discreta, i gruppi di icone e il menu contestuale. Il pannello conserva colori chiari e linguaggio visivo di DrawCircuit; non aggiunge proprietà Figma estranee al modello del circuito.

## Scelte UX/UI

- Header stabile con titolo Proprietà. Entrambe le sidebar condividono `SidebarToggle` e `SidebarIcon`, specchiato a destra, anche per la riapertura sul canvas.
- Riepilogo del tipo o del numero di elementi selezionati, con menu “…” accanto. Nessuna sezione Azioni.
- Ordine: Generale, Posizione, Aspetto, Testo, Geometria. Le sezioni prive di proprietà pertinenti non compaiono.
- Input e select alti 28 px, radius 5 px, sfondo grigio tenue, cifre tabulari. Padding delle sezioni 14 × 16 px e separatori a tutta larghezza.
- X/Y e W/H affiancati; rotazione su mezzo pannello con una piccola icona, per evitare troncamenti alla larghezza minima.
- Colore e opacità sulla stessa riga: swatch quadrata, HEX e percentuale. Simbolo, etichetta e riempimento restano indipendenti. I cinque preset e il selettore personalizzato sono nel menu colore.
- La dimensione e l’allineamento del testo sono nella sezione Testo. Spessore, riempimento e stile linea rimangono in Aspetto.
- Allineamento in due gruppi di tre icone; distribuzione per centri/spazi e due icone su una riga; spaziatura numerica con asse, unità e conferma.
- Nella selezione eterogenea compaiono soltanto proprietà condivise da tutti gli oggetti selezionati. Gli stati misti usano un trattino, “Misto” o “Valori misti”, senza assumere il valore del primo oggetto.

## Funzioni conservate

| Funzione                                                            | Posizione                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| Duplica, Copia, Taglia, Incolla, Elimina                            | Menu “…” e shortcut esistenti                         |
| Sostituisci componenti                                              | Menu “…” → Sostituisci…                               |
| Salva come blocco, Copia come immagine                              | Menu “…”                                              |
| Ruota, specchia, inverti freccia/lato                               | Menu “…” quando pertinente; handle/shortcut esistenti |
| Corrente sul filo, polarità, divisione filo                         | Menu “…” quando pertinente; menu disegno esistente    |
| Posizione, rotazione, etichette e testo interno                     | Generale / Posizione                                  |
| Colore, opacità, spessore, stile linea, riempimento                 | Aspetto                                               |
| Dimensione e allineamento testo                                     | Testo                                                 |
| Routing, dimensioni, endpoint, offset, allineamento e distribuzione | Geometria                                             |

Le modifiche riutilizzano le operazioni esistenti dello store. I draft numerici/testuali restano locali fino a Enter o blur; Escape annulla. Una conferma produce un solo undo. Il selettore colore nativo mantiene le anteprime raggruppate. Selezionare una label espone le sue proprietà, senza modificare involontariamente il simbolo. JSON, esportatori, topologia e routing non sono stati cambiati.

## Verifica

Ambiente: Node 26.5.0, dipendenze da lockfile con `npm ci`, Vitest/jsdom e browser integrato WebKit. Verifiche richieste: lint, test, build e formattazione.

- `npm run lint`: superato.
- `npm run test`: 59 file, 1.774 test superati.
- `npm run build`: TypeScript, Vite e generazione PWA superati.
- `npm run format:check`: superato.

I test aggiunti verificano gerarchia delle sezioni, assenza di slider/lista Azioni, proprietà comuni, opacità indipendenti e valori non validi, label selezionata, menu da tastiera con focus ripristinato, riempimento e testo multiplo. I test esistenti sono stati aggiornati per accedere ai comandi e ai colori nei nuovi menu; restano le verifiche di sostituzione, clipboard, export, annotazioni, undo/redo e interazioni del canvas. La suite comprende anche il caso da 400 oggetti; non è una misura di FPS del browser.

Nel browser locale sono stati verificati selezione singola, tre generatori, selezione eterogenea di 23 oggetti, rettangolo, apertura del colore personalizzato nativo, modifica/undo dell’opacità, applicazione della spaziatura, overflow e chiusura/riapertura delle sidebar. Nessun errore o warning rilevato nei log della pagina durante queste prove. Controllati viewport 1440 × 900, 1180 × 800, 800 × 700 e 600 × 700; larghezze inspector 252, 292 e 440 px.

### Prove visive

- [Selezione singola](evidence/desktop-single.jpg)
- [Tre generatori selezionati](evidence/desktop-multiple.jpg)
- [Selezione eterogenea](evidence/desktop-mixed.jpg)
- [Menu selezione](evidence/selection-menu.jpg)
- [Rettangolo e dimensioni W/H](evidence/rectangle.jpg)
- [Larghezza minima](evidence/minimum-width.jpg)
- [Laptop](evidence/laptop.jpg)
- [Finestra stretta](evidence/narrow.jpg)
- [Sidebar chiuse e toggle condivisi](evidence/sidebars-closed.jpg)

## Tradeoff

I preset colore e le azioni richiedono l’apertura di un menu; gli shortcut rimangono disponibili. Le percentuali non fanno preview durante la digitazione: la conferma esplicita protegge la selezione multipla da aggiornamenti intermedi. Le proprietà specifiche di un sottoinsieme richiedono di selezionare quel sottoinsieme. Sotto 1050 px resta il comportamento esistente dell’inspector sovrapposto al canvas, chiudibile per recuperare spazio. La tipografia mantiene il font del circuito e le proprietà già supportate, senza introdurre un nuovo sistema di font.

## File modificati

Implementazione:

- `src/components/editor/Canvas.tsx`
- `src/components/palette/Palette.tsx`
- `src/components/properties/PropertiesContent.tsx`
- `src/components/properties/PropertiesInspector.tsx`
- `src/components/properties/PropertyControls.tsx`
- `src/components/properties/SelectionActions.tsx` (nuovo)
- `src/components/properties/SelectionStyle.tsx`
- `src/components/toolbar/SidebarIcon.tsx`
- `src/components/toolbar/SidebarToggle.tsx` (nuovo)
- `src/styles.css`

Test:

- `tests/audit-drawing.test.tsx`
- `tests/audit-ux-input.test.tsx`
- `tests/contextual-ux.test.tsx`
- `tests/editor-upgrades-interactions.test.tsx`
- `tests/helpers/selectionMenu.ts` (nuovo)
- `tests/interactions.test.tsx`
- `tests/new-feature-interactions.test.tsx`
- `tests/precision-brace-ui.test.tsx`
- `tests/properties-inspector-interactions.test.tsx`
- `tests/ui-restyling.test.tsx`
- `tests/ux-cleanup.test.tsx`
- `tests/ux-refinement-interactions.test.tsx`

Documentazione: `README.md`, `docs/manuale.md`, questo report e nove screenshot in `docs/inspector-design/evidence/`.
