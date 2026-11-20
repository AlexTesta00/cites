// Citazioni di pubblico dominio (autori morti da oltre 70 anni, testi originali o traduzioni libere da diritti).
// Usate da "Ispirami" e come esempi nelle anteprime dei template.

export const QUOTES = {
  it: [
    { t: 'L’unica gioia al mondo è cominciare.', a: 'Cesare Pavese', w: 'Il mestiere di vivere' },
    { t: 'E quindi uscimmo a riveder le stelle.', a: 'Dante Alighieri', w: 'Inferno, XXXIV' },
    { t: 'La vita non conclude.', a: 'Luigi Pirandello', w: 'Uno, nessuno e centomila' },
    { t: 'e il naufragar m’è dolce in questo mare.', a: 'Giacomo Leopardi', w: 'L’infinito' },
    { t: 'Il coraggio, uno non se lo può dare.', a: 'Alessandro Manzoni', w: 'I promessi sposi' },
    { t: 'C’era una volta un pezzo di legno.', a: 'Carlo Collodi', w: 'Le avventure di Pinocchio' },
    { t: 'Odi et amo.\nQuare id faciam, fortasse requiris.', a: 'Catullo', w: 'Carmina, 85' },
    { t: 'Amor, ch’a nullo amato amar perdona', a: 'Dante Alighieri', w: 'Inferno, V' },
    { t: 'La vita non è né brutta né bella, ma è originale!', a: 'Italo Svevo', w: 'La coscienza di Zeno' },
    { t: 'Libertà va cercando, ch’è sì cara,\ncome sa chi per lei vita rifiuta.', a: 'Dante Alighieri', w: 'Purgatorio, I' },
    { t: 'Fatti non foste a viver come bruti,\nma per seguir virtute e canoscenza.', a: 'Dante Alighieri', w: 'Inferno, XXVI' },
    { t: 'Sempre caro mi fu quest’ermo colle', a: 'Giacomo Leopardi', w: 'L’infinito' },
    { t: 'Dolce e chiara è la notte e senza vento', a: 'Giacomo Leopardi', w: 'La sera del dì di festa' },
    { t: 'Verrà la morte e avrà i tuoi occhi', a: 'Cesare Pavese', w: 'Verrà la morte e avrà i tuoi occhi' },
    { t: 'Carpe diem, quam minimum credula postero.', a: 'Orazio', w: 'Odi, I, 11' },
    { t: 'Omnia, Lucili, aliena sunt, tempus tantum nostrum est.', a: 'Seneca', w: 'Lettere a Lucilio, I' },
    { t: 'Nel mezzo del cammin di nostra vita\nmi ritrovai per una selva oscura,\nché la diritta via era smarrita.', a: 'Dante Alighieri', w: 'Inferno, I' },
    { t: 'l’amor che move il sole e l’altre stelle.', a: 'Dante Alighieri', w: 'Paradiso, XXXIII' },
    { t: 'C’è qualcosa di nuovo oggi nel sole,\nanzi d’antico', a: 'Giovanni Pascoli', w: 'L’aquilone' },
    { t: 'Chiare, fresche et dolci acque', a: 'Francesco Petrarca', w: 'Canzoniere, 126' },
  ],
  en: [
    { t: 'We are all in the gutter, but some of us are looking at the stars.', a: 'Oscar Wilde', w: 'Lady Windermere’s Fan' },
    { t: 'Hope is the thing with feathers\nThat perches in the soul', a: 'Emily Dickinson', w: '' },
    { t: 'I am large, I contain multitudes.', a: 'Walt Whitman', w: 'Song of Myself' },
    { t: 'We are such stuff\nAs dreams are made on, and our little life\nIs rounded with a sleep.', a: 'William Shakespeare', w: 'The Tempest' },
    { t: 'A thing of beauty is a joy for ever.', a: 'John Keats', w: 'Endymion' },
    { t: 'Forever – is composed of Nows –', a: 'Emily Dickinson', w: '' },
    { t: 'There is no charm equal to tenderness of heart.', a: 'Jane Austen', w: 'Emma' },
    { t: 'So we beat on, boats against the current, borne back ceaselessly into the past.', a: 'F. Scott Fitzgerald', w: 'The Great Gatsby' },
    { t: 'I am no bird; and no net ensnares me.', a: 'Charlotte Brontë', w: 'Jane Eyre' },
    { t: 'Whatever our souls are made of, his and mine are the same.', a: 'Emily Brontë', w: 'Wuthering Heights' },
    { t: 'I can resist everything except temptation.', a: 'Oscar Wilde', w: 'Lady Windermere’s Fan' },
    { t: 'Isn’t it nice to think that tomorrow is a new day with no mistakes in it yet?', a: 'L. M. Montgomery', w: 'Anne of Green Gables' },
    { t: 'A woman must have money and a room of her own if she is to write fiction.', a: 'Virginia Woolf', w: 'A Room of One’s Own' },
    { t: 'Beware; for I am fearless, and therefore powerful.', a: 'Mary Shelley', w: 'Frankenstein' },
    { t: 'All the world’s a stage,\nAnd all the men and women merely players.', a: 'William Shakespeare', w: 'As You Like It' },
    { t: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', a: 'Jane Austen', w: 'Pride and Prejudice' },
    { t: 'Happy families are all alike; every unhappy family is unhappy in its own way.', a: 'Leo Tolstoy', w: 'Anna Karenina' },
    { t: 'To be, or not to be, that is the question.', a: 'William Shakespeare', w: 'Hamlet' },
    { t: 'Carpe diem, quam minimum credula postero.', a: 'Horace', w: 'Odes, I, 11' },
    { t: 'Odi et amo.\nQuare id faciam, fortasse requiris.', a: 'Catullus', w: 'Carmina, 85' },
  ],
};

/** Esempi brevissimi per i template "a una parola". */
export const SINGLE_WORD = { it: { t: 'Cominciare.', a: '', w: '' }, en: { t: 'Begin.', a: '', w: '' } };

export function quotesFor(lang) {
  return QUOTES[lang] ?? QUOTES.it;
}
