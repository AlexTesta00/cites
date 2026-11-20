// Eseguito nel <head> prima del disegno della pagina: evita lampi di contenuto
// durante le animazioni d'ingresso e prepara la tendina di transizione.
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  try {
    if (sessionStorage.getItem('cites:curtain') === '1') {
      root.classList.add('curtain-in');
      sessionStorage.removeItem('cites:curtain');
    }
  } catch {
    /* sessionStorage non disponibile */
  }
  // Se gli script delle animazioni non partono, dopo poco mostriamo comunque tutto.
  setTimeout(function () {
    root.classList.add('reveal-all');
  }, 2600);
})();
