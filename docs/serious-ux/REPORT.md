# DrawCircuit — verifica del pass UX

Verifica locale del 5 ottobre 2026. La pubblicazione e la successiva verifica sul sito pubblico vengono riportate nel messaggio finale, con commit e run GitHub Actions effettivi.

## Corrente sul filo

Il problema nasceva dalla mescolanza di geometria del documento e geometria annotativa: lunghezza e punta erano parzialmente compensate per lo zoom, mentre stroke, corrente esterna, label e alcuni target di selezione continuavano a usare dimensioni del documento. Una linea bianca più larga del filo mascherava il ramo, cancellando anche la griglia sottostante.

`electricalDrawingGeometry` ora calcola la rappresentazione a partire dalla geometria semantica del ramo e dallo zoom. Per la corrente integrata standard usa lunghezza 36 px, punta 10 × 9 px e spessore impostato dall'utente in pixel schermo. La corrente esterna usa lunghezza 60 px, punta 8 × 7 px e separazione dal ramo 16 px. Dimensioni del tratto, punta, stroke, font e distanza standard della label vengono divise per lo zoom; posizione del ramo e offset personalizzati restano nel documento. Selezione e modifica inline della label usano la stessa geometria visiva.

Non esiste più una maschera bianca per la corrente. Il solo percorso disegnato del filo viene suddiviso prima e dopo l'intervallo sostituito dalla freccia. Il corridoio di hit testing resta continuo; il modello contiene sempre un solo Wire e non riceve nuove Junction. Con colori uguali la transizione è continua; con freccia rossa e filo nero il segmento rosso appare intenzionalmente inserito nel ramo. La griglia rimane visibile.

Il binding conserva ramo e posizione relativa lungo il ramo. Allungamento, accorciamento, spostamento degli endpoint e inversione del verso non riscrivono quel binding. L'inversione cambia soltanto il verso. Sono coperti orizzontali, verticali e tutte le quattro diagonali.

Su rami corti vengono conservati 4 px di margine per endpoint e ridotta proporzionalmente la freccia fino a 18 px. Sotto 26 px disponibili a schermo viene usata la resa esterna, mantenendo la modalità Integrata e l'associazione al Wire. Questo fallback evita overflow o deformazioni; è previsto anche per rami degeneri.

SVG e TikZ usano la geometria canonica a zoom 1. PNG deriva dall'SVG; Obsidian deriva dalla stessa normalizzazione TikZ. Copia/esportazione della sola annotazione e rimozione del Wire congelano la geometria canonica, compreso il fallback e la posizione della label.

### Golden reale nel browser

Fixture: un Wire nero di 440 unità, Junction A/B, corrente integrata rossa e griglia visibile. Misure ricavate dagli elementi SVG effettivamente renderizzati:

| Zoom | Tratto freccia | Punta     | Stroke corrente |
| ---- | -------------- | --------- | --------------- |
| 50%  | 36 px          | 10 × 9 px | 2 px            |
| 100% | 36 px          | 10 × 9 px | 2 px            |
| 200% | 36 px          | 10 × 9 px | 2 px            |

Il Wire cresce normalmente con lo zoom. Screenshot: [50%](evidence/current-50.jpg), [100%](evidence/current-100.jpg), [200%](evidence/current-200.jpg). [Misure originali](evidence/current-zoom-measurements.json).

Lo stesso documento esportato dai tre zoom produce file identici byte per byte in **tutti e quattro i formati**. [Hash SHA-256](evidence/current-export-hashes.json); esempi canonici: [SVG](evidence/current-export-100.svg), [PNG](evidence/current-export-100.png), [TikZ](evidence/current-export-100.tikz), [Obsidian](evidence/current-export-100.md).

## Prime e tipografia

`A'` entrava già nel percorso matematico: rilevamento math → normalizzazione LaTeX → KaTeX → `MathText`. Il fix precedente interveniva sulla normalizzazione, ma non sulla causa visiva. La regola CSS globale applicava Comic Sans a ogni glifo KaTeX, prime compreso. Il prime Comic Sans ha una sagoma molto più piccola di quella per cui KaTeX calcola posizione e metriche.

