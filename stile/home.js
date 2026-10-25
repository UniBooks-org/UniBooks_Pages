// Interazioni della home: titolo animato, telefono dell'hero, racconto con
// le schermate dell'app, contatori, calcolatori dei costi e della CO2, FAQ.
(function () {
  var ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Titolo che entra parola per parola.
  document.querySelectorAll('[data-parole]').forEach(function (h) {
    var i = 0;
    function avvolgi(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'parola';
            s.textContent = p;
            s.style.animationDelay = (0.1 + i++ * 0.07) + 's';
            frag.appendChild(s);
          });
          nodo.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          avvolgi(n);
        }
      });
    }
    avvolgi(h);
  });

  // QR dimostrativi: tre quadrati d'angolo e moduli pseudo-casuali fissi.
  function disegnaQR(svg, seme) {
    var N = 25, d = '', x, y, s = seme;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function inAngolo(x, y) { return (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16); }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      if (!inAngolo(x, y) && rnd() > 0.52) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    [[0, 0], [18, 0], [0, 18]].forEach(function (p) {
      d += 'M' + p[0] + ' ' + p[1] + 'h7v7h-7zM' + (p[0] + 1) + ' ' + (p[1] + 1) + 'v5h5v-5z';
      d += 'M' + (p[0] + 2) + ' ' + (p[1] + 2) + 'h3v3h-3z';
    });
    svg.innerHTML = '<path fill="#000" fill-rule="evenodd" d="' + d + '"/>';
  }
  document.querySelectorAll('svg.qr').forEach(function (svg, i) { disegnaQR(svg, 17 + i * 31); });

  // Telefono dell'hero: parte inclinato e si raddrizza mentre scorri.
  var telHero = document.getElementById('telefono-hero');
  if (telHero && !ridotto) {
    var palco = telHero.parentNode;
    var inclinaHero = function () {
      var r = palco.getBoundingClientRect(), h = window.innerHeight;
      var p = Math.min(1, Math.max(0, 1 - (r.top - h * 0.2) / (h * 0.7)));
      telHero.style.transform = 'rotateX(' + (24 * (1 - p)).toFixed(2) + 'deg) scale(' + (0.88 + 0.12 * p).toFixed(3) + ')';
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(inclinaHero); }, { passive: true });
    inclinaHero();
  }

  // Numeri che contano quando entrano nello schermo.
  function conta(el) {
    var fine = parseFloat(el.dataset.conta), dec = parseInt(el.dataset.decimali || '0', 10), suf = el.dataset.suffisso || '';
    if (ridotto) { el.textContent = fine.toFixed(dec).replace('.', ',') + suf; return; }
    var t0 = null;
    function passo(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (fine * e).toFixed(dec).replace('.', ',') + suf;
      if (k < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  var osservaNumeri = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) { conta(v.target); osservaNumeri.unobserve(v.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-conta]').forEach(function (el) { osservaNumeri.observe(el); });

  // Racconto: su schermo largo il telefono resta fermo e cambia schermata
  // in base al passo che stai leggendo; su telefono ogni passo ha la sua copia.
  var telRacconto = document.getElementById('telefono-racconto');
  var schermate = {};
  telRacconto.querySelectorAll('.scr').forEach(function (s) { schermate[s.dataset.id] = s; });
  function mostra(id) {
    Object.keys(schermate).forEach(function (k) {
      var s = schermate[k];
      if (k === id) {
        if (!s.classList.contains('attiva')) { void s.offsetWidth; s.classList.add('attiva'); }
      } else {
        s.classList.remove('attiva');
      }
    });
  }
  document.querySelectorAll('.passo').forEach(function (p) {
    var tel = document.createElement('div'); tel.className = 'phone';
    var sc = document.createElement('div'); sc.className = 'screen';
    var copia = schermate[p.dataset.scr].cloneNode(true);
    copia.classList.remove('attiva'); copia.removeAttribute('data-id');
    sc.appendChild(copia); tel.appendChild(sc); p.querySelector('.shot').appendChild(tel);
  });
  var osservaPassi = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      var p = v.target;
      p.parentNode.querySelectorAll('.passo').forEach(function (q) { q.classList.toggle('attivo', q === p); });
      mostra(p.dataset.scr);
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  var osservaCopie = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) { v.target.querySelector('.scr').classList.add('attiva'); osservaCopie.unobserve(v.target); } });
  }, { threshold: 0.35 });
  document.querySelectorAll('.passo').forEach(function (p) {
    osservaPassi.observe(p);
    osservaCopie.observe(p.querySelector('.shot'));
  });

  // Compro / Vendo.
  var seg = document.querySelector('.segmentato'), cursore = seg.querySelector('.cursore');
  function posizionaCursore() {
    var b = seg.querySelector('[aria-selected="true"]');
    cursore.style.width = b.offsetWidth + 'px';
    cursore.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  seg.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.flusso').forEach(function (f) { f.hidden = f.dataset.flusso !== b.dataset.flusso; });
      var primo = document.querySelector('.flusso[data-flusso="' + b.dataset.flusso + '"] .passo');
      document.querySelectorAll('.passo').forEach(function (q) { q.classList.toggle('attivo', q === primo); });
      mostra(primo.dataset.scr);
      posizionaCursore();
    });
  });
  window.addEventListener('resize', posizionaCursore);
  posizionaCursore();

  // Schede che si inclinano seguendo il puntatore (solo con mouse).
  if (!ridotto && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.inclina').forEach(function (t) {
      t.addEventListener('mousemove', function (e) {
        if (!t.classList.contains('visibile')) return;
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = 'perspective(900px) rotateY(' + (x * 6).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      t.addEventListener('mouseleave', function () { t.style.transform = ''; });
    });
  }

  // Piano di studi: gli esami si spuntano uno dopo l'altro.
  var piano = document.getElementById('piano');
  if (piano && !ridotto) {
    var righe = piano.children, k = 1;
    setInterval(function () {
      k = k % righe.length + 1;
      Array.prototype.forEach.call(righe, function (r, i) { r.classList.toggle('fatto', i < k); });
    }, 1800);
  }

  // Tema chiaro / scuro da toccare.
  var ts = document.querySelector('.tema-switch');
  ts.addEventListener('click', function () { ts.dataset.tema = ts.dataset.tema === 'chiaro' ? 'scuro' : 'chiaro'; });
  if (!ridotto) setInterval(function () { if (!ts.matches(':hover')) ts.click(); }, 3500);

  // QR grande: ogni tanto "viene scansionato".
  var esito = document.getElementById('esito-qr');
  if (esito && !ridotto) setInterval(function () {
    esito.classList.add('mostra');
    setTimeout(function () { esito.classList.remove('mostra'); }, 1600);
  }, 5200);

  // Calcolatore: stesse formule delle Edge Function crea-pagamento
  // (quota compratore arrotondata) e conferma-scambio (quota venditore per difetto).
  function euro(c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; }
  function riempi(input, pieno, vuoto) {
    var pct = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.background = 'linear-gradient(90deg, ' + pieno + ' ' + pct + '%, ' + vuoto + ' ' + pct + '%)';
  }
  var cur = document.getElementById('calc-cursore');
  function calcola() {
    var base = parseInt(cur.value, 10) * 100;
    var totale = Math.round(base * 0.015) + 25;
    var comp = Math.round(totale / 2), vend = Math.floor(totale / 2);
    document.getElementById('calc-prezzo').textContent = cur.value + ' €';
    document.getElementById('calc-comp').textContent = '+ ' + euro(comp);
    document.getElementById('calc-tot').textContent = euro(base + comp);
    document.getElementById('calc-vend').textContent = '− ' + euro(vend);
    document.getElementById('calc-netto').textContent = euro(base - vend);
    document.getElementById('calc-nota').textContent = 'Costo totale del pagamento: ' + euro(totale) + ', diviso tra le due parti.';
    riempi(cur, '#fff', 'rgba(255,255,255,0.3)');
  }
  cur.addEventListener('input', calcola);
  calcola();

  // CO2: 2,7 kg per libro, auto a 161,7 g/km (stesse costanti dell'app).
  var co2 = document.getElementById('co2-cursore');
  function calcolaCO2() {
    var n = parseInt(co2.value, 10), kg = n * 2.7;
    document.getElementById('co2-n').textContent = n;
    document.getElementById('co2-kg').textContent = kg.toFixed(1).replace('.', ',');
    document.getElementById('co2-km').textContent = Math.round(kg * 1000 / 161.7);
    riempi(co2, '#2E7D32', '#C8E6C9');
  }
  co2.addEventListener('input', calcolaCO2);
  calcolaCO2();

  // FAQ: apertura e chiusura animate.
  document.querySelectorAll('.faq details').forEach(function (d) {
    var s = d.querySelector('summary'), c = d.querySelector('.risposta');
    s.addEventListener('click', function (e) {
      if (ridotto || !c.animate) return;
      e.preventDefault();
      if (d.open) {
        var a = c.animate([{ height: c.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'ease' });
        a.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        c.animate([{ height: '0px', opacity: 0 }, { height: c.offsetHeight + 'px', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });
})();
