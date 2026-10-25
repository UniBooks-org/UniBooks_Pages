// Comportamenti comuni a tutte le pagine: barra in alto, avanzamento lettura,
// comparsa degli elementi allo scorrimento.
(function () {
  var nav = document.querySelector('.nav');
  var barra = document.querySelector('.progresso');
  var inAttesa = false;

  function aggiorna() {
    inAttesa = false;
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 8);
    if (barra) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
  }
  window.addEventListener('scroll', function () {
    if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); }
  }, { passive: true });
  aggiorna();

  var elementi = document.querySelectorAll('.rivela');
  if (!('IntersectionObserver' in window)) {
    elementi.forEach(function (el) { el.classList.add('visibile'); });
    return;
  }
  var osservatore = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (v.isIntersecting) { v.target.classList.add('visibile'); osservatore.unobserve(v.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  elementi.forEach(function (el) { osservatore.observe(el); });
})();
