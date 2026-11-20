// Testi dell'interfaccia usati da JavaScript (il resto è scritto da PHP).

export const lang = document.documentElement.lang === 'en' ? 'en' : 'it';

const DICT = {
  it: {
    'tool.h': 'Evidenzia',
    'tool.u': 'Sottolinea',
    'tool.c': 'Cerchia',
    'tool.d': 'Doppia',
    'tool.erase': 'Gomma',
    'align.left': 'A sinistra',
    'align.center': 'Al centro',
    'align.right': 'A destra',
    'align.justify': 'Giustificato',
    'page': 'Pagina {n}',
    'page.of': 'Pagina {n} di {total}',
    'page.remove': 'Elimina la pagina {n}',
    'page.select': 'Vai alla pagina {n}',
    'page.add': 'Aggiungi pagina',
    'family.all': 'Tutti',
    'toast.link': 'Link copiato: chi lo apre trova la tua citazione così com’è.',
    'toast.linkFail': 'Non riesco a copiare il link. Eccolo: {url}',
    'toast.downloaded': 'Fatto! È la pagina numero {n} nata su Cites.',
    'toast.downloadedPlain': 'Immagine scaricata.',
    'toast.zip': 'Carosello scaricato: {n} pagine in uno .zip.',
    'toast.error': 'Qualcosa è andato storto. Riprova tra un attimo.',
    'toast.inspire': '{author}',
    'toast.maxPages': 'Un carosello può avere al massimo 10 pagine.',
    'toast.restored': 'Ho ritrovato la tua ultima citazione.',
    'sample.text': 'L’unica gioia al mondo è cominciare.',
    'sample.author': 'Cesare Pavese',
    'sample.work': 'Il mestiere di vivere',
    'phone': 'Telefono',
    'phone.show': 'Mostra l’anteprima su telefono',
    'phone.reply': 'Invia un messaggio',
    'phone.now': 'ora',
    'phone.likes': 'Piace a {n} persone',
    'phone.more': 'altro',
    'phone.handle': 'iltuonome',
    'template.use': 'Usa il template {name}',
  },
  en: {
    'tool.h': 'Highlight',
    'tool.u': 'Underline',
    'tool.c': 'Circle',
    'tool.d': 'Double',
    'tool.erase': 'Eraser',
    'align.left': 'Left',
    'align.center': 'Center',
    'align.right': 'Right',
    'align.justify': 'Justified',
    'page': 'Page {n}',
    'page.of': 'Page {n} of {total}',
    'page.remove': 'Delete page {n}',
    'page.select': 'Go to page {n}',
    'page.add': 'Add page',
    'family.all': 'All',
    'toast.link': 'Link copied: whoever opens it finds your quote exactly as it is.',
    'toast.linkFail': 'I can’t copy the link. Here it is: {url}',
    'toast.downloaded': 'Done! That’s page number {n} born on Cites.',
    'toast.downloadedPlain': 'Image downloaded.',
    'toast.zip': 'Carousel downloaded: {n} pages in a .zip.',
    'toast.error': 'Something went wrong. Try again in a moment.',
    'toast.inspire': '{author}',
    'toast.maxPages': 'A carousel can have at most 10 pages.',
    'toast.restored': 'I found your last quote.',
    'sample.text': 'We are all in the gutter, but some of us are looking at the stars.',
    'sample.author': 'Oscar Wilde',
    'sample.work': 'Lady Windermere’s Fan',
    'phone': 'Phone',
    'phone.show': 'Show the phone preview',
    'phone.reply': 'Send a message',
    'phone.now': 'now',
    'phone.likes': 'Liked by {n} people',
    'phone.more': 'more',
    'phone.handle': 'yourname',
    'template.use': 'Use the {name} template',
  },
};

export function t(key, vars = {}) {
  let text = DICT[lang][key] ?? DICT.it[key] ?? key;
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

export function formatNumber(value) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'it-IT').format(value);
}