A font label 22 px, il font dello script resta 15,4 px: la sagoma del prime Comic Sans misura circa **3,68 px** in altezza, quella KaTeX circa **7,99 px**. Ora soltanto i glifi matematici prime ricevono `math-prime` e `KaTeX_Main`. Comic Sans, font size globale, baseline generale e dimensioni di tutti gli altri apici restano invariati.

Il percorso accetta anche `A'`, `A''`, `A'''`, backtick, apostrofi curvi e Unicode prime, oltre agli script espliciti. Le sequenze matematiche vengono normalizzate a `\prime`, preservando testo naturale, comandi testuali e stringa originale salvata nel documento. Le combinazioni con altri script conservano la fusione prevista da TeX.

L'export vettoriale usa le sagome Regular/Bold del prime del font KaTeX già incluso nel progetto: soltanto il prime diventa un path, così SVG e PNG standalone non dipendono dalla disponibilità del font sul computer del destinatario. TikZ e Obsidian ricevono prime matematici normalizzati.

Verifica visiva reale a 100%: `A`, `A'`, `A''`, `A'''`, `A^{'}`, `A^{''}`, `A^{\prime}`, `A^2`, `A^{10}`, `A^n`, `A_1`, `r_{AC}`. Il prime risulta leggibile. [Confronto vecchio/nuovo, editor e SVG/PNG](evidence/prime-comparison-100.jpg), [fixture completa dell'app](evidence/workflow-100.jpg), [metriche del browser](evidence/prime-browser-metrics.json). Test verificano esplicitamente che apici numerici/letterali e pedici non cambino.

## Toolbar e menu

La barra principale contiene ora soltanto:

`[drag] [Select] [Testo] [Pencil] | [Undo] [Redo] | [Pan] [Export]`

Pencil ha tooltip **Disegno e annotazioni** e un accento discreto quando è attivo uno dei suoi strumenti. La lista verticale è ordinata così, con separatori leggeri e senza titoli aggiuntivi:

1. Filo, Nodo.
2. Freccia, Maglia, Graffa / Staffa → Graffa / Staffa.
3. Polarità + / -, Tensione tra due punti, Corrente sul filo → Integrata / Esterna.

Le icone includono freccia orizzontale, percorso di maglia rettangolare arrotondato con apertura e punta tangente, graffe dedicate, +/−, misura fra due punti e due rese distinte della corrente sul ramo o separata dal ramo.

Il componente `ActionMenu` è condiviso fra toolbar globale e azioni contestuali. Gestisce click, hover intent con ritardi di apertura/chiusura, passaggio fra parent e submenu, navigazione con frecce/Home/End/typeahead/Enter/Space, Escape per livello, Tab e click esterno. Dopo la scelta si chiude; Escape durante il disegno torna a Select. Le shortcut del canvas non intercettano i tasti mentre è aperto un menu.

Collisioni verificate nel browser con toolbar trascinata nell'angolo in basso a destra: il menu principale si apre sopra e il submenu a sinistra, entrambi interamente nel viewport 1280 × 720. [Screenshot](evidence/menu-collision.jpg). Hover intent e passaggio parent/submenu sono inoltre coperti dai test a timer controllato.

## Azioni contestuali e copia

**Wire → Corrente sul filo → Integrata/Esterna** crea immediatamente l'annotazione associata al Wire selezionato, sul punto medio del suo ramo più lungo. Non serve un secondo click sul circuito. Ogni creazione è un'unica operazione Undo. Entrambe le modalità sono state provate nel browser.

**Componente → Polarità + / -** crea immediatamente la polarità associata al componente. La capability controlla sia i terminali effettivi sia la coppia semantica `a`/`b` dichiarata nel registro. Funziona per bipoli compatibili, non soltanto resistenze; non viene mostrata per oggetti non componenti, porte logiche, connettori a due pin o componenti con topologia incompatibile. Resistenza, condensatore e sorgente sono stati provati manualmente; NOT gate verificato come incompatibile. I test aggiungono induttore/diodo e altri casi incompatibili.

L'azione secondaria contestuale è **Copia come immagine**, con lo stesso PNG interno. Export globale mantiene **Copia PNG** e **Scarica PNG**. Le azioni rare restano nel menu secondario.

## Focus del canvas

La causa era il focus tecnico assegnato all'SVG durante `pointerDown` con `preventDefault()`: Chromium poteva mantenere `:focus-visible` e applicare il proprio outline blu `auto 5px` anche dopo un click del mouse.

Il canvas conserva il focus per shortcut, selezione e accessibilità, usando `preventScroll`. Un hook distingue input pointer e navigazione tramite Tab. Le regole CSS sono limitate alla superficie del disegno: i click non mostrano outline; la navigazione reale da tastiera mostra un bordo grigio interno da 1 px. Il feedback locale sugli oggetti selezionati resta presente.

Verificati nel browser click su canvas vuoto, resistenza, Wire, Junction, Text e Current Arrow: focus tecnico attivo, outline assente in ogni caso. Verificato Tab da Export al canvas: outline `rgba(0, 0, 0, 0.14) solid 1px`. Sidebar e toolbar non generano illuminazione dell'intero foglio. [Risultati DOM](evidence/focus-checks.json).

## Qualità e copertura

| Controllo                                            | Risultato locale                       |
| ---------------------------------------------------- | -------------------------------------- |
| Node                                                 | 26.5.0 da `.nvmrc`                     |
| `npm ci`                                             | Riuscito, zero vulnerabilità segnalate |
| `npm run lint`                                       | PASS                                   |
| `npm run test -- --maxWorkers=2 --testTimeout=30000` | **54 file, 1.667 test PASS**           |
| `npm run build`                                      | PASS, bundle e precache PWA generati   |
| `git diff --check`                                   | PASS                                   |

La suite completa copre placement, terminal hover, Smart Placement, Wire, trascinamento diretto dei terminali, Junction, crossing, Text/etichette, nudge, Smart Measurements, rotazioni a 45°, annotazioni grafiche/elettriche, Undo/Redo, Copy/Paste, Blocchi Personali, localStorage e pipeline di export. I test nuovi aggiungono raster golden, zoom, segmenti corti/degeneri, inversione, geometria di selezione e label, normalizzazione/sagome prime, menu annidati, azioni contestuali e focus.

La verifica manuale ha riguardato le sei aree richieste, oltre a menu collidenti, tastiera, Undo contestuale, griglia e confronto export. Nell'anteprima di produzione è stato verificato anche l'aggiornamento PWA: banner di nuova versione → Aggiorna → nuovo bundle, con il draft conservato. Console dell'anteprima senza errori o warning.

I file HTML/JS di questa cartella sono harness di verifica locale, esclusi dal bundle pubblicato. Non sono stati aggiunti build generati, credenziali o licenze. I file SVG/PNG/TikZ/Markdown nella cartella evidence sono soltanto circuiti sintetici di test.

### Limiti della verifica

Il controllo manuale usa Chromium nel browser integrato di Codex; Safari, Firefox, installazione PWA su dispositivo e rendering dentro un'installazione reale di Obsidian non sono stati ripetuti in questo pass. La correttezza della pipeline Obsidian è verificata tramite sorgente, confronto e test.

Il backend browser non ha restituito il download PNG né il payload binario della clipboard: il PNG documentato è stato generato nel browser dalla funzione reale `exportPNG` dell'app e confrontato ai tre zoom. L'interfaccia ha inoltre confermato **PNG copiato**. Il limite riguarda la raccolta automatica del file dalla UI, non la generazione del PNG verificato.

Le regressioni elencate sopra sono coperte dalla suite completa; non tutte sono state rieseguite manualmente. Il comportamento esterno sui rami troppo corti è una scelta intenzionale del fallback, non una perdita del binding o della modalità Integrata.
