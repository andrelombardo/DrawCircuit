# Comic Relief negli export Obsidian

“Copia per Obsidian” include i file WOFF2 normale e grassetto di Comic Relief
1.210. Il renderer SVG può quindi visualizzare il circuito senza avere il font
installato e senza richieste a server esterni. I blocchi copiati prima di questo
aggiornamento devono essere esportati nuovamente.

Le definizioni `@font-face` vengono emesse una sola volta dentro `circuitikz`,
tramite una special `dvisvgm:raw` protetta dal controllo del driver già usato per
le label. Il compilatore elimina le special esterne alla figura: includere i font
nel solo preambolo non è sufficiente. I dati sono divisi in righe corte con `%`
alla fine, così TeX non aggiunge spazi ai data URL. La licenza OFL usa un commento
CSS `/*! ... */`, preservato anche dall’ottimizzatore SVG del renderer.

Verifica del 15 ottobre 2026 con il bundle ufficiale
[Inline TikZ 0.2.1](https://github.com/lachlanharrisdev/obsidian-inline-tikz/releases/tag/0.2.1),
eseguito in un processo isolato tramite `scripts/verify-obsidian-bundle.mjs`,
senza modificare note o impostazioni di Obsidian:

- Codice prodotto dall’editor nel browser, con rete resistiva, lettere greche,
  testo accentato, cirillico, grassetto, pedici, frazioni e primi.
- Compilazione riuscita; entrambi i font estratti dall’SVG risultante sono
  identici byte per byte ai WOFF2 del progetto; la licenza rimane presente.
- SVG visualizzato nel browser con una famiglia CSS temporanea assente dal
  documento ospitante, per escludere l’uso di un font installato o caricato dalla pagina.
- Confronto visivo con l’export SVG del sito e prova senza le definizioni font:
  rimuoverle cambia 8.830 pixel, confermando che il renderer usa quelle incorporate.

Il codice cresce di circa 87 KB per circuito. Gli export TikZ standard e `.tex`
mantengono il loro percorso portabile. I driver diversi da quelli SVG supportati
e gli ambienti senza DOM conservano il fallback sans serif già disponibile.
