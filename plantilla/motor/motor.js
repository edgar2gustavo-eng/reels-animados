/* reels-animados · motor
 * Lee window.REEL (el guion en datos) y window.PALABRAS (la transcripción) y construye
 * todas las capas animadas sobre una sola línea de tiempo GSAP pausada.
 * Reglas de HyperFrames que respeta: nada de Math.random, Date.now ni repeat:-1;
 * la línea de tiempo se registra al final, cuando todo está construido.
 */
(function () {
  var R = window.REEL || {};
  var PAL = window.PALABRAS || [];
  var root = document.getElementById('root');
  var W = +root.getAttribute('data-width');
  var H = +root.getAttribute('data-height');
  var DUR = +root.getAttribute('data-duration');
  var V = H > W;                       // vertical (9:16, 4:5)
  var U = Math.min(W, H) / 1080;       // escala: 1 cuando el lado corto mide 1080 (9:16, 1:1, 16:9 en 1080p)
  var CON_VIDEO = !!(R.video && R.video.src);
  var capas = document.getElementById('capas');
  var tl = gsap.timeline({ paused: true });

  // ---------- utilidades ----------
  function el(tag, cls, padre, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (padre || capas).appendChild(e);
    return e;
  }
  function clave(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ%$€]/g, '');
  }
  function escapar(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  // *énfasis* → <em>
  function rico(s) { return escapar(s).replace(/\*(.+?)\*/g, '<em>$1</em>'); }
  function ajustar(nodo, texto, fuente, peso, anchoMax, base, minimo) {
    var tam = base;
    var hf = window.__hyperframes;
    if (hf && hf.fitTextFontSize) {
      tam = hf.fitTextFontSize(texto, { fontFamily: fuente, fontWeight: peso, maxWidth: anchoMax, baseFontSize: base, minFontSize: minimo || Math.round(base * 0.5) }).fontSize;
    }
    nodo.style.fontSize = tam + 'px';
    return tam;
  }
  var FUENTE_TITULO = (window.REEL_FUENTES || {}).titulo || 'Montserrat';
  var FUENTE_TEXTO = (window.REEL_FUENTES || {}).texto || 'Inter';
  var enfasis = {};
  (R.enfasis || []).forEach(function (p) { enfasis[clave(p)] = true; });
  function esEnfasis(texto) { var k = clave(texto); return !!enfasis[k] || /\d/.test(k); }

  // Momentos en pantalla completa ocultan los subtítulos mientras duran.
  var tapasSub = [];

  // ---------- íconos propios (SVG, trazo 2) ----------
  var ICONOS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    fuego: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2.5 1.5-4 2.5-5 .3 1.8 1.2 2.8 2.3 3.2C11 8.5 11.5 5.5 12 3z"/>',
    idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    estrella: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    corazon: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    dinero: '<path d="M12 3v18M16.5 7.5c-.8-1.3-2.5-2-4.5-2-2.5 0-4 1.3-4 3s1.5 2.6 4 3.1 4 1.4 4 3.2-1.8 3.2-4.2 3.2c-2 0-3.7-.8-4.5-2.2"/>',
    reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    grafica: '<path d="M4 19h16M7 16v-4M11 16V8M15 16v-6M19 16V5"/>',
    alerta: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>'
  };
  function icono(nombre, cls) {
    return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONOS[nombre] || ICONOS.estrella) + '</svg>';
  }

  // ---------- escenas (sin grabación): cada sección con su fondo, y un barrido entre secciones ----------
  // Si reel.js no trae "escenas", se arman solas: una al inicio y otra por cada momento "titulo".
  var FONDOS = ['manchas', 'rayos', 'rejilla', 'puntos', 'ondas', 'diagonal'];
  function textoPlano(s) { return String(s || '').replace(/\*/g, ''); }
  function decorativo(n) { n.setAttribute('data-layout-ignore', ''); return n; }
  function escenas() {
    var f = document.getElementById('fondo');
    if (CON_VIDEO || !f) return;
    var lista = R.escenas;
    if (!lista || !lista.length) {
      lista = [{ en: 0 }];
      (R.momentos || []).forEach(function (m) {
        // Palabra gigante de fondo: el número de la sección ("Paso 2" → "02") o, si no hay, el título.
        if (m.tipo === 'titulo' && m.en > 1.5) {
          var num = /\d+/.exec(textoPlano(m.texto));
          lista.push({ en: m.en, palabra: num ? ('0' + num[0]).slice(-2) : textoPlano(m.texto) });
        }
      });
    }
    lista = lista.slice().sort(function (a, b) { return a.en - b.en; });
    lista[0].en = 0;
    var capas = lista.map(function (e, i) {
      var desde = e.en, hasta = lista[i + 1] ? lista[i + 1].en : DUR;
      var capa = decorativo(el('div', 'escena', f));
      var tipo = FONDOS.indexOf(e.fondo) >= 0 ? e.fondo : FONDOS[i % FONDOS.length];
      FONDO[tipo](capa, desde, hasta - desde, i);
      if (e.palabra) palabraFondo(capa, e.palabra, desde, hasta - desde, i);
      gsap.set(capa, { visibility: i === 0 ? 'visible' : 'hidden' });
      if (i > 0) {
        tl.set(capa, { visibility: 'visible' }, desde);
        tl.set(capas_prev(i), { visibility: 'hidden' }, desde);
      }
      return capa;
    });
    function capas_prev(i) { return f.querySelectorAll('.escena')[i - 1]; }
    // Barrido: una franja de acento cruza la pantalla y tapa el cambio de fondo (los textos quedan encima).
    var barrido = decorativo(el('div', 'barrido', f));
    el('div', 'barrido-a', barrido); el('div', 'barrido-b', barrido);
    gsap.set(barrido, { xPercent: -130 });
    lista.slice(1).forEach(function (e) {
      tl.fromTo(barrido, { xPercent: -130 }, { xPercent: 0, duration: 0.28, ease: 'power3.in', immediateRender: false }, e.en - 0.28);
      tl.to(barrido, { xPercent: 130, duration: 0.32, ease: 'power3.out' }, e.en);
    });
    el('div', 'vineta', f);
  }
  function palabraFondo(capa, palabra, t0, d, i) {
    var p = el('div', 'palabra-fondo-texto f-titulo', capa, escapar(palabra.toUpperCase()));
    ajustar(p, palabra.toUpperCase(), FUENTE_TITULO, 900, W * 1.6, Math.round(420 * U), Math.round(200 * U));
    p.style.top = (H * (i % 2 ? 0.74 : 0.2)) + 'px';
    tl.fromTo(p, { x: (i % 2 ? -1 : 1) * 60 * U }, { x: (i % 2 ? 1 : -1) * 60 * U, duration: d, ease: 'none' }, t0);
  }
  var FONDO = {
    manchas: function (capa, t0, d) {
      [['acento', 0.18, 0.22, 0.9], ['suave', 0.82, 0.55, 0.75], ['acento', 0.35, 0.9, 0.7]].forEach(function (m, i) {
        var b = decorativo(el('div', 'mancha mancha-' + m[0], capa));
        var diam = W * m[3];
        b.style.width = diam + 'px'; b.style.height = diam + 'px';
        b.style.left = (W * m[1] - diam / 2) + 'px'; b.style.top = (H * m[2] - diam / 2) + 'px';
        tl.fromTo(b, { x: 0, y: 0 }, { x: (i % 2 ? -1 : 1) * 110 * U, y: (i % 2 ? 1 : -1) * 150 * U, duration: d, ease: 'sine.inOut' }, t0);
      });
      el('div', 'rejilla', capa);
    },
    rayos: function (capa, t0, d) {
      var r = decorativo(el('div', 'rayos', capa));
      var lado = Math.hypot(W, H) * 1.2;
      r.style.width = lado + 'px'; r.style.height = lado + 'px';
      r.style.left = (W - lado) / 2 + 'px'; r.style.top = (H * 0.4 - lado / 2) + 'px';
      tl.fromTo(r, { rotation: 0 }, { rotation: 12 * d, duration: d, ease: 'none' }, t0);
    },
    rejilla: function (capa, t0, d) {
      el('div', 'cielo', capa);
      var piso = decorativo(el('div', 'piso', capa));
      tl.fromTo(piso, { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px ' + Math.round(120 * d) + 'px', duration: d, ease: 'none' }, t0);
    },
    puntos: function (capa, t0, d) {
      var p = el('div', 'puntos', capa);
      tl.fromTo(p, { backgroundPosition: '0px 0px' }, { backgroundPosition: Math.round(40 * d) + 'px ' + Math.round(-60 * d) + 'px', duration: d, ease: 'none' }, t0);
      el('div', 'puntos-luz', capa);
    },
    ondas: function (capa, t0, d) {
      var ciclo = 2.4, n = 4;
      for (var k = 0; k < n; k++) {
        var o = decorativo(el('div', 'onda', capa));
        var vueltas = Math.max(0, Math.floor((d - k * ciclo / n) / ciclo) - 1);
        tl.fromTo(o, { scale: 0.1, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: ciclo, ease: 'power1.out', repeat: vueltas }, t0 + k * ciclo / n);
      }
    },
    diagonal: function (capa, t0, d) {
      var b = decorativo(el('div', 'diagonal', capa));
      tl.fromTo(b, { xPercent: -4 }, { xPercent: 4, duration: d, ease: 'none' }, t0);
      el('div', 'rejilla', capa);
    }
  };

  // ---------- cámara: acercamiento lento + saltos de zoom en cada frase ----------
  function camara() {
    if (!CON_VIDEO) return;
    var cam = document.getElementById('camara');
    var golpe = document.getElementById('golpe');
    tl.fromTo(cam, { scale: 1 }, { scale: 1.06, duration: DUR, ease: 'none' }, 0);
    if (R.video.saltosZoom === false) return;
    // Alterna 1 ↔ 1.12 al empezar cada frase: da ritmo sin cortar la grabación.
    var cerca = false;
    PAL.forEach(function (p, i) {
      if (i === 0) return;
      if (/[.?!…]$/.test(PAL[i - 1].text)) {
        cerca = !cerca;
        tl.set(golpe, { scale: cerca ? 1.12 : 1 }, p.start);
      }
    });
  }

  // ---------- barra de progreso ----------
  function barra() {
    if (R.barraProgreso === false) return;
    var b = el('div', 'barra');
    var r = el('div', 'barra-relleno', b);
    tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' }, 0);
  }

  // ---------- marca de agua ----------
  function marcaDeAgua() {
    var m = R.marca || {};
    if (R.marcaDeAgua === false || !m.usuario) return;
    var w = el('div', 'agua f-texto', null, (window.REEL_LOGO ? '<img src="' + window.REEL_LOGO + '" alt="">' : '') + '<span>' + escapar(m.usuario) + '</span>');
    tl.fromTo(w, { opacity: 0 }, { opacity: 0.9, duration: 0.4 }, 0.3);
    if (R.cta) tl.to(w, { opacity: 0, duration: 0.3 }, ctaInicio());
  }

  // ---------- subtítulos ----------
  var ESTILOS_SUB = {
    pop:        { max: 3, fuente: 'titulo', base: 92, mayus: true },
    caja:       { max: 4, fuente: 'titulo', base: 74, mayus: true },
    resaltador: { max: 4, fuente: 'texto',  base: 70, mayus: false },
    minimal:    { max: 5, fuente: 'texto',  base: 66, mayus: false },
    impacto:    { max: 2, fuente: 'titulo', base: 150, mayus: true },
    editorial:  { max: 5, fuente: 'editorial', base: 78, mayus: false }
  };
  function agrupar(palabras, max) {
    var g = [], cur = [];
    palabras.forEach(function (p, i) {
      var prev = palabras[i - 1];
      if (cur.length && prev) {
        var pausa = p.start - prev.end;
        var corte = cur.length >= max || pausa > 0.35 || /[.?!…]$/.test(prev.text) || (/[,;:]$/.test(prev.text) && cur.length >= 2);
        if (corte) { g.push(cur); cur = []; }
      }
      cur.push(p);
    });
    if (cur.length) g.push(cur);
    // Una palabra sola al final de una frase ("…es muy | simple.") se lee como un error de corte:
    // se une al grupo anterior si este no cerraba una frase y no hubo pausa entre medio.
    for (var i = g.length - 1; i > 0; i--) {
      var ant = g[i - 1], ult = ant[ant.length - 1];
      if (g[i].length === 1 && ant.length <= max && !/[.?!…]$/.test(ult.text) && g[i][0].start - ult.end < 0.35) {
        g[i - 1] = ant.concat(g[i]);
        g.splice(i, 1);
      }
    }
    return g;
  }
  function subtitulos() {
    if (R.subtitulos === false || !PAL.length) return;   // false = sin subtítulos
    var cfgSub = R.subtitulos || {};
    var nombre = ESTILOS_SUB[cfgSub.estilo] ? cfgSub.estilo : 'pop';
    var est = ESTILOS_SUB[nombre];
    var max = cfgSub.palabrasPorGrupo || est.max;
    var caja = el('div', 'subs sub-' + nombre);
    var y = cfgSub.altura != null ? cfgSub.altura : (V ? 0.64 : 0.8);
    caja.style.top = (H * y) + 'px';
    var familia = est.fuente === 'titulo' ? FUENTE_TITULO : est.fuente === 'texto' ? FUENTE_TEXTO : 'Playfair Display';
    var clsFuente = est.fuente === 'titulo' ? 'f-titulo' : est.fuente === 'texto' ? 'f-texto' : 'f-editorial';
    var anchoMax = (V ? 0.84 : 0.7) * W * 0.86;   // margen para la palabra activa, que crece un 18 %
    var gs = agrupar(PAL, max);
    var fin = R.cta ? ctaInicio() : DUR;

    gs.forEach(function (g, gi) {
      var ini = Math.max(0, g[0].start - 0.04);
      if (ini >= fin) return;
      var sig = gs[gi + 1];
      var hasta = Math.min(sig ? sig[0].start - 0.02 : DUR, g[g.length - 1].end + 0.7, fin);
      var nodo = el('div', 'grupo ' + clsFuente, caja);
      var texto = g.map(function (p) { return p.text; }).join(' ');
      g.forEach(function (p, i) {
        var t = est.mayus ? p.text.toUpperCase() : p.text;
        var w = el('span', 'w' + (esEnfasis(p.text) ? ' enf' : ''), nodo, escapar(t));
        nodo.appendChild(document.createTextNode(i < g.length - 1 ? ' ' : ''));
        var hastaPal = g[i + 1] ? g[i + 1].start : hasta;
        var base = 'w' + (esEnfasis(p.text) ? ' enf' : '');
        tl.set(w, { attr: { class: base + ' on' } }, Math.max(ini, p.start));
        if (hastaPal < hasta) tl.set(w, { attr: { class: base + ' dicho' } }, hastaPal);
        // immediateRender: false → las palabras que aún no se dicen quedan a tamaño normal (si no, se enciman).
        if (nombre === 'pop' || nombre === 'caja') tl.fromTo(w, { scale: 1.12 }, { scale: 1, duration: 0.16, ease: 'power2.out', immediateRender: false }, Math.max(ini, p.start));
        if (nombre === 'resaltador') tl.fromTo(w, { backgroundSize: '0% 48%' }, { backgroundSize: '100% 48%', duration: 0.18, ease: 'power2.out', immediateRender: false }, Math.max(ini, p.start));
      });
      // Achica hasta un 22 % para caber en una línea; si aun así no cabe, pasa a dos líneas (se lee mejor que un texto diminuto).
      var tamGrupo = ajustar(nodo, est.mayus ? texto.toUpperCase() : texto, familia, 900, anchoMax, Math.round(est.base * U * (V ? 1 : 0.85)), Math.round(est.base * U * (V ? 1 : 0.85) * 0.78));
      // Una palabra larga sola ("PUBLICACIONES") no puede pasar a dos líneas: se achica hasta que quepa.
      var larga = g.reduce(function (acc, p) { return p.text.length > acc.length ? p.text : acc; }, '');
      ajustar(nodo, est.mayus ? larga.toUpperCase() : larga, familia, 900, anchoMax, tamGrupo, Math.round(tamGrupo * 0.5));
      if (nombre === 'impacto') {
        tl.fromTo(nodo, { opacity: 0, scale: 1.35, rotation: gi % 2 ? 2 : -2 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.18, ease: 'back.out(2.2)' }, ini);
      } else if (nombre === 'minimal' || nombre === 'editorial') {
        tl.fromTo(nodo, { opacity: 0, y: 14 * U }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, ini);
      } else {
        tl.fromTo(nodo, { opacity: 0, y: 24 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: 'back.out(2)' }, ini);
      }
      tl.to(nodo, { opacity: 0, duration: 0.08 }, hasta - 0.08);
      tl.set(nodo, { opacity: 0, visibility: 'hidden' }, hasta);
    });
    tapasSub.forEach(function (r) {
      tl.to(caja, { opacity: 0, duration: 0.1 }, r[0]);
      tl.to(caja, { opacity: 1, duration: 0.15 }, r[1]);
    });
  }

  // ---------- gancho (título de los primeros segundos) ----------
  function gancho() {
    var g = R.gancho;
    if (!g || !g.texto) return;
    var desde = g.desde || 0, hasta = g.hasta || 3;
    var caja = el('div', 'gancho f-titulo');
    caja.style.top = (H * (V ? 0.13 : 0.1)) + 'px';
    if (g.etiqueta) el('div', 'gancho-etiqueta f-texto', caja, escapar(g.etiqueta));
    var t = el('div', 'gancho-texto', caja, rico(g.texto));
    ajustar(t, g.texto.replace(/\*/g, ''), FUENTE_TITULO, 900, (V ? 0.86 : 0.7) * W * 1.9, Math.round((V ? 96 : 84) * U), Math.round(56 * U));
    var partes = [];
    t.childNodes.forEach(function (n) { partes.push(n); });
    // Envuelve palabra por palabra para que entren escalonadas.
    t.innerHTML = '';
    var i = 0;
    partes.forEach(function (n) {
      // Un *énfasis* entra como un solo bloque; el resto, palabra por palabra.
      var trozos = n.nodeName === 'EM' ? [n.textContent.trim()] : String(n.textContent).split(/(\s+)/);
      trozos.forEach(function (pedazo) {
        if (!pedazo) return;
        if (/^\s+$/.test(pedazo)) { t.appendChild(document.createTextNode(' ')); return; }
        var s = el('span', 'gw' + (n.nodeName === 'EM' ? ' em' : ''), t, escapar(pedazo));
        tl.fromTo(s, { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }, desde + 0.05 + i * 0.06);
        i++;
      });
    });
    tl.to(caja, { opacity: 0, y: -30 * U, duration: 0.3, ease: 'power2.in' }, hasta - 0.3);
    tl.set(caja, { visibility: 'hidden' }, hasta);
  }

  // ---------- momentos ----------
  function tarjeta(m, cls) {
    var c = el('div', 'momento ' + cls + (CON_VIDEO ? ' sobre-video' : ''));
    c.style.top = (H * (m.altura != null ? m.altura : (V ? 0.36 : 0.42))) + 'px';
    return c;
  }
  function entradaSalida(nodo, m, dur, desdeY) {
    tl.fromTo(nodo, { opacity: 0, y: (desdeY == null ? 60 : desdeY) * U, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, m.en);
    tl.to(nodo, { opacity: 0, y: -20 * U, duration: 0.25, ease: 'power2.in' }, m.en + dur - 0.25);
    tl.set(nodo, { visibility: 'hidden' }, m.en + dur);
  }
  // Cuándo aparece cada elemento de una lista: su propio "en", o repartidos a lo largo del momento.
  // (armar.mjs usa la misma cuenta para poner un sonido en cada uno.)
  function tiemposLista(m, items, dur, inicio) {
    var ini = inicio != null ? inicio : 0.35;
    return items.map(function (it, i) {
      return it && typeof it === 'object' && it.en != null ? it.en : m.en + ini + i * ((dur - 0.9) / Math.max(1, items.length));
    });
  }
  // La tarjeta crece a medida que entra cada elemento, en vez de reservar desde el inicio
  // el hueco de lo que todavía no aparece. El alto se mide una vez (ya con las fuentes cargadas).
  // (Solo se anima la altura: HyperFrames rechaza animar márgenes. Cada elemento oculto reserva
  // apenas su separación, no su alto completo.)
  function crecer(nodo, t, espacio) {
    var alto = nodo.offsetHeight;
    nodo.style.overflow = 'hidden';
    nodo.style.boxSizing = 'content-box';
    nodo.style.paddingTop = (espacio * U) + 'px';
    tl.fromTo(nodo, { height: 0 }, { height: alto, duration: 0.22, ease: 'power2.out' }, t - 0.06);
  }
  var MOMENTOS = {
    cifra: function (m) {
      var dur = m.dur || 2.2;
      var c = tarjeta(m, 'm-cifra');
      var num = el('div', 'cifra-num f-titulo', c, escapar(m.texto));
      if (m.detalle) el('div', 'cifra-detalle f-texto', c, rico(m.detalle));
      ajustar(num, m.texto, FUENTE_TITULO, 900, W * 0.8, Math.round(230 * U), Math.round(120 * U));
      entradaSalida(c, m, dur);
      // Cuenta desde 0 si la cifra es un número ("90%", "$1.200", "3x").
      var mt = /^([^\d]*)([\d.,]+)(.*)$/.exec(m.texto);
      if (mt && m.contar !== false) {
        var valor = parseFloat(mt[2].replace(/\./g, '').replace(',', '.'));
        var decimales = (mt[2].split(',')[1] || '').length;
        var o = { v: 0 };
        tl.fromTo(o, { v: 0 }, { v: valor, duration: Math.min(1.2, dur * 0.5), ease: 'power2.out', onUpdate: function () {
          var n = o.v.toFixed(decimales).replace('.', ',');
          num.textContent = mt[1] + n.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + mt[3];
        } }, m.en);
      }
    },
    palabra: function (m) {
      var dur = m.dur || 1.2;
      var c = el('div', 'momento m-palabra');
      var bg = el('div', 'palabra-fondo', c);
      var t = el('div', 'palabra-texto f-titulo', c, escapar(m.texto));
      ajustar(t, m.texto.toUpperCase(), FUENTE_TITULO, 900, W * 0.86, Math.round(260 * U), Math.round(90 * U));
      tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.08 }, m.en);
      tl.fromTo(t, { scale: 1.7, rotation: -4, opacity: 0 }, { scale: 1, rotation: -2, opacity: 1, duration: 0.22, ease: 'back.out(2.5)' }, m.en);
      tl.to(t, { scale: 1.06, duration: dur - 0.4, ease: 'none' }, m.en + 0.22);
      tl.to(c, { opacity: 0, duration: 0.15 }, m.en + dur - 0.15);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
      tapasSub.push([m.en, m.en + dur]);
    },
    lista: function (m) {
      var items = m.items || [];
      var dur = m.dur || Math.max(2.5, items.length * 1.2 + 1);
      var c = tarjeta(m, 'm-lista');
      if (m.titulo) el('div', 'lista-titulo f-titulo', c, rico(m.titulo));
      var tiempos = tiemposLista(m, items, dur);
      items.forEach(function (it, i) {
        var txt = typeof it === 'string' ? it : it.texto;
        var en = tiempos[i];
        var marca = m.numerada ? '<em class="lista-num f-titulo">' + (i + 1) + '</em>' : icono(m.icono || 'check');
        var fila = el('div', 'lista-item f-texto', c, '<b>' + marca + '</b><span>' + rico(txt) + '</span>');
        crecer(fila, en, i === 0 && !m.titulo ? 0 : 18);
        tl.fromTo(fila, { opacity: 0, x: -50 * U }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, en);
      });
      entradaSalida(c, m, dur, 30);
    },
    imagen: function (m) {
      var dur = m.dur || 2.5;
      var c = tarjeta(m, 'm-imagen');
      var img = el('img', 'imagen-img', c);
      img.src = m.src;
      // Alto máximo: la tarjeta termina antes de la línea de subtítulos.
      img.style.maxHeight = Math.round(H * (V ? 0.3 : 0.45) - (m.texto ? 70 * U : 0)) + 'px';
      if (m.texto) el('div', 'imagen-pie f-texto', c, rico(m.texto));
      tl.fromTo(c, { opacity: 0, y: 200 * U, rotation: 4 }, { opacity: 1, y: 0, rotation: -1.5, duration: 0.45, ease: 'power3.out' }, m.en);
      tl.to(c, { opacity: 0, y: -40 * U, duration: 0.25, ease: 'power2.in' }, m.en + dur - 0.25);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
    },
    titulo: function (m) {
      var dur = m.dur || 2;
      var c = tarjeta(m, 'm-titulo');
      if (m.altura == null) c.style.top = (H * (V ? 0.2 : 0.14)) + 'px';
      var p = el('div', 'titulo-pildora f-titulo', c, rico(m.texto));
      tl.fromTo(p, { clipPath: 'inset(0 100% 0 0 round 999px)' }, { clipPath: 'inset(0 0% 0 0 round 999px)', duration: 0.35, ease: 'power3.out' }, m.en);
      tl.to(p, { opacity: 0, duration: 0.2 }, m.en + dur - 0.2);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
    },
    icono: function (m) {
      var dur = m.dur || 1.4;
      var c = tarjeta(m, 'm-icono');
      var aro = el('div', 'icono-aro', c);
      var i = el('div', 'icono-circulo', c, icono(m.icono || m.texto || 'estrella'));
      tl.fromTo(i, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(2.4)' }, m.en);
      gsap.set(aro, { opacity: 0 });
      tl.fromTo(aro, { scale: 0.6, opacity: 0.9 }, { scale: 1.8, opacity: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, m.en + 0.05);
      tl.to(i, { scale: 0, duration: 0.2, ease: 'power2.in' }, m.en + dur - 0.2);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
    },
    chat: function (m) {
      // Conversación tipo DM/WhatsApp: los mensajes de "ellos" van precedidos por "escribiendo…".
      var msgs = m.mensajes || [];
      var dur = m.dur || Math.max(3, msgs.length * 1.4 + 1);
      var c = tarjeta(m, 'm-chat');
      var nombre = m.nombre || 'Cliente';
      el('div', 'chat-cab f-texto', c, '<b>' + escapar(nombre.charAt(0).toUpperCase()) + '</b><span>' + escapar(nombre) + '<i>en línea</i></span>');
      var cuerpo = el('div', 'chat-cuerpo f-texto', c);
      tiemposLista(m, msgs, dur).forEach(function (t, i) {
        var ms = msgs[i], yo = ms.de === 'yo';
        // La fila es la que crece; la burbuja va adentro y conserva su forma.
        var fila = el('div', 'burbuja-fila ' + (yo ? 'yo' : 'ellos'), cuerpo);
        var b = el('div', 'burbuja ' + (yo ? 'yo' : 'ellos'), fila);
        var txt = el('span', 'burbuja-texto', b, rico(ms.texto));
        var escribe = !yo && t - 0.7 > m.en + 0.3;
        crecer(fila, escribe ? t - 0.7 : t, i === 0 ? 0 : 16);
        if (escribe) {
          var puntos = el('span', 'escribiendo', b, '<i></i><i></i><i></i>');
          tl.fromTo(b, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, t - 0.7);
          tl.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t);
          tl.set(puntos, { opacity: 0 }, t);
        } else {
          tl.fromTo(b, { opacity: 0, y: 24 * U, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(2)' }, t);
        }
      });
      entradaSalida(c, m, dur, 40);
    },
    comparar: function (m) {
      // Dos columnas: lo que no funciona (x) contra lo que sí (check).
      var dur = m.dur || 4;
      var c = tarjeta(m, 'm-comparar');
      var mal = m.mal || {}, bien = m.bien || {};
      [['mal', mal, 'x', mal.en != null ? mal.en : m.en + 0.15], ['bien', bien, 'check', bien.en != null ? bien.en : m.en + Math.min(1.4, dur * 0.35)]].forEach(function (lado) {
        var col = el('div', 'comp-col comp-' + lado[0], c);
        el('div', 'comp-titulo f-titulo', col, icono(lado[2]) + '<span>' + rico(lado[1].titulo || (lado[0] === 'mal' ? 'Antes' : 'Después')) + '</span>');
        (lado[1].items || []).forEach(function (it, i) {
          var fila = el('div', 'comp-item f-texto', col, rico(it));
          tl.fromTo(fila, { opacity: 0, y: 16 * U }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, lado[3] + 0.25 + i * 0.3);
        });
        tl.fromTo(col, { opacity: 0, x: (lado[0] === 'mal' ? -40 : 40) * U }, { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' }, lado[3]);
      });
      entradaSalida(c, m, dur, 30);
    },
    grafica: function (m) {
      // Barras que crecen; la destacada va en color de acento.
      var barras = m.barras || [];
      var dur = m.dur || 3.5;
      var c = tarjeta(m, 'm-grafica');
      if (m.titulo) el('div', 'graf-titulo f-titulo', c, rico(m.titulo));
      var zona = el('div', 'graf-zona', c);
      var max = Math.max.apply(null, barras.map(function (b) { return b.valor; }).concat([1]));
      var dest = m.destacar != null ? m.destacar : barras.length - 1;
      barras.forEach(function (b, i) {
        var col = el('div', 'graf-col' + (i === dest ? ' dest' : ''), zona);
        var num = el('div', 'graf-num f-titulo', col, '0');
        var pista = el('div', 'graf-pista', col);
        var barra = el('div', 'graf-barra', pista);
        barra.style.height = Math.max(3, 100 * b.valor / max) + '%';
        el('div', 'graf-etq f-texto', col, escapar(b.etiqueta || ''));
        var t = m.en + 0.35 + i * 0.18;
        tl.fromTo(barra, { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'power3.out' }, t);
        var o = { v: 0 };
        tl.fromTo(o, { v: 0 }, { v: b.valor, duration: 0.7, ease: 'power3.out', onUpdate: function () {
          num.textContent = (m.prefijo || '') + Math.round(o.v).toLocaleString('es') + (m.unidad || '');
        } }, t);
      });
      entradaSalida(c, m, dur, 40);
    },
    notificacion: function (m) {
      // Notificaciones del celular que caen una tras otra (ventas, seguidores, mensajes).
      var items = m.items || [{ titulo: m.titulo, texto: m.texto }];
      var dur = m.dur || Math.max(2.5, items.length * 0.9 + 1.4);
      var c = tarjeta(m, 'm-notif');
      if (m.altura == null) c.style.top = (H * (V ? 0.3 : 0.4)) + 'px';
      tiemposLista(m, items, dur, 0.15).forEach(function (t, i) {
        var it = items[i];
        var n = el('div', 'notif f-texto', c, '<b class="notif-ico">' + icono(it.icono || m.icono || 'estrella') + '</b>' +
          '<div class="notif-cuerpo"><div class="notif-cab"><span>' + escapar(it.app || m.app || 'App') + '</span><i>ahora</i></div>' +
          '<div class="notif-titulo">' + rico(it.titulo || '') + '</div><div class="notif-texto">' + rico(it.texto || '') + '</div></div>');
        tl.fromTo(n, { opacity: 0, y: -60 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, t);
      });
      tl.to(c, { opacity: 0, y: -30 * U, duration: 0.25, ease: 'power2.in' }, m.en + dur - 0.25);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
    },
    cita: function (m) {
      var dur = m.dur || 3;
      var c = tarjeta(m, 'm-cita');
      el('div', 'cita-comillas f-editorial', c, '\u201C');
      var t = el('div', 'cita-texto f-editorial', c, rico(m.texto));
      ajustar(t, textoPlano(m.texto), 'Playfair Display', 500, W * 0.8 * 3, Math.round(70 * U), Math.round(44 * U));
      if (m.autor) el('div', 'cita-autor f-texto', c, '\u2014 ' + escapar(m.autor));
      entradaSalida(c, m, dur, 30);
    },
    emoji: function (m) {
      // El SVG lo descarga armar.mjs (Twemoji) y lo deja en m.src.
      if (!m.src) return;
      var dur = m.dur || 1.4;
      var c = tarjeta(m, 'm-emoji');
      var img = el('img', 'emoji-img', c);
      img.src = m.src;
      tl.fromTo(img, { scale: 0, rotation: -25 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.6)' }, m.en);
      tl.to(img, { y: -18 * U, rotation: 6, duration: Math.max(0.2, dur - 0.6), ease: 'sine.inOut' }, m.en + 0.4);
      tl.to(img, { scale: 0, duration: 0.2, ease: 'power2.in' }, m.en + dur - 0.2);
      tl.set(c, { visibility: 'hidden' }, m.en + dur);
    },
    zoom: function (m) {
      if (!CON_VIDEO) return;
      var dur = m.dur || 1.5;
      var z = document.getElementById('zoom');
      tl.to(z, { scale: m.escala || 1.25, duration: 0.25, ease: 'power3.out' }, m.en);
      tl.to(z, { scale: 1, duration: 0.3, ease: 'power3.inOut' }, m.en + dur - 0.3);
    }
  };
  function momentos() {
    var lista = (R.momentos || []).slice().sort(function (a, b) { return a.en - b.en; });
    // Un título se retira cuando entra el siguiente momento con tarjeta: si no, queda asomando detrás.
    lista.forEach(function (m, i) {
      var sig = lista.slice(i + 1).find(function (n) { return n.tipo !== 'zoom' && n.tipo !== 'emoji'; });
      if (m.tipo === 'titulo' && sig && sig.en - m.en < (m.dur || 2)) m.dur = Math.max(0.6, sig.en - m.en);
    });
    lista.forEach(function (m) {
      if (MOMENTOS[m.tipo]) MOMENTOS[m.tipo](m);
      else console.warn('[reels-animados] tipo de momento desconocido: ' + m.tipo);
    });
  }

  // ---------- llamado a la acción ----------
  function ctaInicio() { return R.cta.en != null ? R.cta.en : Math.max(0, DUR - 3); }
  function cta() {
    var c = R.cta;
    if (!c) return;
    var en = ctaInicio();
    var m = R.marca || {};
    var panel = el('div', 'cta' + (CON_VIDEO ? ' cta-video' : ''));
    var dentro = el('div', 'cta-dentro', panel);
    if (window.REEL_LOGO) el('img', 'cta-logo', dentro).src = window.REEL_LOGO;
    if (m.usuario) el('div', 'cta-usuario f-texto', dentro, escapar(m.usuario));
    var t = el('div', 'cta-texto f-titulo', dentro, rico(c.texto || 'Sígueme para más'));
    ajustar(t, (c.texto || '').replace(/\*/g, ''), FUENTE_TITULO, 900, W * 0.8 * 2, Math.round(84 * U), Math.round(52 * U));
    var accion = { seguir: [icono('mas'), 'Seguir'], comentar: [icono('flecha'), 'Comenta ' + (c.palabraClave || '')], guardar: [icono('estrella'), 'Guárdalo'], enlace: [icono('flecha'), c.boton || 'Link en mi perfil'] }[c.accion || 'seguir'];
    var btn = el('div', 'cta-boton f-titulo', dentro, accion[0] + '<span>' + escapar(accion[1]) + '</span>');
    tl.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, en);
    tl.fromTo(dentro.children, { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power3.out' }, en + 0.25);
    var resto = DUR - (en + 1);
    var pulsos = Math.max(0, Math.floor(resto / 0.9) - 1);
    if (resto > 1) tl.fromTo(btn, { scale: 1 }, { scale: 1.07, duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: pulsos % 2 ? pulsos : Math.max(0, pulsos - 1) }, en + 1);
  }

  // ---------- música: se desvanece al final ----------
  function musica() {
    var a = document.getElementById('musica');
    if (!a) return;
    var v = +(a.getAttribute('data-volume') || 0.12);
    tl.fromTo(a, { volume: v }, { volume: 0, duration: 1.5, ease: 'none' }, Math.max(0, DUR - 1.6));
  }

  function construir() {
    escenas();
    camara();
    barra();
    marcaDeAgua();
    gancho();
    momentos();      // antes de los subtítulos: registra qué tramos los tapan
    subtitulos();
    cta();
    musica();
    window.__timelines['reel'] = tl;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(construir);
  else construir();
})();
