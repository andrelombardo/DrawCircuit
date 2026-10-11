# Export / LaTeX / SVG / Obsidian — release candidate

Data: 3 ottobre 2026. Le prove combinano uso reale dell’export nell’app, rendering nell’installazione desktop di Obsidian, compilazione del bundle installato, compilazione LaTeX nativa e confronto quantitativo. **Obsidian canvas e SVG: PASS nei casi verificati. PDF standalone: compilazione PASS, confronto visivo NOT TESTED. Catalogo CircuitikZ nativo in Inline TikZ: FAIL per font mancante `cmmib5`.** Questi risultati riguardano motori e formati distinti.

## Formati e prove effettive

| Formato                            | Verifica                                                                                           | Risultato                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Copy TikZ, profilo nativo          | Codice esportato dalla UI; render golden nel plugin e compilazione standalone                      | PASS compilazione; geometria e font CircuitikZ differenti dal canvas |
| Download `.tex`                    | Compilazione integrata Codex: tre documenti interi, otto selezioni e golden UX finale              | 12 PASS; visuale PDF NOT TESTED                                      |
| Copy for Obsidian, scala canvas    | Due golden osservati nell’app desktop; catalogo e selezioni compilati dal bundle esatto installato | PASS                                                                 |
| Copy/download SVG                  | Apertura in Chromium e resvg, documenti interi e selezioni                                         | PASS nei viewer verificati                                           |
| CircuitikZ nativo: catalogo 72 × 4 | Bundle Inline TikZ 0.2.1 installato                                                                | FAIL: `Could not find font cmmib5`                                   |
| Stesso catalogo `.tex`             | Compiler integrato Codex                                                                           | PASS; il successo non risolve il FAIL del plugin                     |

Il compiler nativo restituisce diagnostiche senza esportare un PDF ispezionabile: [11 compilazioni iniziali](evidence/exp-native-compile-diagnostics.json) e [golden UX finale](evidence/ux-final-native-compile.json). Non è stato presentato un SVG come prova visuale PDF. Il [log del catalogo nativo](evidence/exp-catalog-compilation.log) e il [risultato FAIL](evidence/exp-catalog-native.svg.result.json) sono conservati. Il catalogo canvas è [PASS dal bundle installato](evidence/exp-catalog-obsidian.svg.result.json): 288 componenti, 72 tipi e quattro rotazioni. Non è stato rieseguito né ricontato durante la chiusura del rapporto.

## Golden complesso e confronto diretto Obsidian

Il golden di fedeltà ha 37 oggetti: 12 componenti, **otto resistori**, condensatore, induttore, sorgente di tensione e corrente, 14 fili, quattro nodi A/B/C/D, attraversamento non collegato, junction, Current Arrow, Voltage, freccia, Loop Arrow, `maglia 1`, `i_1`, `r_{AB}`, `50 \ohm`, label blu e rosse.

**Test diretto PASS:** Obsidian desktop **1.13.7**, plugin **Inline TikZ 0.2.1**, nota chiaramente temporanea `DrawCircuit RC QA TEMP 2026-10-03`. Il codice è stato incollato nella nota, renderizzato e osservato. [Screenshot editor](evidence/exp-golden-editor-recheck.png), [screenshot diretto Obsidian](evidence/exp-golden-final-obsidian-direct.png), [export SVG](evidence/exp-golden-final.svg), [render del bundle](evidence/exp-golden-final-obsidian.svg), [TikZ](evidence/exp-golden-final.tikz), [standalone](evidence/exp-golden-final.tex). Gli screenshot sono ritagliati per escludere contenuti personali. La dimensione visibile della nota dipende dalla larghezza disponibile: il confronto strutturale usa scala uniforme e coordinate comuni, senza confondere “fit alla nota” con il livello zoom dell’editor.

### Misure

[Metriche complete](evidence/exp-visual-metrics.json). I box del DOM originale e degli SVG sono riportati nelle coordinate editor con viewBox, scala uniforme e primo endpoint del filo noto; un’unità canvas corrisponde a 0,75 pt TeX. Le righe segnate model/export confrontano i valori vettoriali, non una misura indipendente del raster.

| Metrica, unità editor         |  Editor | Obsidian normalizzato | Differenza |
| ----------------------------- | ------: | --------------------: | ---------: |
| Larghezza corpo resistore     |      40 |              39,99991 |  −0,00022% |
| Altezza corpo resistore       |      18 |              17,99725 |  −0,01530% |
| Diametro sorgente             |      40 |              39,99980 |  −0,00049% |
| Spessore filo / frecce        |       2 |                     2 |         0% |
| Raggio junction               |     4,5 |                   4,5 |         0% |
| Lunghezza terminale resistore |      20 |                    20 |         0% |
| Distanza / altezza piastre C  | 12 / 34 |               12 / 34 |         0% |
| Distanza fra centri resistori |     240 |                   240 |         0% |

