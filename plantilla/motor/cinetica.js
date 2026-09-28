/* reels-animados · estilos «monocromo» y «cine»: la tipografía sigue a la voz, palabra por palabra.
 * armar.mjs ya calculó cuándo se dice cada palabra (window.REEL.escenas[].lineas[].palabras[].t);
 * aquí solo se dibuja y se anima. El tema llega en window.REEL_TEMA.
 *   monocromo · papel blanco con viñeta, sans gruesa que pasa de gris a negro, imágenes en blanco y
 *               negro que entran desenfocadas, píldoras, tachados y cierre en negro con destello.
 *   cine      · fondo negro (o crema), serif fina mezclada con sans, palabras con brillo de neón,
 *               íconos que brillan, trazo a mano y transiciones que vuelan a través del texto.
 */
(function () {
  var R = window.REEL || {};
  var TEMA = window.REEL_TEMA === 'cine' ? 'cine' : 'monocromo';
  var CINE = TEMA === 'cine';
  var root = document.getElementById('root');
  var W = +root.getAttribute('data-width');
  var H = +root.getAttribute('data-height');
  var DUR = +root.getAttribute('data-duration');
  var U = Math.min(W, H) / 1080;
  var tl = gsap.timeline({ paused: true });
  var cont = document.getElementById('escenas');
  var OPC = R[TEMA] || {};
  document.body.classList.add('t-' + TEMA);

  function el(tag, cls, padre, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    padre.appendChild(e);
    return e;
  }
  var BRILLOS = { verde: '#46FF8C', amarillo: '#FFE94A', violeta: '#B18CFF', rosa: '#FF6FD8', azul: '#5FC8FF', naranja: '#FF9A3D', blanco: '#FFFFFF' };
  function brillo(c) { return BRILLOS[c] || c || BRILLOS.verde; }
  var TAM = CINE ? { chica: 60, media: 96, grande: 140, gigante: 215 } : { chica: 44, media: 74, grande: 134, gigante: 228 };

  // ---------- palabras ----------
  function animarPalabra(s, t) {
    gsap.set(s, { opacity: 0 });
    if (CINE) {
      tl.fromTo(s, { opacity: 0, filter: 'blur(16px)', scale: 1.14 },
        { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 0.42, ease: 'power2.out', immediateRender: false }, Math.max(0, t - 0.12));
    } else {
      // Entra gris claro y desenfocada justo antes de decirse; al decirse se oscurece.
      var final = getComputedStyle(s).color;
      tl.fromTo(s, { opacity: 0, filter: 'blur(10px)', y: 16 * U, color: '#C9C7C2' },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.32, ease: 'power2.out', immediateRender: false }, Math.max(0, t - 0.24));
      tl.to(s, { color: final, duration: 0.3, ease: 'power1.out' }, t);
    }
  }
  function tachar(s, t) {
    var r = el('span', 'ci-tachado', s);
    gsap.set(r, { scaleX: 0 });
    tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.32, ease: 'power2.inOut', immediateRender: false }, t + 0.4);
  }
  var TRAZOS = ['M4 24 C 40 8, 90 34, 140 16 S 190 10, 196 22', 'M4 18 C 50 34, 110 6, 160 24 S 188 30, 196 14'];
  var nTrazo = 0;
  function subrayar(s, t, color) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ci-trazo');
    svg.setAttribute('viewBox', '0 0 200 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', TRAZOS[nTrazo++ % TRAZOS.length]);
    svg.appendChild(p);
    s.appendChild(svg);
    s.style.setProperty('--c-brillo', color);
    var largo = 240;
    p.setAttribute('stroke-dasharray', largo);
    gsap.set(p, { strokeDashoffset: largo });
    tl.fromTo(p, { strokeDashoffset: largo }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, t + 0.25);
  }

  // ---------- imagen ----------
  var ENTRADAS = {
    enfoque: function () { return { from: { opacity: 0, scale: 1.35, filter: 'blur(34px)' }, dur: 0.8, ease: 'expo.out' }; },
    izquierda: function (I) { return { from: { opacity: 0, x: -0.8 * W, rotation: (I.rotar || 0) - 14, filter: 'blur(26px)' }, dur: 0.65, ease: 'expo.out' }; },
    derecha: function (I) { return { from: { opacity: 0, x: 0.8 * W, rotation: (I.rotar || 0) + 14, filter: 'blur(26px)' }, dur: 0.65, ease: 'expo.out' }; },
    abajo: function () { return { from: { opacity: 0, y: 0.5 * H, filter: 'blur(26px)' }, dur: 0.7, ease: 'expo.out' }; },
    arriba: function () { return { from: { opacity: 0, y: -0.5 * H, filter: 'blur(26px)' }, dur: 0.7, ease: 'expo.out' }; },
    girar: function () { return { from: { opacity: 0, rotationY: -110, scale: 0.7, filter: 'blur(8px)' }, dur: 0.75, ease: 'back.out(1.3)' }; },
    caer: function (I) { return { from: { opacity: 0, y: -0.4 * H, rotation: (I.rotar || 0) - 25 }, dur: 0.7, ease: 'back.out(1.5)' }; },
  };
  function imagen(I, capa, t0, t1) {
    var w = (I.ancho || (CINE ? 0.34 : 0.72)) * W;
    var wrap = el('div', 'ci-img' + (I.color ? ' a-color' : '') + (CINE && I.brillo === false ? ' sin-brillo' : ''), capa);
    wrap.style.width = w + 'px';
    wrap.style.left = (I.x != null ? I.x : 0.5) * W + 'px';
    wrap.style.top = (I.y != null ? I.y : CINE ? 0.3 : 0.62) * H + 'px';
    var der = el('div', 'ci-deriva', wrap);
    var img = el('img', null, der);
    img.src = I.src;
    var c = brillo(I.brillo);
    if (CINE) {
      wrap.style.setProperty('--c-brillo', c);
      if (I.brillo !== false) {
        var halo = el('div', 'ci-halo', capa);
        gsap.set(halo, { width: w * 1.5, height: w * 1.5, left: (I.x != null ? I.x : 0.5) * W - w * 0.75, top: (I.y != null ? I.y : 0.3) * H - w * 0.75, background: 'radial-gradient(circle, ' + c + ' 0%, transparent 65%)' });
        tl.fromTo(halo, { opacity: 0 }, { opacity: 0.32, duration: 0.6, immediateRender: false }, (I.en != null ? I.en : t0) + 0.1);
      }
    }
    gsap.set(wrap, { xPercent: -50, yPercent: -50, rotation: I.rotar || 0, transformPerspective: 900, opacity: 0 });
    var t = I.en != null ? I.en : t0 + 0.05;
    var e = (ENTRADAS[I.entrada] || ENTRADAS.enfoque)(I);
    var hacia = { opacity: 1, x: 0, y: 0, rotation: I.rotar || 0, rotationY: 0, scale: 1, filter: 'blur(0px)', duration: e.dur, ease: e.ease, immediateRender: false };
    tl.fromTo(wrap, e.from, hacia, t);
    // Deriva lenta: la cámara sigue acercándose mientras la imagen está en pantalla.
    tl.fromTo(der, { scale: 1 }, { scale: I.deriva != null ? I.deriva : 1.07, duration: Math.max(0.5, t1 - t), ease: 'none', immediateRender: false }, t);
    if (I.sale != null) tl.to(wrap, { opacity: 0, filter: 'blur(20px)', duration: 0.3 }, I.sale);
  }

  // ---------- portada (cine): papel crema con aspas negras en las esquinas ----------
  function aspas(capa, t0, t1, x, y, giro) {
    var g = el('div', null, capa);
    g.style.position = 'absolute'; g.style.left = x + 'px'; g.style.top = y + 'px';
    for (var k = 0; k < 4; k++) {
      var a = el('div', 'ci-aspa', g);
      gsap.set(a, { width: 64 * U, height: 250 * U, xPercent: -50, yPercent: -100, rotation: k * 90 + 20, transformOrigin: '50% 100%' });
    }
    tl.fromTo(g, { rotation: giro, scale: 0.6, opacity: 0 }, { rotation: giro + 40, scale: 1, opacity: 1, duration: t1 - t0, ease: 'power1.out', immediateRender: false }, t0);
  }

  // ---------- cierre (monocromo): destello, fondo oscuro y marca que aparece letra por letra ----------
  function cierre(E, capa, t0) {
    var C = E.cierre || {};
    var fondo = el('div', 'capa', capa);
    fondo.style.background = 'radial-gradient(70% 50% at 50% 46%, #2A2624 0%, #151312 55%, #0B0A0A 100%)';
    var caja = el('div', 'ci-cierre', capa);
    caja.style.fontSize = 120 * U + 'px';
    if (window.REEL_LOGO && C.logo !== false) {
      var lg = el('img', 'c-logo', caja);
      lg.src = window.REEL_LOGO;
      tl.fromTo(lg, { opacity: 0, scale: 0.7, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out', immediateRender: false }, t0 + 0.1);
      gsap.set(lg, { opacity: 0 });
    }
    var nombre = C.nombre === false ? '' : C.nombre || (R.marca && R.marca.nombre) || '';
    var n = el('div', 'c-nombre', caja);
    n.style.fontSize = 104 * U + 'px';
    var resaltar = C.resaltar || null;   // letras del nombre en color de acento, p. ej. resaltar: 'IA'
    var ini = resaltar ? nombre.indexOf(resaltar) : -1;
    var letras = [];
    nombre.split('').forEach(function (ch, i) {
      var s = el(i >= ini && ini >= 0 && i < ini + resaltar.length ? 'b' : 'span', 'ci-letra', n);
      s.textContent = ch === ' ' ? ' ' : ch;
      letras.push(s);
    });
    // Orden "roto" pero fijo: las letras aparecen como una señal que se estabiliza.
    letras.forEach(function (s, i) {
      gsap.set(s, { opacity: 0 });
      var orden = (i * 7) % letras.length;
      tl.fromTo(s, { opacity: 0, y: (i % 2 ? 1 : -1) * 18 * U, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.18, immediateRender: false }, t0 + 0.2 + orden * 0.035);
    });
    if (C.lema) {
      var l = el('div', 'c-lema', caja, null);
      l.textContent = C.lema;
      l.style.fontSize = 36 * U + 'px';
      gsap.set(l, { opacity: 0 });
      tl.fromTo(l, { opacity: 0, y: 12 * U }, { opacity: 0.85, y: 0, duration: 0.5, immediateRender: false }, t0 + 0.75);
    }
    var web = C.web === false ? null : C.web || (R.marca && R.marca.usuario);
    if (web) {
      var wb = el('div', 'c-web', caja);
      wb.textContent = web;
      wb.style.fontSize = 30 * U + 'px';
      gsap.set(wb, { opacity: 0 });
      tl.fromTo(wb, { opacity: 0 }, { opacity: 0.7, duration: 0.5, immediateRender: false }, t0 + 1.0);
    }
    var d = document.getElementById('destello');
    tl.fromTo(d, { opacity: 0 }, { opacity: 0.92, duration: 0.12, ease: 'power2.out', immediateRender: false }, t0 - 0.14);
    tl.to(d, { opacity: 0, duration: 0.45, ease: 'power2.in' }, t0 + 0.02);
    var fijo = document.getElementById('logo-fijo');
    if (fijo) tl.to(fijo, { opacity: 0, duration: 0.1 }, t0);
  }

  // ---------- salidas entre escenas ----------
  // Salida de la escena. Nunca empieza antes de que la última palabra alcance a leerse (~0.4 s después de
  // decirse): si la escena siguiente ya empezó, las dos conviven un instante. Devuelve cuándo termina.
  function salir(capa, E, t0, t1, origenY, ultimaPalabra) {
    var tipo = E.salida || 'desenfoque';
    if (tipo === 'corte') return t1;
    // En escenas cortas («hashtags, horarios, tendencias») la salida se acorta.
    var k = Math.min(1, (t1 - t0) / 1.4);
    var d = { zoom: 0.42, barrido: 0.3, subir: 0.32 }[tipo] || 0.3;
    d *= k;
    var ini = Math.max(t1 - d, ultimaPalabra + 0.4);
    if (tipo === 'zoom') {
      gsap.set(capa, { transformOrigin: '50% ' + origenY * 100 + '%' });
      tl.to(capa, { scale: 4.2, filter: 'blur(18px)', opacity: 0, duration: d, ease: 'power3.in' }, ini);
    } else if (tipo === 'barrido') {
      tl.to(capa, { x: -0.9 * W, filter: 'blur(30px)', opacity: 0, duration: d, ease: 'power3.in' }, ini);
    } else if (tipo === 'subir') {
      tl.to(capa, { y: -0.35 * H, filter: 'blur(26px)', opacity: 0, duration: d, ease: 'power3.in' }, ini);
    } else {
      tl.to(capa, { filter: 'blur(24px)', opacity: 0, scale: 1.05, duration: d, ease: 'power2.in' }, ini);
    }
    return ini + d;
  }

  function construir() {
    var escenas = R.escenas || [];
    var crema = document.getElementById('crema');
    var enCrema = false;
    escenas.forEach(function (E, i) {
      var t0 = E.en, t1 = E.hasta, ultima = i === escenas.length - 1;
      var capa = el('div', 'ci-escena', cont);
      gsap.set(capa, { visibility: i === 0 ? 'visible' : 'hidden' });
      if (i > 0) tl.set(capa, { visibility: 'visible' }, t0);
      var prev = escenas[i - 1];
      if (prev && prev.salida === 'zoom') tl.fromTo(capa, { scale: 0.8, filter: 'blur(14px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out', immediateRender: false }, t0);

      // Fondo crema (cine): la portada y las escenas con fondo: 'crema'.
      var quiereCrema = CINE && (E.portada || E.fondo === 'crema');
      if (CINE && crema && quiereCrema !== enCrema) {
        if (i === 0) gsap.set(crema, { opacity: quiereCrema ? 1 : 0 });
        else tl.to(crema, { opacity: quiereCrema ? 1 : 0, duration: 0.35, ease: 'power2.inOut' }, t0 - 0.2);
        enCrema = quiereCrema;
      }
      if (quiereCrema) capa.classList.add('en-crema');
      if (CINE && E.portada) {
        aspas(capa, t0, t1, 0.06 * W, 0.045 * H, -30);
        aspas(capa, t0, t1, 0.94 * W, 0.95 * H, 10);
      }
      if (E.cierre && !CINE) { cierre(E, capa, t0); return; }
      var ultimaPalabra = t0;

      // Texto
      var T = E.texto || {};
      var bloque = el('div', 'ci-texto', capa);
      var y = T.y != null ? T.y : CINE ? 0.46 : 0.19;
      bloque.style.left = (T.x != null ? T.x : 0.5) * W + 'px';
      bloque.style.right = 'auto';
      bloque.style.maxWidth = 0.88 * W + 'px';
      bloque.style.top = y * H + 'px';
      bloque.style.alignItems = { izquierda: 'flex-start', centro: 'center', derecha: 'flex-end' }[T.alinear || (CINE ? 'centro' : 'izquierda')];
      gsap.set(bloque, { xPercent: -50, yPercent: CINE ? -50 : 0 });
      var primerBrillo = null, colorHalo = null;
      (E.lineas || []).forEach(function (L) {
        var p = el('p', 'ci-linea l-' + (L.tam || 'media') + (L.sans ? ' l-sans' : '') + (L.cursiva ? ' l-cursiva' : ''), bloque);
        var base = TAM[L.tam] || TAM.media;
        if (CINE && L.sans) base *= 0.62;
        p.style.fontSize = base * (L.escala || 1) * U + 'px';
        if (L.alinear) p.style.alignSelf = { izquierda: 'flex-start', centro: 'center', derecha: 'flex-end' }[L.alinear];
        if (L.sangria) p.style.paddingLeft = L.sangria * W + 'px';
        var cb = brillo(L.brillo);
        (L.palabras || []).forEach(function (P, k) {
          if (k > 0) p.appendChild(document.createTextNode(' '));
          var s = el('span', 'ci-palabra', p);
          s.textContent = P.w;
          if ((P.acento || P.subrayar) && CINE) { s.classList.add('ci-brilla'); s.style.setProperty('--c-brillo', cb); if (primerBrillo == null) { primerBrillo = P.t; colorHalo = cb; } }
          if (P.acento && !CINE) s.style.color = '#0E0E0E';
          animarPalabra(s, P.t);
          ultimaPalabra = Math.max(ultimaPalabra, P.t);
          if (P.tachar) tachar(s, P.t);
          if (P.subrayar) subrayar(s, P.t, cb);
        });
      });
      // Si una línea no cabe, se achica (con las fuentes ya cargadas).
      Array.prototype.forEach.call(bloque.children, function (p) {
        var max = 0.88 * W;
        if (p.scrollWidth > max) p.style.fontSize = parseFloat(p.style.fontSize) * max / p.scrollWidth + 'px';
      });
      if (CINE && primerBrillo != null) {
        var halo = el('div', 'ci-halo', bloque);
        gsap.set(halo, { width: 820 * U, height: 460 * U, left: '50%', top: '50%', xPercent: -50, yPercent: -50, background: 'radial-gradient(ellipse, ' + colorHalo + ' 0%, transparent 68%)' });
        bloque.insertBefore(halo, bloque.firstChild);
        tl.fromTo(halo, { opacity: 0 }, { opacity: 0.28, duration: 0.5, immediateRender: false }, primerBrillo);
      }

      // Píldoras (monocromo): aparecen cuando se nombran.
      if (E.etiquetas && E.etiquetas.length) {
        var caja = el('div', 'ci-etiquetas', capa);
        caja.style.top = (E.etiquetasY != null ? E.etiquetasY : 0.36) * H + 'px';
        caja.style.gap = 20 * U + 'px';
        E.etiquetas.forEach(function (et) {
          var d = el('div', 'ci-etiqueta', caja);
          d.textContent = et.texto;
          d.style.fontSize = 31 * U + 'px';
          gsap.set(d, { opacity: 0 });
          ultimaPalabra = Math.max(ultimaPalabra, et.t);
          tl.fromTo(d, { opacity: 0, y: 22 * U, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out', immediateRender: false }, Math.max(0, et.t - 0.1));
        });
      }
      (E.imagenes || (E.imagen ? [E.imagen] : [])).forEach(function (I) { imagen(I, capa, t0, t1); });
      if (!ultima) tl.set(capa, { visibility: 'hidden' }, Math.max(t1, salir(capa, E, t0, t1, y, ultimaPalabra)));
    });

    // Marco fijo del monocromo: logo arriba y adorno en las esquinas.
    if (!CINE) {
      var fijo = document.getElementById('logo-fijo');
      if (fijo && OPC.logoFijo !== false && (window.REEL_LOGO || (R.marca && R.marca.nombre))) {
        fijo.style.fontSize = 30 * U + 'px';
        fijo.style.top = 48 * U + 'px';
        if (window.REEL_LOGO) { var im = el('img', null, fijo); im.src = window.REEL_LOGO; }
        if (R.marca && R.marca.nombre) el('span', null, fijo).textContent = R.marca.nombre;
      } else if (fijo) fijo.style.display = 'none';
      if (OPC.adorno) {
        var ad = document.getElementById('adornos');
        [[-0.06, -0.035, 0], [0.76, 0.86, 180]].forEach(function (q, k) {
          var a = el('img', 'ci-adorno', ad);
          a.src = OPC.adorno;
          gsap.set(a, { width: 0.34 * W, left: q[0] * W, top: q[1] * H, rotation: q[2] });
          tl.fromTo(a, { rotation: q[2] - 3 }, { rotation: q[2] + 3, duration: DUR, ease: 'sine.inOut', immediateRender: false }, 0);
        });
      }
    }
    // Grabación en tarjeta: entra enfocándose, la cámara se acerca despacio todo el reel, y se aparta
    // (desenfoque) cuando una escena trae imagen, como un plano de apoyo. Vuelve cuando la imagen se va.
    var tv = document.getElementById('tv');
    if (tv) {
      var V = R.video || {};
      var ancho = (V.ancho || 0.84) * W, alto = ancho / (V.proporcion || 1);
      gsap.set(tv, { width: ancho, height: alto, left: (W - ancho) / 2, top: (V.y != null ? V.y : 0.64) * H - alto / 2 });
      if (V.color) tv.classList.add('a-color');
      tl.fromTo(tv, { opacity: 0, scale: 1.12, filter: 'blur(26px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', immediateRender: false }, 0);
      gsap.set(tv, { opacity: 0 });
      // zoom: acerca la grabación hacia el encuadre (la cara), útil si la fuente es ancha o la persona sale chica.
      var z = V.zoom || 1;
      gsap.set('#grabacion', { transformOrigin: V.encuadre || '50% 30%', scale: z });
      tl.fromTo('#grabacion', { scale: z }, { scale: z * (V.deriva || 1.1), duration: DUR, ease: 'none', immediateRender: false }, 0);
      var oculta = false;
      escenas.forEach(function (E, i) {
        var imgs = E.imagenes || (E.imagen ? [E.imagen] : []);
        var quiere = imgs.length > 0 || !!E.cierre;
        if (quiere && !oculta) {
          var t = Math.min.apply(null, imgs.map(function (I) { return I.en != null ? I.en : E.en + 0.05; }).concat([E.cierre ? E.en : 1e9]));
          tl.to(tv, { opacity: 0, scale: 0.94, filter: 'blur(20px)', duration: 0.35, ease: 'power2.in' }, Math.max(0, t - 0.1));
          oculta = true;
        } else if (!quiere && oculta) {
          tl.to(tv, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'expo.out' }, E.en);
          oculta = false;
        }
      });
    }
    if (CINE && OPC.fundidoFinal !== false) {
      tl.fromTo('#negro-final', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.in', immediateRender: false }, Math.max(0, DUR - 0.65));
    }
    tl.set({}, {}, DUR);
    window.__timelines['reel'] = tl;
  }

  window.__timelines = window.__timelines || {};
  if (document.fonts && document.fonts.load) {
    var cargas = CINE
      ? ['400 100px "Bodoni Moda"', 'italic 400 100px "Bodoni Moda"', '400 100px "' + (window.REEL_FUENTES || {}).sans + '"']
      : ['800 100px "' + (window.REEL_FUENTES || {}).mono + '"', '600 100px "' + (window.REEL_FUENTES || {}).mono + '"'];
    Promise.all(cargas.map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return document.fonts.ready; })
      .then(construir);
  } else construir();
})();
