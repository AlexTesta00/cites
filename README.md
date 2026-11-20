# Cites

**Crea la tua citazione, come in un libro.** Scrivi una frase, scegli uno dei 38 template ispirati alla carta e scarica l’immagine per storie, post e caroselli Instagram. Gratis, senza account, senza AI.

🔗 [cites.alextesta.space](https://cites.alextesta.space)

## Cosa fa

- **38 template in sei famiglie**: pagine di libro, carte speciali, quaderni, archivio, oggetti sulla scrivania, minimal. Ogni template è un punto di partenza che si può cambiare in tutto.
- **Formati Instagram**: storia 9:16 (con le zone sicure), post 4:5 e 3:4, quadrato, Pinterest 2:3, orizzontale 16:9.
- **Carta vera, disegnata al momento**: grana, fibre, luce, il testo della pagina dietro che traspare, bordi strappati, nastro adesivo, graffette, timbri.
- **Segni a mano**: evidenziatore, penna, matita, cerchio. Si tocca o si trascina sulle parole dell’anteprima.
- **Caratteri da libro e a mano**: Garamond, Cormorant, Baskerville, Crimson, Caveat, Homemade Apple, Nothing You Could Do, La Belle Aurore e una macchina da scrivere.
- **Dettagli da libro**: numero di pagina, titolo dell’opera in alto, firma con il proprio @, ex libris.
- **Carosello**: fino a 10 pagine con i numeri che continuano, scaricate in uno `.zip`.
- **Anteprima su telefono**: la storia o il post dentro uno smartphone, con l’interfaccia sopra.
- **Ispirami**: citazioni di pubblico dominio in italiano e in inglese.
- **Link e condivisione**: un link riapre la citazione così com’è; da telefono si condivide direttamente l’immagine.
- **Contatore anonimo** delle persone e delle immagini create.
- **Italiano e inglese**.

Le immagini nascono nel browser: le frasi non arrivano mai al server.

## Tecnologie

HTML, [Tailwind CSS](https://tailwindcss.com) 4, JavaScript (moduli ES, nessun bundler) e PHP 8. Animazioni con [GSAP](https://gsap.com) (ScrollTrigger, SplitText) e [Lenis](https://lenis.darkroom.engineering). Font e librerie arrivano da npm e vengono copiati nel sito: nessun CDN esterno.

```
public/                 cartella pubblicata su Hostinger
  index.php             homepage
  crea.php              editor
  privacy.php, 404.php
  api/counter.php       contatore anonimo (GET totali, POST un’esportazione)
  includes/             bootstrap, layout, traduzioni (non raggiungibili dal web)
  assets/js/engine/     motore di disegno su canvas: carta, impaginazione, segni, template
  assets/js/editor/     stato, link condivisibili, zip
  assets/js/home.js     animazioni della homepage
src/css/app.css         sorgente Tailwind (token di design e componenti)
scripts/copy-assets.mjs copia font e librerie da node_modules
dev/router.php          router per il server di sviluppo di PHP
tests/                  test JavaScript (node:test) e PHP
```

## Sviluppo in locale

Servono Node 24+ e PHP 8.3+.

```bash
npm ci
npm run build        # font, librerie e CSS
npm run serve        # http://127.0.0.1:8080
npm run watch:css    # in un altro terminale, ricompila il CSS mentre lavori
npm run lint
npm test
```

### Aggiungere un template

I template sono in [`public/assets/js/engine/templates.js`](public/assets/js/engine/templates.js). Ognuno sceglie superficie (`page`, `spread` o `object` su una scrivania), carta, carattere, impaginazione (`block`, `poem`, `chapter`, `epigraph`, `big`, `word`, `lines`), segni automatici e decorazioni. Carte, inchiostri e colori stanno in [`palette.js`](public/assets/js/engine/palette.js).

## Commit, rilasci e deploy

- **Conventional Commits**: i messaggi sono controllati da commitlint (hook `commit-msg` con husky e in CI sulle pull request).
- **semantic-release**: a ogni push su `main` calcola la versione dai commit, crea il tag e la release su GitHub con le note. Non fa commit automatici.
- **Deploy**: se esce una nuova versione, GitHub Actions compila il sito e lo carica via FTPS su Hostinger (solo i file cambiati). Si può rilanciare a mano da *Actions → Rilascio e deploy*.
- **Renovate**: aggiorna dipendenze e GitHub Actions ogni lunedì; gli aggiornamenti minori degli strumenti si uniscono da soli se la CI passa. Gli aggiornamenti di librerie e font che finiscono nel sito sono commit `fix(deps)`, quindi generano un rilascio e un deploy.

Per il deploy servono i secret `FTP_SERVER`, `FTP_USERNAME` e `FTP_PASSWORD`; le variabili `FTP_SERVER_DIR` (default `./cites/`), `FTP_PORT` e `FTP_SECURITY` sono facoltative. I dettagli sono in [`.github/workflows/release.yml`](.github/workflows/release.yml).

## Privacy

Nessun account, nessun cookie di profilazione, nessun analytics. Il contatore riceve solo il numero di pagine esportate; per evitare abusi tiene per al massimo un giorno un’impronta HMAC dell’IP con una chiave che cambia ogni giorno. Dettagli nella [pagina privacy](https://cites.alextesta.space/privacy).

## Licenze

- Codice: [MIT](LICENSE).
- Font: SIL Open Font License o Apache 2.0, secondo il carattere (i testi delle licenze vengono copiati in `public/assets/fonts/licenses`).
- GSAP: [licenza standard di GSAP](https://gsap.com/standard-license), gratuita.
- Citazioni di esempio: testi di pubblico dominio.

---

### English

**Cites** is a free web tool that turns a quote into an image that looks photographed from a book: 38 paper-inspired templates, Instagram formats, hand marks (highlighter, pen, circle), carousels as `.zip`, a phone preview and shareable links. Everything is drawn in the browser with canvas; no accounts, no AI. Built with HTML, Tailwind CSS, vanilla JavaScript and PHP.
