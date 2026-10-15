# Architettura web

DrawCircuit usa React, TypeScript, Vite e Zustand. `index.html` carica `src/main.tsx`, che monta `App`. Il contenuto di `dist/` può essere servito da un normale host statico, anche sotto `/DrawCircuit/`. Non servono backend, account o runtime nativi.

| Moduli                                                       | Responsabilità                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/model/`                                                 | Tipi, catalogo dei simboli, geometria, serializzazione documenti e archivi JSON |
| `src/store/editorStore.ts`                                   | Documento corrente, selezione, gesture, undo/redo e salvataggio automatico      |
| `src/components/`                                            | Editor, libreria, proprietà, menu e dialog                                      |
| `src/circuit/`                                               | Layer SVG, simboli e annotazioni; KaTeX nel canvas web                          |
| `src/math/`                                                  | Normalizzazione, rendering KaTeX e glifi matematici                             |
| `src/smartPlacement/`, `src/presets/`, `src/personalBlocks/` | Agganci, blocchi predefiniti e libreria personale                               |
| `src/svg/`, `src/png/`, `src/tikz/`                          | Export SVG, PNG, TikZ, CircuitikZ e Obsidian                                    |
| `src/utils/`                                                 | Geometria condivisa, clipboard del browser, download e persistenza locale       |
| `public/`                                                    | Manifest statico, identità visiva e dismissione dei vecchi worker               |

Il documento resta alla versione 1: né struttura né chiavi di salvataggio sono migrate. `localPersistence` conserva una copia recuperabile dei dati illeggibili prima di sovrascriverli. Il salvataggio differito del documento continua a conservare lo stato confermato durante le gesture e viene completato all’uscita. La libreria personale usa una chiave separata; preferenze e viewport restano locali. La clipboard conserva il fallback di sessione quando i permessi del browser non sono disponibili.

Il formato `drawcircuit-archive` versione 1, usato dall’export web, risiede in `src/model/archive.ts`. Il parser mantiene la validazione dei vecchi archivi. Nessuna integrazione di file nativi è necessaria per esportarli.

KaTeX rimane in un chunk dedicato, condiviso da canvas e validazione export. Il layout vettoriale per gli export resta in `src/tikz/canvasText.ts`; il canvas conserva i propri `foreignObject`, metriche e resa. Cache matematiche limitate, indici spaziali e layer memoizzati dell’editor sono conservati: sono ottimizzazioni in memoria, indipendenti dalla cache offline dell’app eliminata.

Il font dei circuiti è Comic Relief 1.210, distribuito dal sito come WOFF2 nei pesi 400 e 700 con licenza SIL OFL 1.1. `src/main.tsx` attende entrambi i pesi prima di montare l’editor; `src/model/fonts.ts` e la variabile CSS `--circuit-font` definiscono la stessa famiglia per canvas, simboli, formule ed editor inline. `src/fonts/embedded.ts` incorpora font e licenza negli SVG esportati, usati anche per produrre PNG. In modalità Obsidian, `src/tikz/fonts.ts` emette le stesse definizioni una sola volta dentro `circuitikz`, tramite `dvisvgm:raw`; suddivide i dati in righe corte con fine riga commentato, preservando i byte WOFF2, e conserva la licenza durante l’ottimizzazione CSS. Inline TikZ/TikZJax producono così SVG autonomi. Lo standalone TeX richiede il font installato per riprodurne la famiglia; gli altri driver e gli ambienti senza DOM mantengono il fallback portabile. I font non vengono richiesti a servizi esterni.

La PWA usa solo un [manifest statico](../public/manifest.webmanifest). [La guida PWA](pwa.md) descrive il caricamento di rete e la dismissione transitoria dei vecchi worker. [La guida deployment](releases.md) descrive la CI. I rapporti di audit nelle altre cartelle `docs/` sono evidenze storiche delle rispettive revisioni; i loro riferimenti a vecchie build, offline o componenti rimossi non descrivono l’architettura attuale.
