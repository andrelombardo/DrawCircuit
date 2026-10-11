# Corrente sul filo: geometria indipendente dallo zoom

## Causa

`931d9a6` ha introdotto `electricalDrawingGeometry(..., zoom)` con dimensioni visibili divise per `z`. `2587c4e` ha esteso questo criterio alla geometria condivisa da Integrata ed Esterna, ai tratti sostituiti del filo e all'editor della label. I test precedenti richiedevano esplicitamente dimensioni costanti in pixel.

Il canvas moltiplicava poi tutto per `zoom`: per la corrente le due trasformazioni si annullavano. Al 15% il circuito si rimpiccioliva, ma la corrente restava grande; al 400% il circuito cresceva, ma la corrente restava piccola. La soglia screen-space poteva inoltre spostare una corrente integrata all'esterno cambiando soltanto zoom.

## Correzione

- Eliminati parametro zoom, normalizzazione `z` e tutte le compensazioni dalla geometria visibile, dai gap del filo e dalle coordinate dell'editor della label.
- Rinominati i valori `_PX` per indicare che sono unità documento.
- Integrata: lunghezza standard 36, punta 10 × 9, margine dagli estremi 4. Un ramo corto riduce la geometria; sotto 18 unità disponibili resta il fallback esterno preesistente. Questa scelta dipende solo dal ramo, mai dalla camera.
- Esterna: lunghezza 60, distanza dal filo 16, punta 8 × 7. Offset manuali e distanza della label restano in coordinate documento.
- Spessore e font provengono direttamente da `width` e `label.fontSize`. La label usa lo stesso `MathText` delle etichette dei componenti.
- Entrambe le modalità condividono costruzione della punta, verso, colori, stile e rendering della label. L'unico scaling visibile è quello del gruppo canvas.
- Integrata sostituisce un intervallo del percorso disegnato: rimangono un Wire e un'annotazione. Nessun rettangolo, halo o maschera bianca.
- Il corridoio trasparente di clic conserva la tolleranza screen-space esistente, limitata a basse scale per non coprire oggetti vicini. Le maniglie di selezione restano UI. Nessuna modifica alla camera, ai controlli zoom o ad altre funzionalità.

## Prove

Riprodotto prima del fix il circuito a tre resistori, fili orizzontali/verticali, junction e correnti `i`, `i_1`, `i_2`, `i_3`, `i_4`. Le catture `before-15.jpg` e `before-400.jpg` mostrano il difetto; `after-*` mostrano la correzione. Il disegno di verifica è salvato in `evidence/fixture.json`; `qa.html` è un harness locale per Vite, escluso dal bundle pubblicato.

Nel browser, la lunghezza visibile misurata del segmento della freccia è:

| Zoom | Integrata (px) | Esterna (px) |
| ---- | -------------: | -----------: |
| 15%  |            5,4 |            9 |
| 50%  |             18 |           30 |
| 100% |             36 |           60 |
| 200% |             72 |          120 |
| 400% |            144 |          240 |

I dati completi sono in `evidence/browser-geometry.json`. Le catture `golden-15/100/400.jpg` confrontano entrambe le modalità sul disegno A–B. Al 400% il viewport mostra un dettaglio del circuito, come ci si aspetta da un ingrandimento reale.

Verificati nel browser: modifica del verso, del colore e dell'etichetta, Undo/Redo, navigazione alla pagina principale con recupero delle modifiche salvate, aggiunta e trascinamento di un waypoint e inserimento di una nuova corrente dal menu Integrata. Console locale senza errori o avvisi.

Test automatici:

- Zoom reale via eventi wheel a 0,15 / 0,5 / 1 / 2 / 4: solo la camera cambia; markup visibile, identità del documento, serializzazione e cronologia restano invariati.
- Label e input di modifica condividono font e ancoraggio a ogni zoom.
- Entrambi i versi, fili orizzontali/verticali e terminali diagonali a 45° / 135° / 225° / 315° in entrambe le modalità.
- Raster normalizzati alla stessa scala identici pixel per pixel per il circuito a cinque correnti e per il disegno A–B. Le label matematiche sono verificate separatamente nel DOM e nel browser, perché Resvg non rasterizza i foreignObject HTML del canvas.
- Nessun background bianco; tratto continuo a parità di colore; un solo Wire; gestione segmenti corti, selezione, distacco per export, waypoint, modifica del filo, Undo/Redo e round-trip JSON.

Gli export reali dal browser a 15% e 400% sono identici byte per byte per **SVG, PNG, TikZ e Obsidian**. Hash e confronto in `evidence/export-comparison.json`; PNG confrontato anche come data URL completo prodotto da `exportPNG`.

Verifiche prepubblicazione con Node 26.5.0: `npm ci`, `npm run lint`, `npm run test` (**55 file, 1672 test passati**), `npm run build`. Log salvati in `evidence/`.

## Pubblicazione

La verifica del commit distribuito, dei job build/Pages e del browser sul sito pubblico viene riportata nella risposta finale e nell'evidenza di pubblicazione successiva al push.
