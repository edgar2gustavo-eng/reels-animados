/* reels-animados · modo editorial
 * Tipografía cinética sobre papel: cada escena es una composición de bloques (textos con estilos
 * mezclados, cifras, gráficas, etiquetas, botones y objetos 3D). Lee window.REEL.escenas.
 * Los objetos 3D los dibuja objetos3d.js (Three.js): aquí solo se decide dónde y cuándo aparecen,
 * y se publica esa lista en window.__editorialListo.
 */
(function () {
  var R = window.REEL || {};
  var root = document.getElementById('root');
  var W = +root.getAttribute('data-width');
  var H = +root.getAttribute('data-height');
  var DUR = +root.getAttribute('data-duration');
  var U = Math.min(W, H) / 1080;
  var tl = gsap.timeline({ paused: true });
  var cont = document.getElementById('escenas');
  var listo;
  window.__editorialListo = new Promise(function (r) { listo = r; });
  var OBJETOS = [];

  function el(tag, cls, padre, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    padre.appendChild(e);
    return e;
  }
  function escapar(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  // **palabra** → letra fuerte · *palabra* → color de acento
  function marcado(s) {
    return escapar(s).replace(/\*\*(.+?)\*\*/g, '<b class="ed-en-fuerte f-titulo">$1</b>').replace(/\*(.+?)\*/g, '<em class="ed-en-acento">$1</em>');
  }
  var COLORES = { tinta: 'var(--tinta)', gris: 'var(--gris)', acento: 'var(--acento-tinta)', suave: 'var(--suave)', naranja: '#F2A33A', azul: '#3F6178', blanco: '#FFFFFF' };
  function color(c) { return c ? COLORES[c] || c : null; }
  var ESTILOS = {
    cursiva: { cls: 'ed-cursiva f-editorial', tam: 96 },
    fuerte: { cls: 'ed-fuerte f-titulo', tam: 118 },
    condensada: { cls: 'ed-condensada', tam: 250 },
  };

  // ---------- entradas ----------
  function entrar(nodo, t, tipo) {
    if (tipo === 'barrido') {
      tl.fromTo(nodo, { opacity: 0, x: 260 * U, filter: 'blur(28px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, t);
    } else if (tipo === 'golpe') {
      tl.fromTo(nodo, { opacity: 0, scale: 1.4, filter: 'blur(16px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' }, t);
    } else if (tipo === 'palabras') {
      // Una palabra tras otra: parte el texto respetando las marcas de estilo.
      var partes = [];
      nodo.childNodes.forEach(function (n) { partes.push(n); });
      nodo.innerHTML = '';
      var k = 0;
      partes.forEach(function (n) {
        var envoltura = n.nodeType === 1 ? n.cloneNode(false) : null;
        String(n.textContent).split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { nodo.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span');
          s.className = 'ed-palabra';
          if (envoltura) { var e = envoltura.cloneNode(false); e.textContent = w; s.appendChild(e); } else s.textContent = w;
          nodo.appendChild(s);
          tl.fromTo(s, { opacity: 0, y: 40 * U, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, t + k * 0.12);
          k++;
        });
      });
    } else {
      tl.fromTo(nodo, { opacity: 0, y: 50 * U, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power3.out' }, t);
    }
  }
  function salir(nodo, t) {
    tl.to(nodo, { opacity: 0, y: -30 * U, filter: 'blur(10px)', duration: 0.2, ease: 'power2.in' }, t);
  }

  // ---------- bloques ----------
  var BLOQUES = {
    texto: function (b, col) {
      var est = ESTILOS[b.estilo] || ESTILOS.cursiva;
      var p = el('p', 'ed-bloque ed-texto ' + est.cls, col, marcado(b.texto));
      var tam = Math.round((b.tam || est.tam) * U);
      p.style.fontSize = tam + 'px';
      if (b.color) p.style.color = color(b.color);
      // Fuerte y condensada van en una sola línea: si no caben ("PRODUCTIVIDAD"), se achican.
      if (b.estilo === 'fuerte' || b.estilo === 'condensada') {
        p.style.whiteSpace = 'nowrap';
        var ancho = col.clientWidth - (b.sangria || 0) * U;
        if (p.scrollWidth > ancho) p.style.fontSize = Math.floor(tam * ancho / p.scrollWidth * 0.98) + 'px';
      }
      return p;
    },
    objeto: function (b, col, E, t0, t1) {
      // Un hueco en la columna: el objeto 3D se dibuja centrado en él.
      var o = b.objeto, tam = (o.tam || 420) * U;
      var hueco = el('div', 'ed-bloque ed-hueco', col);
      hueco.style.height = Math.round(b.alto ? b.alto * U : tam * (o.aro ? 1.34 : 1.08)) + 'px';
      if (o.aro) {
        var lado = tam * 1.28;
        var aro = el('div', 'ed-aro', hueco, '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" /></svg>');
        aro.style.width = aro.style.height = lado + 'px';
        tl.to(aro, { rotation: 60, duration: Math.max(0.1, t1 - t0), ease: 'none' }, t0);
      }
      OBJETOS.push({ o: o, hueco: hueco, t0: b.en, t1: b.sale != null ? b.sale : t1, desplazar: E.desplazar || [] });
      return hueco;
    },
    cifra: function (b, col) {
      var caja = el('div', 'ed-bloque ed-cifra-caja', col);
      el('div', 'ed-brillo', caja);
      var p = el('p', 'ed-cifra f-titulo', caja, escapar(b.cifra));
      p.style.fontSize = Math.round((b.tam || 176) * U) + 'px';
      p.style.color = color(b.color || 'naranja');
      caja.style.setProperty('--brillo', color(b.color || 'naranja'));
      // Cuenta desde "desde" hasta la cifra, con separador de miles con punto.
      // Solo se cuenta si hay un número ("35.000", "90%"); un rango como "7–9" se muestra tal cual.
      var m = /^([^\d]*)([\d.,]+)(\D*)$/.exec(b.cifra);
      if (m && b.contar !== false) {
        var aNum = function (s) { return parseFloat(String(s).replace(/\./g, '').replace(',', '.')); };
        var fin = aNum(m[2]), ini = b.desde != null ? aNum(b.desde) : 0, dec = (m[2].split(',')[1] || '').length;
        var o = { v: ini };
        tl.fromTo(o, { v: ini }, { v: fin, duration: 1.1, ease: 'power2.out', onUpdate: function () {
          p.textContent = m[1] + o.v.toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + m[3];
        } }, b.en);
        tl.fromTo(caja.querySelector('.ed-brillo'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5 }, b.en);
      }
      return caja;
    },
    grafica: function (b, col) {
      var g = b.grafica, barras = g.barras || [];
      var caja = el('div', 'ed-bloque ed-grafica', col);
      var alto = (g.alto || 400) * U, ancho = Math.min(560 * U, barras.length * 128 * U);
      caja.style.width = ancho + 'px'; caja.style.height = alto + 'px';
      var max = Math.max.apply(null, barras.map(function (x) { return x.valor || x; }).concat([1]));
      var PALETA = g.colores || [['#35D0C0', '#1C9E92'], ['#7B4DF0', '#4B2BB3'], ['#EC5A8D', '#B8335F'], ['#F7B23B', '#F0612A']];
      var paso = ancho / barras.length, anchoB = paso * 0.72, puntos = [];
      barras.forEach(function (x, i) {
        var v = x.valor || x, h = (alto * 0.86) * v / max;
        var br = el('i', 'ed-barra', caja);
        var c = PALETA[i % PALETA.length];
        br.style.left = (i * paso) + 'px'; br.style.width = anchoB + 'px'; br.style.height = h + 'px';
        br.style.background = 'linear-gradient(' + c[0] + ',' + c[1] + ')';
        tl.fromTo(br, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'back.out(1.4)' }, b.en + i * 0.12);
        puntos.push([i * paso + anchoB / 2, alto - h - 40 * U]);
      });
      if (g.linea !== false && puntos.length > 1) {
        // Línea de tendencia sobre las barras, con punta de flecha al final.
        var d = 'M ' + puntos.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L ');
        var u = puntos[puntos.length - 1], a = puntos[puntos.length - 2], ang = Math.atan2(u[1] - a[1], u[0] - a[0]), L = 26 * U;
        var p1 = [u[0] - L * Math.cos(ang - 0.5), u[1] - L * Math.sin(ang - 0.5)], p2 = [u[0] - L * Math.cos(ang + 0.5), u[1] - L * Math.sin(ang + 0.5)];
        var svg = el('div', 'ed-linea', caja, '<svg width="' + ancho + '" height="' + alto + '"><path class="ed-trazo" d="' + d + '"/><path class="ed-trazo" d="M ' + p1.join(' ') + ' L ' + u.join(' ') + ' L ' + p2.join(' ') + '"/></svg>');
        svg.querySelectorAll('path').forEach(function (pa, k) { dibujar(pa, b.en + 0.4 + k * 0.5, k ? 0.15 : 0.55); });
      }
      return caja;
    },
    etiquetas: function (b, col) {
      var caja = el('div', 'ed-bloque ed-etiquetas', col);
      b.etiquetas.forEach(function (txt, i) {
        var e = el('p', 'ed-etiqueta ed-cursiva f-editorial', caja, marcado(txt));
        e.style.fontSize = Math.round((b.tam || 64) * U) + 'px';
        var t = (b.tiempos && b.tiempos[i] != null) ? b.tiempos[i] : b.en + i * 0.8;
        tl.fromTo(e, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)' }, t);
      });
      return caja;
    },
    marca: function (b, col) {
      // Cierre: logo de la marca en círculo y @usuario debajo.
      var m = R.marca || {}, caja = el('div', 'ed-bloque ed-marca', col);
      if (window.REEL_LOGO) el('img', 'ed-logo', caja).src = window.REEL_LOGO;
      if (m.usuario) el('p', 'ed-usuario f-titulo', caja, escapar(m.usuario));
      tl.fromTo(caja, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, b.en);
      return caja;
    },
    boton: function (b, col) {
      var p = el('div', 'ed-bloque ed-boton f-titulo', col, marcado(b.boton));
      p.style.fontSize = Math.round((b.tam || 56) * U) + 'px';
      tl.fromTo(p, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)' }, b.en);
      return p;
    },
  };
  function tipoBloque(b) {
    if (b.objeto) return 'objeto';
    if (b.cifra != null) return 'cifra';
    if (b.grafica) return 'grafica';
    if (b.etiquetas) return 'etiquetas';
    if (b.boton) return 'boton';
    if (b.marca) return 'marca';
    return 'texto';
  }
  function dibujar(path, t, d) {
    var L = Math.ceil(path.getTotalLength());   // se mide una vez: cada cuadro se dibuja igual
    path.style.strokeDasharray = L;
    tl.fromTo(path, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: d, ease: 'power2.inOut' }, t);
  }

  // ---------- curvas decorativas (grises, debajo de todo) ----------
  var CURVAS = {
    a: 'M 1180 150 C 700 380, 200 900, 140 1500',
    b: 'M -80 1250 C 350 1150, 800 1400, 1160 1900',
    c: 'M 1160 700 C 750 820, 380 1200, 200 1950',
    d: 'M -100 520 C 300 380, 760 520, 1180 260',
  };
  var svgCurvas = document.getElementById('curvas');

  // ---------- objetos 3D decorativos por lugar ----------
  // 'tarjeta' = esquina superior derecha de la tarjeta de color de esa escena (se mide al armar).
  var LUGARES = { 'arriba-izquierda': [0.2, 0.2], 'arriba-derecha': [0.8, 0.17], 'abajo-izquierda': [0.2, 0.8], 'abajo-derecha': [0.8, 0.82], 'centro': [0.5, 0.5], 'arriba': [0.5, 0.16], 'abajo': [0.5, 0.84] };

  function construir() {
    var escenas = (R.escenas || []).slice().sort(function (a, b) { return a.en - b.en; });
    escenas.forEach(function (E, i) {
      var t0 = E.en, t1 = E.hasta != null ? E.hasta : (escenas[i + 1] ? escenas[i + 1].en : DUR), ultima = i === escenas.length - 1;
      var capa = el('div', 'ed-escena', cont);
      gsap.set(capa, { visibility: i === 0 ? 'visible' : 'hidden' });
      if (i > 0) tl.set(capa, { visibility: 'visible' }, t0);
      if (!ultima) tl.set(capa, { visibility: 'hidden' }, t1);

      var col = el('div', 'ed-columna ed-v-' + (E.vertical || 'centro'), capa);
      var bloques = E.bloques || [];
      var tarjeta = null;
      if (E.tarjeta) {
        col = tarjeta = el('div', 'ed-tarjeta', col);
        tl.fromTo(col, { clipPath: 'inset(38% 0% 38% 0% round ' + 64 * U + 'px)', scale: 0.6 }, { clipPath: 'inset(0% 0% 0% 0% round ' + 64 * U + 'px)', scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, t0 + 0.05);
        if (!ultima) tl.to(col, { scale: 0.85, opacity: 0, duration: 0.18, ease: 'power2.in' }, t1 - 0.18);
      }
      bloques.forEach(function (b, k) {
        if (b.en == null) b.en = t0 + 0.08 + k * 0.15;
        var tipo = tipoBloque(b);
        var nodo = BLOQUES[tipo](b, col, E, t0, t1);
        nodo.style.alignSelf = { izquierda: 'flex-start', centro: 'center', derecha: 'flex-end' }[b.alinear || (tipo === 'texto' ? 'izquierda' : 'centro')];
        if (b.alinear === 'centro') nodo.style.textAlign = 'center';
        if (b.alinear === 'derecha') nodo.style.textAlign = 'right';
        if (b.sangria) nodo.style.marginLeft = (b.sangria * U) + 'px';
        if (tipo === 'texto') entrar(nodo, b.en, b.entrada);
        else if (tipo !== 'objeto' && tipo !== 'etiquetas' && tipo !== 'boton' && tipo !== 'marca') entrar(nodo, b.en, 'subir');
        if (b.sale != null) salir(nodo, b.sale);
        else if (!ultima && !E.tarjeta && tipo !== 'objeto') salir(nodo, t1 - 0.2);
      });
      // La columna completa puede subir o bajar (por ejemplo, cuando se va el título y entra la cifra).
      (E.desplazar || []).forEach(function (d) { tl.to(col, { y: d.y * U, duration: 0.55, ease: 'power3.inOut' }, d.en); });

      (E.curvas || []).forEach(function (c, k) {
        if (!CURVAS[c]) return;
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', CURVAS[c]);
        p.setAttribute('stroke-width', c === 'a' ? 70 : 54);
        svgCurvas.appendChild(p);
        gsap.set(p, { opacity: 0 });
        tl.set(p, { opacity: 1 }, t0);
        dibujar(p, t0 + k * 0.1, 0.6);
        if (!ultima) tl.to(p, { opacity: 0, duration: 0.2 }, t1 - 0.2);
      });

      (E.objetos || []).forEach(function (o) {
        var lugar = LUGARES[o.lugar] || LUGARES['arriba-derecha'];
        if (o.lugar === 'tarjeta' && tarjeta) { OBJETOS.push({ o: o, esquina: tarjeta, t0: o.en != null ? o.en : t0 + 0.05, t1: o.sale != null ? o.sale : t1, desplazar: [] }); return; }
        OBJETOS.push({ o: o, x: o.x != null ? o.x * U : lugar[0] * W, y: o.y != null ? o.y * U : lugar[1] * H, t0: o.en != null ? o.en : t0 + 0.05, t1: o.sale != null ? o.sale : (ultima ? DUR + 1 : t1), desplazar: [] });
      });
    });

    // Posición final de cada hueco (con las fuentes ya cargadas), en píxeles de la composición.
    // Se mide con offsetLeft/offsetTop: no los alteran las escalas ni los desplazamientos de las entradas.
    function caja(n) {
      var x = 0, y = 0, e = n;
      // Hasta #escenas, que mide siempre W×H en píxeles: la medida no depende de cuándo HyperFrames
      // le da su tamaño final a la composición.
      while (e && e !== cont && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
      return { x: x, y: y, w: n.offsetWidth, h: n.offsetHeight };
    }
    var lista = OBJETOS.map(function (x) {
      var px = x.x, py = x.y, tam = (x.o.tam || 420) * U;
      if (x.hueco) { var r = caja(x.hueco); px = r.x + r.w / 2; py = r.y + r.h / 2; }
      if (x.esquina) { var q = caja(x.esquina); px = q.x + q.w - tam * 0.15; py = q.y + tam * 0.1; }
      return { tipo: x.o.tipo, color: x.o.color || null, px: px, py: py, tam: tam, t0: x.t0, t1: x.t1,
        entrada: x.o.entrada || 'aparecer', flecha: x.o.flecha != null ? x.o.flecha : null, desplazar: x.desplazar.map(function (d) { return { en: d.en, y: d.y * U }; }) };
    });
    window.__timelines['reel'] = tl;
    listo({ objetos: lista, W: W, H: H, colores: window.REEL_COLORES || {} });
  }
  // Las fuentes se cargan antes de medir: si no, el achicado de "fuerte" y "condensada" y la
  // posición de los objetos 3D se calculan con una fuente de reemplazo más ancha.
  if (document.fonts && document.fonts.load) {
    var fuerte = (window.REEL_FUENTES || {}).titulo || 'Montserrat';
    Promise.all(['400 100px "League Gothic"', 'italic 500 100px "Playfair Display"', '800 100px "' + fuerte + '"']
      .map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return document.fonts.ready; })
      .then(construir);
  } else construir();
})();
