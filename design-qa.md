# Sidebar Proprietà — Product Design QA

13 ottobre 2026. Direzione selezionata: seconda immagine Product Design, rifinita con il feedback dell’utente sulla coerenza dei comandi.

final result: passed

## Riferimento e confronto

- Fonte selezionata: `exec-8e45bd18-bc91-403e-8bc5-3079ebd276b4.png`, seconda immagine visualizzata nella chat.
- Verità visiva aggiornata prima dell’implementazione: [reference-refined.png](docs/sidebar-quality/reference-refined.png).
- Implementazione: anteprima locale su `http://127.0.0.1:5179/`, [schermata finale](docs/sidebar-quality/evidence/05-after-single.png).
- Stato: resistenza `R_2`, posizione `(20, -112,4)`, rotazione `0°`, testo 22 px, spessore 2 px, polarità attiva `V_R`, offset annotazione `(0, 0)`, offset etichetta `(12, 0)`, stile annotazione chiuso.
- Viewport: 1440×1000 CSS px, density 1. Screenshot: 1440×1000 px, inspector 380 CSS px.
- Fonte: 984×1599 px. Rimossi soltanto i margini esterni del raster con crop `(72, 0, 912, 1599)`, quindi normalizzazione uniforme alla larghezza di 380 px: 380×723 px. Nessuna deformazione verticale; lo spazio residuo è bianco.
- Implementazione normalizzata: crop dell’inspector `(1060, 0, 1440, 1000)`, 380×1000 px.
- [Confronto completo](docs/sidebar-quality/evidence/comparison-final.png): riferimento a sinistra, implementazione a destra, nello stesso input visivo.
- [Confronto dei controlli](docs/sidebar-quality/evidence/comparison-controls.png): rotazione, colori, opacità, spessore e dimensione del testo.

## Cronologia delle correzioni

1. **Prima comparazione: blocked.** [Confronto iniziale](docs/sidebar-quality/evidence/comparison-initial.png), basato sulla [prima implementazione](docs/sidebar-quality/evidence/04-after-single-initial.png).
   - **P2 — griglia incoerente:** opacità su una colonna troppo stretta rispetto a spessore/dimensione. Correzione: due colonne uguali, con lo stesso asse visivo per colori/opacità e proprietà accoppiate.
   - **P2 — ritmo verticale dispersivo:** sezioni troppo alte rispetto al riferimento e offset visivamente troppo pesanti. Correzione: margini ridotti, prima riga senza margine ridondante, didascalie degli offset con peso regolare.
   - Correzioni funzionali collegate: un solo campo di rotazione per l’oggetto; incremento esplicitamente riferito al gruppo; Enter/Space dei controlli protetti dai comandi del canvas; undo contestuale conserva gli oggetti ancora presenti.
2. **Seconda comparazione: passed.** La [cattura finale](docs/sidebar-quality/evidence/05-after-single.png), il [confronto completo](docs/sidebar-quality/evidence/comparison-final.png) e il [confronto di dettaglio](docs/sidebar-quality/evidence/comparison-controls.png) mostrano le correzioni applicate. Nessun P0/P1/P2 residuo.

## Cinque superfici di verifica

| Superficie        | Esito                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Font e tipografia | Inter locale, testo 13 px, didascalie 12 px, titoli 14/16 px, cifre tabulari. Nomi dei campi leggibili; gerarchia tra sezioni e offset distinta.                                                                                                                                   |
| Spazi e layout    | Griglia regolare, padding orizzontale 16 px, input 32 px, radius 6 px, separatori sottili. Coordinate affiancate anche a 252 px; gruppi secondari si adattano senza overflow.                                                                                                      |
| Colori e stati    | Superficie bianca, campi neutri, accento blu e focus visibile. Input, azioni testuali, toggle e disclosure hanno affordance distinte. Opacità leggibile a 0, 10, 99 e 100.                                                                                                         |
| Asset e icone     | Anteprima vettoriale originale del componente e icone Lucide già presenti nel prodotto. Nessuna immagine generata viene usata al posto dei controlli. Glyph e simboli del circuito mantengono gli asset originali.                                                                 |
| Copy e contenuto  | Rotazione assoluta distinta dall’incremento di gruppo; Etichetta tensione/corrente dichiara che si modifica una label; offset relativi espliciti. Distribuzione e spaziatura usano la stessa terminologia. Spaziatura esatta inizia vuota e non simula una misura della selezione. |

## Verifica reale

1. **Oggetto e annotazione — passed.** Rotazione 45° e undo dal selettore; inversione tramite Enter senza avviare editing del canvas; apertura/chiusura dello stile; opacità dell’annotazione modificata senza cambiare quella del componente; undo/redo mantiene il contesto.
2. **Selezione multipla — passed.** [19 elementi](docs/sidebar-quality/evidence/08-after-multiple.png), ambito esplicito di 9 elementi indipendenti, rotazione del gruppo e undo, spaziatura X da 140 u e undo. Entrambi gli assi sono presenti; nessun valore iniziale arbitrario. Fili e annotazioni seguono i riferimenti.
3. **Reflow e filo — passed.** [Larghezza minima 252 px](docs/sidebar-quality/evidence/06-after-minimum.png), [larghezza standard 292 px](docs/sidebar-quality/evidence/10-after-default.png), controllo anche a 380 e 440 px, [finestra 900×800](docs/sidebar-quality/evidence/07-after-narrow-window.png): `scrollWidth === clientWidth`, nessun overflow orizzontale. [Corrente sul filo](docs/sidebar-quality/evidence/09-after-current.png): label `I_R`, verso invertito e posizione al 60%, mantenendo il filo selezionato.

La suite completa comprende 60 file e 1.817 test superati. I test mirati verificano anche routing durante la rotazione assoluta, assenza di undo per un angolo invariato, rotazione collettiva con geometria relativa conservata, disclosure stabile durante le modifiche, isolamento dei tasti e undo/redo dal selettore. Le ultime rifiniture di copy e campi di spaziatura sono verificate anche dalla suite mirata dell’inspector. Lint, build e formattazione superati; console del browser senza errori o warning.

## Differenze intenzionali e limiti

- Il raster normalizzato suggerisce controlli leggermente più piccoli: l’implementazione mantiene 32 px e testo 13 px per comodità e leggibilità. L’inspector è quindi più alto, con scrolling verticale e intestazione stabile quando necessario.
- Le etichette Etichetta tensione/corrente sono più esplicite del mock. La sintesi dello stile mostra le due swatch; i codici HEX completi restano nel gruppo aperto, per mantenere leggibile anche la larghezza minima.
- P3: chevron nativi dei select e dimensione dell’anteprima del simbolo differiscono leggermente dal raster; conservano i componenti originali del prodotto.
- Verifica manuale nel browser integrato, senza attestazione completa WCAG o matrice separata Safari/Firefox. La build conserva l’avviso non bloccante sul chunk principale oltre 500 kB.

Checklist conclusiva: controlli coerenti; fonte e implementazione confrontate insieme; dettagli leggibili; stati aperti/chiusi e focus verificati; responsive verificato; funzioni e regressioni testate.