Tutti i **41 glyph** trovano corrispondenza: errore massimo posizione/box **0,00301 unità**, errore massimo larghezza/altezza **0,000108 unità**, famiglie font corrispondenti. Sono confrontati pedici, baseline, offset, normali label Comic Sans, colori e contenuti matematici. Gli SVG non hanno `foreignObject`. L’export SVG ha viewBox `−512 −312 1008,6406 684`; il plugin ricava il proprio bounding box dai path e aggiunge padding. Il suo rettangolo esterno non deve essere interpretato come un cambio di scala degli oggetti.

[Confronto pixel](evidence/exp-pixel-comparison.json): resvg applicato ai vettori originali e al vero output Inline TikZ, alla stessa scala, con gli stessi font e fondo bianco, immagine 1009 × 684. I pixel con differenza superiore a 16/255 sono **0,099253%**; differenza media canale 0,030483/255. Questo risultato non significa identità pixel: curve approssimate e antialiasing differiscono. Nessuna correzione cosmetica è stata introdotta per queste differenze minime.

Il [confronto apribile](export-comparison.html) include screenshot reali, vettori, overlay e limiti PDF. I 20 font WOFF2 KaTeX necessari sono incorporati nel file; non richiede una cartella `fonts/` assente né CDN. **Comic Sans MS/Comic Sans deve essere disponibile sul sistema:** nessun font proprietario di sistema è distribuito e il fallback cursive può variare su altri OS. Il notice dei font KaTeX preesistente è incluso come commento HTML, senza introdurre una licenza del progetto. L’anteprima CircuitikZ nativa usa le famiglie TeX del plugin: senza tali font il browser può sostituirle, quindi non certifica la tipografia PDF. [Dipendenze del confronto](evidence/export-comparison-dependencies.json).

La pagina è stata aperta nel browser via HTTP locale dopo l’ultima modifica: immagini caricate, 20 regole font incorporate, nessun errore/warning console. L’overlay è stato corretto applicando a entrambi gli SVG la stessa larghezza responsive: box verificati entrambi 575 × 389,9297 px e stesso viewBox. Il confronto non sovrappone più un SVG a dimensione intrinseca a uno ridotto dal CSS. [Verifica browser](evidence/export-comparison-browser.json), [screenshot della pagina finale](evidence/export-comparison-browser.png). Le 15 `foreignObject` nella pagina appartengono al riferimento DOM dell’editor; l’SVG esportato ne contiene zero.

## Golden UX finale dopo RC-09 — passo 34

Questo documento è **diverso dal golden di fedeltà precedente**: [JSON definitivo](evidence/ux-final-golden.json), titolo `RC Final Golden 20261003`, **44 oggetti**: 15 componenti, 17 fili, otto junction, due annotazioni elettriche, una Loop Arrow e una annotation text. Tutti gli export provengono dallo stesso documento dopo la correzione della connessione attraverso junction.

**Passo 34: PASS diretto Obsidian.** La nota temporanea `DrawCircuit RC UX FINAL TEMP 2026-10-03` è stata aperta tramite UI; il suo testo è stato sostituito tramite paste con l’esatto export conservato e la vista Lettura è stata attivata dal menu nativo View. Il testo renderizzato mostra V₁, R₁–R₇, i due blocchi RLC, A/B/C/D, i₁, VAB e `maglia 1`, quindi non è il buffer del golden precedente. [Registrazione con hash dell’input](evidence/ux-final-obsidian-direct.json), [screenshot diretto](evidence/ux-final-full-obsidian-direct.png), [screenshot editor](evidence/ux-final-golden-editor.jpg), [registro dei passi](evidence/ux-final-golden-steps.json).

Sono stati confrontati posizione relativa e geometria, crossing con ponte, junction A realmente collegata, entrambe le copie RLC, font e offset delle label, colori blu/rosso, frecce e loop. Il risultato coincide alla scala uniforme di visualizzazione; le label sovrapposte già presenti nell’editor rimangono nello stesso punto nell’export. La barra laterale è stata nascosta e lo screenshot ritagliato al circuito. Nessuna nota personale è stata modificata.

| Output finale UX        | Evidenza                                                                                                                                                                                                     | Stato                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Obsidian intero         | [Markdown](evidence/ux-final-full-obsidian.md), [render bundle esatto](evidence/ux-final-full-obsidian.svg), [risultato pipeline](evidence/ux-final-full-obsidian.svg.result.json), screenshot diretto sopra | PASS pipeline e desktop                                          |
| Obsidian selezione      | [Markdown](evidence/ux-final-selection-obsidian.md), [render bundle esatto](evidence/ux-final-selection-obsidian.svg), [risultato](evidence/ux-final-selection-obsidian.svg.result.json)                     | PASS pipeline installata; desktop selezione NOT TESTED           |
| TikZ intero / selezione | [Intero](evidence/ux-final-full.tikz), [selezione](evidence/ux-final-selection.tikz)                                                                                                                         | PASS produzione UI                                               |
| Standalone intero       | [`.tex`](evidence/ux-final-full.tex), diagnostica sopra                                                                                                                                                      | PASS compilazione; PDF visual NOT TESTED                         |
| SVG intero / selezione  | [Intero](evidence/ux-final-full.svg), [selezione](evidence/ux-final-selection.svg)                                                                                                                           | PASS export; i due selected + filo interno producono tre oggetti |

