# Pubblicazione del sito

DrawCircuit è un’applicazione web statica. L’unica destinazione è [GitHub Pages](https://andrelombardo.github.io/DrawCircuit/).

`.github/workflows/deploy-pages.yml` esegue su Ubuntu e Node 26.5.0:

1. `npm ci`.
2. `npm run lint`.
3. `npm run build` (comprende TypeScript).
4. Upload di `dist/` e deployment Pages, solo per push su `main` o avvio manuale del workflow su `main`.

Le pull request eseguono gli stessi controlli senza pubblicazione. La pipeline non usa routing per piattaforma, versioni automatiche, tag di release o permessi di scrittura sui contenuti del repository. I deployment sono serializzati.

Prima di pubblicare, verificare localmente con `npm run preview`, controllando anche il prefisso `/DrawCircuit/` (`npm run preview -- --base /DrawCircuit/`). Provare nel browser disegno, modifica, salvataggio locale ed export: il repository non include una suite di test automatici. Il build usa percorsi relativi per manifest, icone e asset. Non includere build generate, file `.env` o chiavi private nei commit.

Per verificare una pubblicazione, controllare che il commit della run Actions e del deployment Pages corrisponda a quello da provare; quindi aprire l’URL pubblico e confrontare, se necessario, gli hash degli asset HTML con l’artefatto di quella run. Il sito pubblico non contiene modifiche locali non pubblicate. Nessun file di versionamento viene generato nell’app.

## Risorse remote precedenti

Le release, i tag e gli artefatti nativi già pubblicati sono storici: questa pulizia non li elimina. Non verranno prodotti nuovi pacchetti o aggiornamenti nativi. L’eventuale rimozione delle vecchie release e dei secret di firma non più usati è un intervento separato nelle impostazioni GitHub. Non è necessaria al funzionamento del sito.

## Migrazione delle vecchie installazioni web

Il file `sw.js` pubblicato deve rispondere con il file di dismissione incluso in `public/`, anche se l’app non registra più service worker. La rinomina del repository cambia Pages da `/drawcircuit/` a `/DrawCircuit/`; GitHub non crea automaticamente un redirect del sito. Il repository separato [andrelombardo.github.io](https://github.com/andrelombardo/andrelombardo.github.io) pubblica una pagina statica in `/drawcircuit/index.html` che rimanda a `/DrawCircuit/`, conservando query e frammento quando JavaScript è attivo. Funzionano sia `/drawcircuit/` sia `/drawcircuit`; l’app continua a essere pubblicata esclusivamente da `DrawCircuit` con questa pipeline. Aprire l’indirizzo canonico rimuove anche le registrazioni e cache del vecchio scope, conservando i dati della stessa origine. Le PWA precedenti potrebbero richiedere un aggiornamento manuale. Vedere [PWA e persistenza](pwa.md) per proprietà delle cache, limiti e criteri di rimozione della migrazione.
