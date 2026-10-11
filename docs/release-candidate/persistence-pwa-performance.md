# Persistence, PWA, performance e pubblicazione — audit RC 3 ottobre 2026

Responsabile: agente principale. I risultati qui descritti sono nuove verifiche di questo audit; i report precedenti non sono stati contati come prove eseguite.

## Baseline

- HEAD iniziale: `69ae8ab7b5e7bc136d9551415a31532ab66147d6`, `main`, working tree pulito.
- Deployment pubblico corrispondente: [Actions 37073478258](https://github.com/andrelombardo/drawcircuit/actions/runs/37073478258), build e deploy riusciti.
- Node `26.5.0`; `npm ci`, lint, build PASS.
- Suite iniziale: timeout di 5 s in due workflow DOM quando Vitest avvia automaticamente tutti i worker. Con due worker, gli stessi 847 test e gli stessi timeout passano. Configurazione predefinita ora allineata alla CI (`maxWorkers: 2`); nessuna asserzione indebolita.
- Browser pubblico: nessun warning/error catturato al caricamento; screenshot `evidence/baseline-public.png`.
- Audit HTTP pubblico iniziale: 87 richieste, tutte HTTP 200; font, CSS, JS, manifest, icone, worker. Scope e start URL risolvono entrambi a `/drawcircuit/`. Dettagli e MIME: `evidence/network-baseline.json`.

## Problemi verificati e corretti

### RC-01 — Sovrascrittura silenziosa di salvataggi illeggibili

**Severity P0; area documenti e Blocchi personali; HIGH FRICTION.**

1. Il salvataggio locale contiene JSON troncato o non valido.
2. Ricaricare: la baseline apre il circuito di esempio senza avviso; la libreria appare vuota.
3. Effettuare una nuova modifica o aggiungere un blocco.

**Atteso:** segnalazione e conservazione del dato originale. **Effettivo:** il dato viene sovrascritto senza recupero. Riproduzione della baseline eseguita con il vero store del commit iniziale compilato e storage controllato: `evidence/corrupt-storage-before.json` mostra `originalStillPresent: false` e notice vuota. È fault injection automatizzata, non una modifica allo storage personale nel browser.

**Root cause:** i due loader catturavano tutte le eccezioni tornando silenziosamente al fallback; le scritture successive non conservavano il raw originale.

**Fix:** loader con errore esplicito e copia locale del raw in una chiave univoca `*.recovery.<timestamp>` prima della prima nuova scrittura. Se il backup fallisce, l'originale non viene sovrascritto; il lavoro nuovo rimane in memoria con avviso di esportare JSON. Si conservano anche stringhe vuote e formati futuri sconosciuti. Nessuna nuova interfaccia di gestione backup.

**Regressioni:** `release-candidate-persistence.test.ts` e `release-candidate-block-persistence.test.ts`: JSON corrotto, originale esatto, errore quota sul backup, collisione del timestamp, storage inaccessibile, salvataggio principale fallito dopo backup, import libreria atomico, dati validi invariati.

### RC-02 — Chiusura senza avviso quando fallisce l'ultimo autosave

**Severity P0; area data loss; HIGH FRICTION.**

1. Modificare il documento e chiudere prima dei 400 ms del debounce.
2. La scrittura finale fallisce per quota/storage.
3. Nella baseline il catch ignora l'errore e la pagina si chiude.

**Atteso:** avviso del browser prima di perdere lavoro non salvato. **Root cause:** `saveOnExit` presumeva che il normale autosave avesse già notificato l'errore.

**Fix:** su fallimento del flush `beforeunload` annulla l'uscita e richiede l'avviso nativo; `pagehide` mantiene comunque il tentativo di flush. Il salvataggio riuscito non provoca conferme; un drag incompleto salva lo stato committed.

**Regressioni:** tre fault-injection test in `release-candidate-exit.test.ts`. Il dialogo nativo quota su browser reale è NOT TESTED; non è stata alterata la quota del profilo dell'utente.

### RC-05 — Escape lascia un titolo con draft invisibile

**Severity P2; area input; MEDIUM FRICTION.**

1. Modificare il titolo, premere Escape.
2. Digitare ancora senza rifocalizzare.
3. Fare clic su un altro controllo.

**Effettivo:** il testo digitato non è visibile ma viene committato al blur. Riproduzione nel browser: `title-escape-before.png`, titolo diventato `Rete resistiva · quattro nodiT` dopo la sequenza. **Root cause:** `editing=false` con input ancora focalizzato e `onBlur` che salva il draft.

**Fix:** Escape marca la cancellazione e toglie il focus; il blur non salva il draft annullato. **Regressione:** `release-candidate-title.test.tsx`, compreso refocus, nuovo draft visibile, Enter e Undo. **Manual retest PASS:** `title-escape-after.png`, focus rilasciato e titolo conservato.

### RC-07 — Promesse PWA rifiutate non gestite

**Severity P2; area PWA; MEDIUM FRICTION.**

**Riproduzione automatizzata:** far rifiutare la promessa di attivazione worker o install prompt. Le catene della baseline non avevano catch. **Fix:** avviso di fallimento e possibilità di riprovare, circuito conservato; catch anche sul caricamento del modulo di registrazione e callback dopo unmount ignorate. **Regressioni:** due test nuovi in `pwa-update.test.tsx`; nessun unhandled rejection nei test. Il fallimento del prompt di installazione su OS reale è NOT TESTED.

## Verifiche di persistence

| Scenario                                                                          | Risultato  | Metodo                                                                                                    |
| --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| Import JSON invalido conserva il circuito                                         | PASS       | UI/file chooser reale; screenshot `malformed-import-before.png`; secondo pass previsto sulla build finale |
| Missing fields/unknown component/duplicate IDs/broken endpoints/non-finite values | PASS       | suite serialization e audit rieseguita                                                                    |
| Legacy value/fontFamily/schema supportato                                         | PASS       | suite legacy e sostituzioni rieseguita                                                                    |
| Autosave e reload                                                                 | PASS       | browser, anche con server spento                                                                          |
| New/Open e richieste file fuori ordine                                            | PASS       | suite integration, New manuale agent UX                                                                   |
| Gestures atomic/Undo/Redo                                                         | PASS       | 53 entry reali, Undo53/Redo53 e JSON identici; report editor                                              |
| Corrupted localStorage/quota/storage denied                                       | PASS       | fault injection automatizzata, non profilo browser personale                                              |
| Crash del processo browser/OS                                                     | NOT TESTED | nessuna chiusura forzata del browser dell'utente                                                          |

## PWA locale reale

1. Caricato production preview `4173`, worker attivo e risorse in cache.
2. Terminato solo il processo preview; HTTP dall'origine risponde `000` (connessione rifiutata).
3. Reload nel browser riuscito; inserito un resistore: da 6 a 7 componenti, 12 fili.
4. Copy TikZ, download SVG e Save JSON funzionanti; nuovo reload preserva il documento.
5. Riavviato server con build nuova. Compare l'offerta di aggiornamento; nessun reload automatico durante editing.
6. Clic esplicito **Salva e aggiorna**: asset passa da `index-B9HgfGpd.js` a `index-Cczms2yu.js` e JSON dopo update identico a prima.

**PASS:** cache/reload offline locale, creazione, SVG/TikZ offline, persistence, attivazione nuova build. Evidenze `offline-local-*`, `pwa-update-offer.png`, `pwa-update-comparison.json`. La scoperta dell'update è asincrona: i primi reload mostrano legittimamente la vecchia build; il test ha aspettato il vero avviso. Installazione standalone OS e offline con rete disconnessa sul sito pubblico: NOT TESTED con questo browser, che non espone il controllo rete/installazione. Le risorse pubbliche, scope e manifest sono verificate separatamente via HTTP.

## Stress e performance

Fixture generata da `stress-fixture.ts`: **200 componenti, 400 fili, 150 testi, 50 Junction, 20 Loop Arrow = 820 oggetti**, 450 crossing.

- JSON roundtrip esatto, 370.602 caratteri; parse modello 1,64 ms.
- Crossing prima esecuzione 12,81 ms; 100 documenti nuovi 674,17 ms complessivi; 1.000 accessi cached 0,08 ms complessivi. Cache WeakMap del documento immutabile riutilizzata durante pan/zoom; non viene rifatto un confronto globale ad ogni movimento della vista.
- Export modello in Node: SVG 21,37 ms; standalone 35,25 ms; Obsidian 19,77 ms. Questi valori **non sono browser FPS** e il benchmark Node usa il fallback di misura testo.
- Import effettuato dalla UI, 820 oggetti effettivamente nel DOM, 13.665 elementi. Fit/zoom, pan reale di `(100,50)`, drag componente collegato `(0,0)→(180,140)`, Undo `(0,0)`, Redo `(180,140)`: PASS. Nessun errore/warning catturato.
- Export UI: TikZ 319.660 caratteri, SVG 542.701, nessun `NaN`/`undefined`, nessun foreignObject nello SVG.
- Tempi delle azioni browser in `performance-browser.json` includono trasporto/automazione: non vengono presentati come latenza nativa.

FPS, heap growth e profiling memoria lungo ore: NOT TESTED. Non sono emersi colli di bottiglia riproducibili nel carico richiesto; non sono stati introdotti refactor prestazionali speculativi.

## Browser e viewport

Browser integrato, motore Chromium: PASS. `1920×1080`, `1440×900`, `1280×800`, `1024×768`: export aperto/chiuso, canvas visibile, nessuno scroll orizzontale o dialogo tagliato. Misure e screenshot in `viewport-matrix.json` e `viewport-*.png`.

Chrome esterno: NOT TESTED — selettore Browser `chrome` non disponibile. Firefox/Safari/WebKit: NOT TESTED — nessun backend connesso. Zoom browser 80/125/150%: NOT TESTED — nessuna capability zoom; shortcut tentata non modifica le dimensioni CSS. Zoom editor, pan, coordinates e sidebar sono verificati dagli altri workflow.

## Note di pubblicazione

Build finale, commit, Actions, live smoke e conclusione: registrati nel report principale dopo il completamento. Il risultato della preview non viene dichiarato come risultato della versione pubblica.

## Smoke pubblico dopo deployment

[Run build + Pages 37145440142](https://github.com/andrelombardo/drawcircuit/actions/runs/37145440142) PASS sul commit `a81c4f3c1f8b2ad177291b00990807abbc1476e6`. Il browser ha applicato Salva e aggiorna e caricato `index-QAjNzizE.js`; titolo e conteggi iniziali conservati. Il golden di 44 oggetti conserva dopo reload i tre export completi identici ai file validati. Import JSON invalido: messaggio italiano atteso e documento preservato. Il documento iniziale di 22 oggetti è stato ripristinato dalla copia privata e ricaricato; i tre export coincidono con quelli generati dalla stessa copia in locale. Console finale vuota; 87 risorse HTTP 200.

[Prova live](evidence/public-release-smoke.json), [audit rete](evidence/network-final.json). **BLOCKED nell’ultimo run:** acquisizione di un nuovo download JSON, nessun file/evento acquisito dopo il click entro 10 s; l’interfaccia nativa del browser host non è accessibile al controllo Computer Use. Un file precedente non viene contato come nuovo confronto JSON live. Il precedente confronto esatto JSON locale e il test con server spento rimangono PASS. Rete offline sulla origin pubblica e installazione OS: NOT TESTED.