Il bundle esatto installato è identificato con hash `bf777b889838870f902fed6989d7afbc5daeab799698582e299ff1cdea036e1a`. La compilazione in processo isolato usa quel codice, ma non viene chiamata “test diretto desktop”: solo lo screenshot e la lettura UI del circuito intero sostengono quella dichiarazione.

## LaTeX, font e correzione colore

Le 19 stringhe richieste sono state editate e osservate nel browser: `R_1`, `r_{AB}`, `V_{th}`, `V_{out}`, `I_1`, `i_{12}`, `Z_{eq}`, `50 \ohm`, `10 k\ohm`, `2.2 M\ohm`, `10 \mu F`, `220 \mu H`, `\alpha`, `\beta`, `\omega`, `\Omega`, `\Delta V`, frazione e radice. [Matrice browser](evidence/exp-latex-browser-matrix.json), [SVG aperto](evidence/exp-latex-matrix.svg), [raster del viewer](evidence/exp-latex-matrix-resvg.png), [compilazione plugin](evidence/exp-latex-matrix-obsidian.svg.result.json), [standalone](evidence/exp-latex-matrix.tex). Nessuna delle 19 stringhe valide ha prodotto invalid LaTeX. Gestione input malformati, source preservation e Undo/Redo sono coperti dal rapporto editor e dai test, senza estendere questo PASS a ogni comando TeX possibile.

Il font del circuito è `"Comic Sans MS", "Comic Sans", cursive`; la UI conserva `-apple-system, system-ui, Inter, Segoe UI, sans-serif`. Il testo ordinario e i pedici semplici rispettano la famiglia canvas; simboli/strutture matematiche usano il renderer matematico quando necessario. Il [report delle misure](evidence/exp-visual-metrics.json) conserva questa distinzione.

**RC-04 corretto:** `\color{red}{R_2}` era rosso nell’editor e prendeva il blu della label nell’export. Glyph, path e regole ora conservano il colore esplicito; il resto eredita quello della label. [Prima](evidence/exp-inline-color-before.svg), [dopo](evidence/exp-inline-color-after.svg), [screenshot editor](evidence/exp-inline-color-editor.jpg), [render Obsidian](evidence/exp-inline-color-after-obsidian.svg), [risultato](evidence/exp-inline-color-after-obsidian.svg.result.json). La verifica di regressione export è [PASS](evidence/exp-final-regression-tests.log). Non è stata aggiunta una nuova funzionalità.

## Selezioni e SVG in viewer differenti

Otto casi esportati dalla UI: componente singolo, componenti + fili, junction, annotation text, loop, ramo parziale, Current Arrow e crossing. [Matrice semantica](evidence/exp-selection-matrix.json); gli artefatti `exp-ui-select-*` conservano TikZ, standalone, SVG, Markdown Obsidian, render plugin e risultati. Tutti gli otto standalone compilano e tutti gli otto export Obsidian compilano nel bundle installato. La selezione include i fili interni o nodi richiesti dal proprio scope; non viene dichiarata errata perché comprende dipendenze necessarie del filo selezionato.

Gli SVG full, otto selection, matrice LaTeX e catalogo sono stati aperti anche con **resvg-js 2.6.2**, oltre al browser Chromium: [risultati viewer](evidence/exp-svg-viewer-results.json). Le immagini conservate mostrano viewBox, label e path senza clipping evidente nei casi osservati. I formati canvas sono vettori SVG senza `foreignObject`; il testo rimane dipendente dai font del viewer. Queste prove non certificano Safari, Firefox, Inkscape, Illustrator, ogni OS o ogni font fallback.

## Limiti e possibili miglioramenti futuri

- PDF standalone: diagnostiche di compilazione riuscite; visuale PDF, clipping del PDF e confronto della sua tipografia ancora NOT TESTED.
- Inline TikZ nativo: catalogo completo FAIL per `cmmib5`; il profilo canvas e il compiler standalone PASS non cancellano tale limite.
- CircuitikZ nativo: dimensioni dei simboli e font TeX appartengono al formato nativo, con scala CSS osservata circa 0,948425 px/unità contro 1 nel profilo canvas. La fedeltà al disegno è stata misurata nel profilo Obsidian/SVG canvas.
- Comic Sans deve essere installato per riprodurre esattamente il testo ordinario; l’export non incorpora un font di sistema proprietario.
- La selezione finale UX ha render della pipeline installata; lo screenshot diretto desktop riguarda il circuito intero.
- Possibile lavoro futuro: confronto PDF reale in un viewer dedicato e verifica su altri OS/viewer. Non sono stati implementati durante l’audit.

Il controllo pubblico e il commit/deployment della release sono assegnati al coordinatore e al rapporto finale: nessun PASS pubblico è anticipato qui.
