#!/usr/bin/env node
// Genera index.html (la composición de HyperFrames) a partir de reel.js y palabras.json.
// Uso: node armar.mjs [carpeta-del-proyecto]
// Corre esto cada vez que cambies reel.js o palabras.json; index.html no se edita a mano.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import crypto from 'node:crypto';

const dir = path.resolve(process.argv[2] || '.');
const avisos = [];
const aviso = (m) => avisos.push(m);
const falla = (m) => { console.error('✖ ' + m); process.exit(1); };

// ---------- leer reel.js ----------
const rutaReel = path.join(dir, 'reel.js');
if (!fs.existsSync(rutaReel)) falla(`No encuentro ${rutaReel}. ¿Creaste el proyecto con nuevo.mjs?`);
const ctx = { window: {} };
try { vm.runInNewContext(fs.readFileSync(rutaReel, 'utf8'), ctx, { filename: 'reel.js' }); }
catch (e) { falla('reel.js tiene un error de sintaxis: ' + e.message); }
const R = ctx.window.REEL;
if (!R) falla('reel.js debe definir window.REEL = { ... }');
const EDITORIAL = R.modo === 'editorial';   // tipografía cinética + 3D (ver references/editorial.md)
const CINETICA = R.modo === 'monocromo' || R.modo === 'cine';   // el texto sigue a la voz (ver references/monocromo-cine.md)
// Efectos sintetizados por scripts/sfx.py (duración en segundos).
const SFX_DUR = { whoosh: 0.62, 'whoosh-corto': 0.34, subida: 1.1, golpe: 1.0, pop: 0.16, clic: 0.05, tic: 0.09, ding: 1.4,
  notificacion: 0.75, exito: 1.2, dinero: 0.8, brillo: 0.9, teclado: 1.1, trazo: 0.6, boom: 2.2, enfoque: 0.7 };
const SFX_DUR_E = SFX_DUR;

const FORMATOS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };
const [W, H] = FORMATOS[R.formato || '9:16'] || falla(`formato "${R.formato}" no válido. Usa: ${Object.keys(FORMATOS).join(', ')}`);

const existe = (rel) => rel && fs.existsSync(path.join(dir, rel));
const duracionDe = (rel) => {
  try {
    return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(dir, rel)]).toString());
  } catch { return null; }
};

// ---------- palabras ----------
let palabras = [];
if (typeof R.palabras === 'string') {
  if (existe(R.palabras)) palabras = JSON.parse(fs.readFileSync(path.join(dir, R.palabras), 'utf8'));
  else aviso(`No existe ${R.palabras}: el reel saldrá sin subtítulos.`);
} else if (Array.isArray(R.palabras)) palabras = R.palabras;
palabras = palabras.filter((p) => p && p.text && p.end >= p.start);

// ---------- medios ----------
const video = R.video && R.video.src ? R.video : null;
let voz = R.voz && R.voz.src ? R.voz : null;
// Modo «solo idea»: el proyecto se crea antes que la voz. Si la voz ya existe en assets/, úsala.
if (!video && !voz) {
  const hallada = ['voz.wav', 'voz.mp3', 'voz.m4a'].map((f) => 'assets/' + f).find(existe);
  if (hallada) { voz = { src: hallada }; aviso(`Usé ${hallada} como voz (en reel.js dice voz: null; ponle voz: { src: '${hallada}' } para dejarlo explícito).`); }
}
if (video && !existe(video.src)) falla(`No existe el video ${video.src}`);
if (voz && !existe(voz.src)) falla(`No existe la voz ${voz.src}`);
if (!EDITORIAL && !CINETICA && !video && !voz && palabras.length) aviso("Hay subtítulos pero ni video ni voz: el reel saldrá MUDO. Pon voz: { src: 'assets/voz.wav' } en reel.js.");
if (video && voz) aviso('Hay video y voz a la vez: se escucharán los dos. Normalmente es uno u otro.');
const durVideo = video ? duracionDe(video.src) - (video.inicio || 0) : 0;
const tieneAudio = (rel) => {
  try { return execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', path.join(dir, rel)]).toString().trim() !== ''; }
  catch { return false; }
};
const audioVideo = video ? tieneAudio(video.src) && video.silenciar !== true : false;
const durVoz = voz ? duracionDe(voz.src) : 0;
const finVoz = palabras.length ? palabras[palabras.length - 1].end : 0;

const finEscenas = EDITORIAL ? Math.max(0, ...(R.escenas || []).map((e) => e.hasta || e.en + 2)) : 0;
// Monocromo y cine: las escenas toman sus tiempos de la voz (palabras.json); se calculan antes que la duración.
const CIN = CINETICA ? tiemposCinetica() : null;
// Música de la biblioteca local (~/.reels-animados/musica, generada con musica.mjs): se copia al proyecto.
if (R.musica && R.musica.nombre && !R.musica.src) {
  const origen = path.join(os.homedir(), '.reels-animados', 'musica', R.musica.nombre.replace(/\.mp3$/, '') + '.mp3');
  if (!fs.existsSync(origen)) falla(`No existe la pista "${R.musica.nombre}" en tu biblioteca. Mira las que tienes con: node <skill>/scripts/musica.mjs --lista`);
  const rel = 'assets/musica-' + path.basename(origen);
  if (!existe(rel)) { fs.mkdirSync(path.join(dir, 'assets'), { recursive: true }); fs.copyFileSync(origen, path.join(dir, rel)); }
  R.musica.src = rel;
}
let DUR = R.duracion || Math.max(durVideo || 0, durVoz || 0, finVoz + 0.6, finEscenas, CIN ? CIN.fin : 0);
if (!DUR) falla('No puedo calcular la duración: pon "duracion" en reel.js o agrega voz, video o palabras.');
DUR = Math.round(DUR * 100) / 100;
// Si el reel dura más que el video (por ejemplo, para dar aire al cierre), se extiende el último
// cuadro: si no, la parte de la pantalla que el cierre no tapa quedaría en negro.
let videoSrc = video ? video.src : null;
if (video && DUR > durVideo + 0.05) {
  const extra = Math.round((DUR - durVideo + 0.2) * 100) / 100;
  const firma = crypto.createHash('md5').update(JSON.stringify([video.src, fs.statSync(path.join(dir, video.src)).mtimeMs, video.inicio || 0, extra])).digest('hex').slice(0, 10);
  videoSrc = `assets/.mezcla/video-${firma}.mp4`;
  if (!existe(videoSrc)) {
    fs.mkdirSync(path.join(dir, 'assets', '.mezcla'), { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(video.inicio || 0), '-i', path.join(dir, video.src),
      '-vf', `tpad=stop_mode=clone:stop_duration=${extra}`, '-af', `apad=pad_dur=${extra}`,
      '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', path.join(dir, videoSrc)]);
  }
  aviso(`El reel dura ${DUR}s y el video ${durVideo.toFixed(2)}s: extendí su último cuadro para cubrir el final.`);
}

// ---------- marca ----------
const M = R.marca || {};
const C = Object.assign({ fondo: '#111111', texto: '#FFFFFF', acento: '#7C3AED', suave: '#C4B5FD' }, M.colores || {});
const hex = (h) => { const s = h.replace('#', ''); const n = parseInt(s.length === 3 ? s.replace(/./g, '$&$&') : s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mezclar = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const sobreAcento = contraste(C.acento, '#FFFFFF') >= contraste(C.acento, '#111111') ? '#FFFFFF' : '#111111';
// Un acento oscuro (violeta, azul marino) casi no se lee como texto sobre video: lo aclaro lo justo.
let acentoClaro = C.acento;
for (let t = 0; t <= 0.7 && contraste(acentoClaro, '#000000') < 6; t += 0.05) acentoClaro = mezclar(C.acento, '#FFFFFF', t);
const fondoOscuro = lum(C.fondo) < 0.3;

const INCLUIDAS = ['Inter', 'Montserrat', 'Outfit', 'Nunito', 'Oswald', 'League Gothic', 'Archivo Black', 'Space Mono', 'IBM Plex Mono', 'JetBrains Mono', 'EB Garamond', 'Playfair Display', 'Source Code Pro', 'Roboto', 'Open Sans', 'Lato', 'Poppins'];
const F = Object.assign({ titulo: 'Montserrat', texto: 'Inter' }, M.fuentes || {});
let fontFaces = '';
const familia = (f, rol) => {
  if (typeof f === 'string') {
    if (!INCLUIDAS.includes(f)) aviso(`La fuente "${f}" (${rol}) no viene incluida en HyperFrames: dale un archivo .woff2 ({ familia, archivo }) o usa una de: ${INCLUIDAS.join(', ')}.`);
    return f;
  }
  if (!existe(f.archivo)) falla(`No existe la fuente ${f.archivo}`);
  fontFaces += `@font-face { font-family: "${f.familia}"; src: url("${f.archivo}"); font-weight: 100 900; font-display: block; }\n`;
  return f.familia;
};
const famTitulo = familia(F.titulo, 'titulo');
const famTexto = familia(F.texto, 'texto');
const logo = M.logo && existe(M.logo) ? M.logo : null;
if (M.logo && !logo) aviso(`No existe el logo ${M.logo}: el cierre saldrá sin logo.`);

// ---------- efectos: sin amontonar ----------
// Dos efectos a menos de 0.22 s suenan como uno sucio: queda el más importante.
const PRIORIDAD = ['boom', 'golpe', 'exito', 'trazo', 'enfoque', 'subida', 'whoosh', 'notificacion', 'dinero', 'brillo', 'ding', 'pop', 'whoosh-corto', 'teclado', 'tic', 'clic'];
// Además, en todos los estilos: nunca dos soplos (whoosh, whoosh-corto, enfoque) a menos de 2.5 s.
// Un soplo por cada título o cambio de escena se vuelve un zumbido constante; el que sobra se cambia por
// un pop suave si no hay otro efecto ahí, o se quita.
const SOPLOS = ['whoosh', 'whoosh-corto', 'enfoque'];
function depurar(lista) {
  const orden = lista.slice().sort((a, b) => a[1] - b[1]), fuera = [];
  let ultimoSoplo = -9;
  for (const e0 of orden) {
    let e = e0;
    if (SOPLOS.includes(e[0])) {
      if (e[1] - ultimoSoplo < 2.5) {
        const cerca = fuera.some((x) => Math.abs(x[1] - e[1]) < 0.5);
        if (cerca) continue;
        e = ['pop', e[1] + (e[0] === 'enfoque' ? 0.4 : 0)];
      } else ultimoSoplo = e[1];
    }
    const u = fuera[fuera.length - 1];
    if (u && e[1] - u[1] < 0.22) { if (PRIORIDAD.indexOf(e[0]) < PRIORIDAD.indexOf(u[0])) fuera[fuera.length - 1] = e; }
    else fuera.push(e);
  }
  return fuera;
}

// ---------- mezcla de la música ----------
function medirLufs(rel) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(dir, rel), '-vn', '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const todos = [...(r.stderr || '').matchAll(/I:\s+(-?[\d.]+) LUFS/g)];
  return todos.length ? parseFloat(todos[todos.length - 1][1]) : -18;
}
// La música se prepara una vez con ffmpeg: nivel parejo, baja sola cuando habla la voz (sidechain),
// entra y sale con fundido. El resultado queda en assets/.mezcla/ y se reutiliza si nada cambió.
function mezclarMusica() {
  const m = R.musica;
  if (!m || !m.src) return null;
  if (!existe(m.src)) falla(`No existe la música ${m.src}`);
  const clave = [m.src, voz && voz.src, video && audioVideo && video.src].filter(Boolean);
  const firma = crypto.createHash('md5').update(JSON.stringify([clave.map((f) => [f, fs.statSync(path.join(dir, f)).mtimeMs]), DUR, m.inicio || 0, m.volumen ?? 1, 7])).digest('hex').slice(0, 10);
  const rel = `assets/.mezcla/musica-${firma}.wav`;
  if (existe(rel)) return rel;
  fs.mkdirSync(path.join(dir, 'assets', '.mezcla'), { recursive: true });
  const ini = m.inicio || 0, gan = m.volumen ?? 1, fin = Math.max(0, DUR - 1.8);
  const llave = voz ? voz.src : video && audioVideo ? video.src : null;
  // Cada voz tiene su propio volumen (Dora es más baja que Alex; una grabación, distinta a la voz IA):
  // se mide y la música se ubica en relación a ella. En pausas y cierre queda 3 dB bajo la voz;
  // mientras se habla, el sidechain la baja unos 6 dB más (≈9 dB bajo la voz, la mezcla aprobada).
  const vozLufs = llave ? medirLufs(llave) : null;
  const nivel = llave ? Math.max(-30, Math.min(-12, vozLufs - 3)) : -16;
  const umbral = llave ? Math.pow(10, (vozLufs - 10) / 20).toFixed(4) : 0;
  const base = `[0:a]atrim=start=${ini}:duration=${DUR},asetpts=PTS-STARTPTS,aresample=48000,loudnorm=I=${nivel}:TP=-2:LRA=11,volume=${gan}`;
  const fc = llave
    ? `${base}[m];[1:a]aresample=48000,apad[v];[m][v]sidechaincompress=threshold=${umbral}:ratio=3:attack=35:release=450:makeup=1[d];[d]afade=t=in:d=0.5,afade=t=out:st=${fin}:d=1.8[o]`
    : `${base},afade=t=in:d=0.5,afade=t=out:st=${fin}:d=1.8[o]`;
  const entradas = ['-i', path.join(dir, m.src), ...(llave ? ['-i', path.join(dir, llave)] : [])];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', fc, '-map', '[o]', '-t', String(DUR), '-ac', '2', '-c:a', 'pcm_s16le', path.join(dir, rel)]);
  return rel;
}
const musicaMezclada = mezclarMusica();

// ---------- monocromo y cine ----------
if (CINETICA) {
  armarCinetica();
  process.exit(0);
}

// ---------- modo editorial ----------
if (EDITORIAL) {
  await armarEditorial();
  process.exit(0);
}

// ---------- validar tiempos ----------
const momentos = R.momentos || [];
const TIPOS = ['cifra', 'titulo', 'lista', 'palabra', 'imagen', 'icono', 'zoom', 'chat', 'comparar', 'grafica', 'notificacion', 'cita', 'emoji'];
momentos.forEach((m, i) => {
  if (!TIPOS.includes(m.tipo)) falla(`El momento #${i + 1} tiene un tipo desconocido: "${m.tipo}". Tipos: ${TIPOS.join(', ')}.`);
  if (m.en == null) falla(`El momento #${i + 1} (${m.tipo}) no tiene "en" (segundo en que aparece).`);
  if (m.en >= DUR) aviso(`El momento #${i + 1} (${m.tipo}) empieza en ${m.en}s, después del final (${DUR}s).`);
  if (m.tipo === 'imagen' && !existe(m.src)) falla(`No existe la imagen ${m.src} del momento #${i + 1}.`);
});
const ctaEn = R.cta ? (R.cta.en != null ? R.cta.en : Math.max(0, DUR - 3)) : null;
if (R.cta && DUR - ctaEn < 1.5) aviso(`El cierre dura solo ${(DUR - ctaEn).toFixed(1)}s: dale al menos 2 s (sube "duracion" o adelanta cta.en).`);

// ---------- emojis (Twemoji) ----------
const codigoEmoji = (e) => {
  const cps = [...e].map((c) => c.codePointAt(0).toString(16));
  return (cps.includes('200d') ? cps : cps.filter((c) => c !== 'fe0f')).join('-');
};
for (const [i, m] of momentos.entries()) {
  if (m.tipo !== 'emoji') continue;
  if (!m.emoji) falla(`El momento #${i + 1} (emoji) no tiene "emoji" (por ejemplo: '💰').`);
  const rel = `assets/emoji/${codigoEmoji(m.emoji)}.svg`;
  if (!existe(rel)) {
    try {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${codigoEmoji(m.emoji)}.svg`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.mkdirSync(path.join(dir, 'assets', 'emoji'), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), await r.text());
    } catch (e) { falla(`No pude descargar el emoji ${m.emoji} (${e.message}). Revisa tu conexión o usa otro emoji.`); }
  }
  m.src = rel;
}

// ---------- sonidos ----------
const SFX_POR_TIPO = { cifra: 'pop', palabra: 'golpe', imagen: 'whoosh', titulo: 'whoosh', icono: 'pop', lista: 'tic',
  comparar: 'whoosh-corto', grafica: 'subida', cita: 'whoosh', emoji: 'brillo', chat: 'pop', notificacion: 'notificacion' };
// Misma cuenta que tiemposLista() en motor.js: cuándo aparece cada elemento de una lista.
const tiemposLista = (m, items, dur, ini = 0.35) => items.map((it, i) => (it && typeof it === 'object' && it.en != null ? it.en : m.en + ini + i * ((dur - 0.9) / Math.max(1, items.length))));
const DUR_LISTA = {
  lista: (m) => m.dur || Math.max(2.5, (m.items || []).length * 1.2 + 1),
  chat: (m) => m.dur || Math.max(3, (m.mensajes || []).length * 1.4 + 1),
  notificacion: (m) => m.dur || Math.max(2.5, (m.items || [1]).length * 0.9 + 1.4),
};
const sfx = [];
if (R.sonidos !== false) {
  if (R.gancho && R.gancho.texto) sfx.push(['whoosh', R.gancho.desde || 0]);
  momentos.forEach((m) => {
    const s = m.sonido === false ? null : m.sonido || SFX_POR_TIPO[m.tipo];
    if (!s) return;
    if (DUR_LISTA[m.tipo] && !m.sonido) {
      // Un sonido por elemento: cada punto de la lista, cada mensaje (pop si llega, clic si lo mandas), cada notificación.
      const items = m.tipo === 'chat' ? m.mensajes || [] : m.items || [{}];
      tiemposLista(m, items, DUR_LISTA[m.tipo](m), m.tipo === 'notificacion' ? 0.15 : 0.35)
        .forEach((t, i) => sfx.push([m.tipo === 'chat' && items[i] && items[i].de === 'yo' ? 'clic' : s, t]));
    } else {
      // La palabra gigante llega después de una subida: tensión y golpe.
      if (m.tipo === 'palabra' && !m.sonido && m.en > 1.2) sfx.push(['subida', m.en - 1.1]);
      sfx.push([s, m.en]);
    }
  });
  // Escenas escritas a mano: un whoosh en cada cambio, salvo que ya haya un título ahí.
  (R.escenas || []).forEach((e) => {
    if (e.en > 0.5 && !momentos.some((m) => m.tipo === 'titulo' && Math.abs(m.en - e.en) < 0.3)) sfx.push(['whoosh', Math.max(0, e.en - 0.3)]);
  });
  if (R.cta) sfx.push(['exito', ctaEn + 0.3]);
}
const volSfx = R.volumenSonidos ?? 0.5;

// ---------- escribir index.html ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const num = (n) => Math.round(n * 1000) / 1000;
const pista = (() => { let i = 0; return () => ++i; })();
let medios = '';
if (video) {
  const pos = video.encuadre || '50% 50%';
  medios += `
  <div id="camara" class="capa"><div id="golpe" class="capa"><div id="zoom" class="capa">
    <video id="grabacion" src="${esc(videoSrc)}" data-start="0" data-duration="${num(videoSrc !== video.src ? DUR : Math.min(DUR, durVideo))}" data-media-start="${num(videoSrc !== video.src ? 0 : video.inicio || 0)}" data-track-index="${pista()}" ${audioVideo ? 'data-has-audio="true"' : 'muted'} playsinline style="object-position:${esc(pos)}"></video>
  </div></div></div>
  <div id="sombra-video" class="capa"></div>`;
}
if (voz) medios += `\n  <audio id="voz" src="${esc(voz.src)}" data-start="${num(voz.inicio || 0)}" data-duration="${num(Math.min(durVoz, DUR))}" data-volume="${voz.volumen ?? 1}" data-track-index="${pista()}"></audio>`;
if (musicaMezclada) medios += `\n  <audio id="musica" src="${esc(musicaMezclada)}" data-start="0" data-duration="${DUR}" data-volume="1" data-track-index="${pista()}"></audio>`;
depurar(sfx).forEach(([s, t], i) => {
  if (t >= DUR) return;
  medios += `\n  <audio id="sfx-${i}" src="motor/sfx/${s}.wav" data-start="${num(t)}" data-duration="${num(Math.min(SFX_DUR[s], DUR - t))}" data-volume="${volSfx}" data-track-index="${pista()}"></audio>`;
});

// El motor va incrustado: HyperFrames revisa el registro de la línea de tiempo en el propio HTML.
const leerMotor = (f) => {
  const p = path.join(dir, 'motor', f);
  if (!fs.existsSync(p)) falla(`Falta motor/${f}. Copia la carpeta plantilla/motor del skill a tu proyecto.`);
  return fs.readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script');
};
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const html = `<!doctype html>
<!-- GENERADO por reels-animados/armar.mjs a partir de reel.js — no edites este archivo: edita reel.js y vuelve a armar. -->
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(R.titulo || 'Reel')}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${leerMotor('reel.css')}
${fontFaces}:root {
  --fondo: ${C.fondo}; --texto: ${C.texto}; --acento: ${C.acento}; --suave: ${C.suave};
  --sobre-acento: ${sobreAcento}; --acento-claro: ${acentoClaro};
  --fondo-caja: ${fondoOscuro ? C.texto : C.fondo}; --texto-caja: ${fondoOscuro ? C.fondo : C.texto};
}
.f-titulo { font-family: "${famTitulo}", sans-serif; }
.f-texto { font-family: "${famTexto}", sans-serif; }
</style>
</head>
<body>
<div id="root" data-composition-id="reel" data-start="0" data-width="${W}" data-height="${H}" data-duration="${DUR}">
  <div id="fondo" class="capa"></div>${medios}
  <div id="capas" class="capa"></div>
</div>
<script>
window.REEL = ${json(R)};
window.PALABRAS = ${json(palabras)};
window.REEL_FUENTES = ${json({ titulo: famTitulo, texto: famTexto })};
window.REEL_LOGO = ${json(logo)};
</script>
<script>
${leerMotor('motor.js')}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);

console.log(`✔ index.html armado · ${R.formato || '9:16'} (${W}×${H}) · ${DUR}s · ${palabras.length} palabras · ${momentos.length} momentos · ${sfx.length} sonidos`);
avisos.forEach((a) => console.log('  ⚠ ' + a));

// =====================================================================================
// Modo editorial: tipografía cinética sobre papel + objetos 3D (Three.js).
// =====================================================================================
async function armarEditorial() {
  const E = R.editorial || {};
  const escenas = (R.escenas || []).slice().sort((a, b) => a.en - b.en);
  if (!escenas.length) falla('El modo editorial necesita "escenas": [...] en reel.js (ver references/editorial.md).');
  const OBJ = ['esfera', 'estrella', 'pieza', 'moneda', 'cubo', 'anillo', 'pildora', 'cerebro', 'diana'];
  const objetos3d = [];
  escenas.forEach((e, i) => {
    if (e.en == null) falla(`La escena #${i + 1} no tiene "en".`);
    const t1 = e.hasta ?? (escenas[i + 1] ? escenas[i + 1].en : DUR);
    (e.bloques || []).forEach((b, k) => {
      if (b.en == null) b.en = e.en + 0.08 + k * 0.15;   // misma cuenta que editorial.js
      if (b.objeto) { if (!OBJ.includes(b.objeto.tipo)) falla(`Objeto 3D desconocido "${b.objeto.tipo}" (escena #${i + 1}). Objetos: ${OBJ.join(', ')}.`); objetos3d.push({ ...b.objeto, en: b.en }); }
      if (b.en > t1) aviso(`En la escena #${i + 1}, un bloque aparece en ${b.en}s, después de que la escena termina (${t1}s).`);
    });
    (e.objetos || []).forEach((o) => {
      if (!OBJ.includes(o.tipo)) falla(`Objeto 3D desconocido "${o.tipo}" (escena #${i + 1}). Objetos: ${OBJ.join(', ')}.`);
      objetos3d.push({ ...o, en: o.en ?? e.en + 0.05 });
    });
  });

  // Colores del papel: claros por defecto; el acento de la marca se oscurece lo justo para leerse sobre papel.
  const papel = E.color || '#ECECEE';
  let acentoTinta = C.acento;
  for (let t = 0; t <= 0.8 && contraste(acentoTinta, papel) < 4.5; t += 0.05) acentoTinta = mezclar(C.acento, '#111111', t);

  // Sonidos: whoosh al cambiar de escena, pop por objeto, tic por etiqueta, golpe en entradas fuertes y en la flecha.
  const sfx = [];
  if (R.sonidos !== false) {
    escenas.forEach((e, i) => {
      if (i > 0) sfx.push(['whoosh', Math.max(0, e.en - 0.12)]);
      (e.bloques || []).forEach((b) => {
        if (b.entrada === 'barrido') sfx.push(['whoosh-corto', b.en]);
        if (b.entrada === 'golpe') sfx.push(['golpe', b.en]);
        if (b.cifra != null) sfx.push(['pop', b.en]);
        if (b.boton) sfx.push(['exito', b.en]);
        if (b.marca) sfx.push(['brillo', b.en]);
        if (b.etiquetas) b.etiquetas.forEach((_, j) => sfx.push(['tic', b.tiempos?.[j] ?? b.en + j * 0.8]));
      });
    });
    const SON_OBJETO = { estrella: 'brillo', moneda: 'dinero' };
    objetos3d.forEach((o) => {
      sfx.push([o.sonido || SON_OBJETO[o.tipo] || 'pop', o.en]);
      if (o.tipo === 'diana' && o.flecha != null) { sfx.push(['whoosh-corto', o.flecha - 0.4]); sfx.push(['golpe', o.flecha]); }
    });
  }
  const volSfx = R.volumenSonidos ?? 0.5;

  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const num = (n) => Math.round(n * 1000) / 1000;
  let pista = 0, medios = '';
  if (voz) medios += `\n  <audio id="voz" src="${esc(voz.src)}" data-start="${num(voz.inicio || 0)}" data-duration="${num(Math.min(durVoz, DUR))}" data-volume="${voz.volumen ?? 1}" data-track-index="${++pista}"></audio>`;
  if (musicaMezclada) medios += `\n  <audio id="musica" src="${esc(musicaMezclada)}" data-start="0" data-duration="${DUR}" data-volume="1" data-track-index="${++pista}"></audio>`;
  depurar(sfx).filter(([, t]) => t < DUR).forEach(([n, t], i) => {
    medios += `\n  <audio id="sfx-${i}" src="motor/sfx/${n}.wav" data-start="${num(t)}" data-duration="${num(Math.min(SFX_DUR_E[n], DUR - t))}" data-volume="${volSfx}" data-track-index="${++pista}"></audio>`;
  });

  const leer = (f) => {
    const q = path.join(dir, 'motor', f);
    if (!fs.existsSync(q)) falla(`Falta motor/${f}. Copia la carpeta plantilla/motor del skill a tu proyecto.`);
    return fs.readFileSync(q, 'utf8').replace(/<\/script/gi, '<\\/script');
  };
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const con3d = objetos3d.length > 0;
  const html = `<!doctype html>
<!-- GENERADO por reels-animados/armar.mjs (modo editorial) a partir de reel.js — no edites este archivo: edita reel.js y vuelve a armar. -->
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(R.titulo || 'Reel')}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>${con3d ? `
<script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.181.2/examples/jsm/" } }
</script>` : ''}
<style>
${leer('editorial.css')}
${fontFaces}:root {
  --papel: ${papel}; --linea: ${E.linea || '#DCDCE0'}; --tinta: ${E.tinta || '#1D1D22'}; --gris: ${E.gris || '#6C6C74'};
  --acento: ${C.acento}; --acento-tinta: ${acentoTinta}; --sobre-acento: ${sobreAcento}; --suave: ${C.suave};
}
.f-titulo { font-family: "${famTitulo}", sans-serif; }
</style>
</head>
<body>
<div id="root" data-composition-id="reel" data-start="0" data-width="${W}" data-height="${H}" data-duration="${DUR}">
  <div id="papel" class="capa ${['cuadriculado', 'puntos', 'liso'].includes(E.papel) ? E.papel : 'cuadriculado'}"></div>
  <svg id="curvas" class="capa" viewBox="0 0 1080 1920" preserveAspectRatio="none"></svg>${con3d ? `
  <canvas id="lienzo3d" width="${W}" height="${H}"></canvas>` : ''}
  <div id="escenas" style="position:absolute; left:0; top:0; width:${W}px; height:${H}px"></div>
  <div id="vineta" class="capa"></div>${medios}
</div>
<script>
window.REEL = ${json(R)};
window.REEL_FUENTES = ${json({ titulo: famTitulo, texto: famTexto })};
window.REEL_COLORES = ${json({ acento: C.acento, suave: C.suave })};
window.REEL_LOGO = ${json(logo)};
</script>
<script>
${leer('editorial.js')}
</script>${con3d ? `
<script type="module">
${leer('objetos3d.js')}
</script>` : ''}
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✔ index.html armado (editorial) · ${R.formato || '9:16'} (${W}×${H}) · ${DUR}s · ${escenas.length} escenas · ${objetos3d.length} objetos 3D · ${sfx.length} sonidos`);
  avisos.forEach((a) => console.log('  ⚠ ' + a));
}

// =====================================================================================
// Monocromo y cine: la tipografía sigue a la voz, palabra por palabra.
// =====================================================================================
// Cada palabra que se escribe en pantalla se busca, en orden, en palabras.json (la transcripción de
// la voz). En pantalla puede haber menos palabras que en la voz («la mayoría de creadores» → «creadores»):
// las que no aparecen se saltan. Marcas: *palabra* = acento (en cine, brillo de neón), ~~palabra~~ = tachada,
// _palabra_ = subrayada con un trazo a mano. Una marca puede abarcar varias palabras: *idea clara*.
function tiemposCinetica() {
  const escenas = R.escenas || [];
  if (!escenas.length) falla(`El estilo ${R.modo} necesita "escenas": [...] en reel.js (ver references/monocromo-cine.md).`);
  const NUM = { 0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez' };
  const norm = (w) => {
    const x = String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
    return NUM[x] || (x === 'una' ? 'un' : x);
  };
  const voz = palabras.map((p) => ({ n: norm(p.text), start: p.start, end: p.end })).filter((p) => p.n);
  const sinVoz = !voz.length;
  let ptr = 0, ultimo = 0;
  const perdidas = [];
  const partir = (texto) => {
    const out = [];
    let acento = false, tachar = false, subrayar = false;
    String(texto).split(/\s+/).filter(Boolean).forEach((tok) => {
      let w = tok;
      for (let seguir = true; seguir;) {
        seguir = false;
        if (w.startsWith('~~')) { tachar = true; w = w.slice(2); seguir = true; }
        else if (w.startsWith('**')) { acento = true; w = w.slice(2); seguir = true; }
        else if (w.startsWith('*')) { acento = true; w = w.slice(1); seguir = true; }
        else if (w.startsWith('_')) { subrayar = true; w = w.slice(1); seguir = true; }
      }
      const punt = (w.match(/[.,;:!?…»)"]+$/) || [''])[0];
      let nucleo = w.slice(0, w.length - punt.length);
      const cierres = [];
      for (let seguir = true; seguir;) {
        seguir = false;
        if (nucleo.endsWith('~~')) { cierres.push('t'); nucleo = nucleo.slice(0, -2); seguir = true; }
        else if (nucleo.endsWith('**')) { cierres.push('a'); nucleo = nucleo.slice(0, -2); seguir = true; }
        else if (nucleo.endsWith('*')) { cierres.push('a'); nucleo = nucleo.slice(0, -1); seguir = true; }
        else if (nucleo.endsWith('_')) { cierres.push('u'); nucleo = nucleo.slice(0, -1); seguir = true; }
      }
      out.push({ w: nucleo + punt, acento, tachar, subrayar });
      if (cierres.includes('t')) tachar = false;
      if (cierres.includes('a')) acento = false;
      if (cierres.includes('u')) subrayar = false;
    });
    return out;
  };
  // Busca la palabra hacia adelante en la voz: el texto de pantalla va en el mismo orden que la voz.
  const buscar = (w) => {
    const n = norm(w);
    if (!n || sinVoz) return null;
    for (let j = ptr; j < Math.min(voz.length, ptr + 9); j++) {
      if (voz[j].n === n || (n.length > 4 && voz[j].n.length > 4 && voz[j].n.slice(0, -1) === n.slice(0, -1))) {
        ptr = j + 1; ultimo = voz[j].end;
        return voz[j].start;
      }
      // Palabras que la transcripción separa: «chat gpt» = «ChatGPT», «auto matiza» = «automatiza».
      if (voz[j + 1] && voz[j].n + voz[j + 1].n === n) {
        ptr = j + 2; ultimo = voz[j + 1].end;
        return voz[j].start;
      }
    }
    return null;
  };
  let finAnterior = 0;
  escenas.forEach((e, i) => {
    const todos = [];
    e.lineas = (e.lineas || []).map((L) => (typeof L === 'string' ? { texto: L } : L));
    e.lineas.forEach((L) => {
      L.palabras = partir(L.texto || '');
      L.palabras.forEach((P, k) => {
        P.t = L.en != null ? L.en + k * 0.12 : buscar(P.w);
        if (P.t == null && norm(P.w)) perdidas.push(`«${P.w}» (escena #${i + 1})`);
        todos.push(P);
      });
    });
    e.etiquetas = (e.etiquetas || []).map((et) => (typeof et === 'string' ? { texto: et } : et));
    e.etiquetas.forEach((et) => {
      const ts = String(et.texto).split(/\s+/).map((w) => buscar(w)).filter((t) => t != null);
      et.t = et.en != null ? et.en : ts.length ? ts[0] : null;
      todos.push(et);
    });
    // Palabras sin pareja en la voz: justo después de la anterior.
    let prev = null;
    todos.forEach((P) => { if (P.t == null && prev != null) P.t = prev + 0.14; prev = P.t; });
    const primero = todos.find((P) => P.t != null);
    // La escena entra justo antes de su primera palabra: así la anterior se queda en pantalla durante la pausa
    // entre frases, en vez de dejar la pantalla vacía (en cine, con fondo negro, se nota mucho).
    if (e.en == null) e.en = primero ? Math.max(finAnterior, primero.t - (R.modo === 'cine' ? 0.12 : 0.22)) : finAnterior + (i ? 0.5 : 0);
    let k = 0;
    todos.forEach((P) => { if (P.t == null) P.t = e.en + 0.15 + 0.14 * k++; });
    // La imagen puede entrar con una palabra: imagen: { src, palabra: 'claridad' }.
    (e.imagenes || (e.imagen ? [e.imagen] : [])).forEach((I) => {
      if (I.en != null || !I.palabra) return;
      const ref = todos.find((P) => P.w && norm(P.w) === norm(I.palabra));
      if (ref) I.en = ref.t - 0.1;
    });
    finAnterior = Math.max(e.en + 0.4, ...todos.map((P) => P.t + 0.3));
  });
  escenas.forEach((e, i) => { if (e.hasta == null && escenas[i + 1]) e.hasta = escenas[i + 1].en; });
  const ultima = escenas[escenas.length - 1];
  const fin = Math.max(ultimo + (ultima.cierre ? 0 : 1.0), ultima.en + (ultima.cierre ? 3.4 : 1.2));
  if (perdidas.length && !sinVoz) aviso(`No encontré en la voz: ${perdidas.slice(0, 8).join(', ')}${perdidas.length > 8 ? '…' : ''}. Aparecen justo después de la palabra anterior: revisa que el texto de pantalla diga lo mismo que la voz.`);
  if (sinVoz) aviso('No hay palabras.json: las palabras se reparten solas desde el "en" de cada escena.');
  return { fin };
}

function armarCinetica() {
  const CINE = R.modo === 'cine';
  const escenas = R.escenas;
  escenas[escenas.length - 1].hasta = DUR;
  const OPC = R[R.modo] || {};
  escenas.forEach((e, i) => {
    (e.imagenes || (e.imagen ? [e.imagen] : [])).forEach((I) => { if (!existe(I.src)) aviso(`No existe la imagen ${I.src} (escena #${i + 1}).`); });
  });
  if (OPC.adorno && !existe(OPC.adorno)) aviso(`No existe el adorno ${OPC.adorno}.`);

  // Sonidos, con moderación y variados: la música y la voz llevan el ritmo. Los soplos (whoosh, whoosh-corto,
  // enfoque) solo marcan transiciones con movimiento (zoom, barrido, subir) e imágenes, y nunca dos a menos
  // de 2.5 s: en reels de escenas cortas, un soplo por cambio se vuelve un zumbido constante. Si una imagen
  // se queda sin soplo, entra con un pop. Además: golpe en la palabra gigante (uno cada 6 s), tic en las
  // enumeraciones rápidas (escenas de menos de 1.2 s), tic por píldora, trazo en tachados y subrayados,
  // brillo en la palabra de neón (uno cada 4 s), subida antes del cierre y golpe grave en el cierre.
  const sfx = [];
  if (R.sonidos !== false) {
    const cand = [];   // [nombre, tiempo, prioridad] — la prioridad decide qué soplo queda si chocan
    escenas.forEach((e, i) => {
      const ant = escenas[i - 1];
      if (ant && ant.salida === 'zoom') cand.push(['whoosh', e.en - 0.35, 3]);
      else if (ant && (ant.salida === 'barrido' || ant.salida === 'subir')) cand.push(['whoosh-corto', e.en - 0.2, 2]);
      if (e.cierre && !CINE) { sfx.push(['boom', e.en - 0.08]); cand.push(['subida', e.en - 1.15, 4]); }
      const dura = (e.hasta ?? e.en + 2) - e.en;
      const primeras = (e.lineas || []).map((L) => (L.palabras || [])[0]).filter(Boolean);
      if (!CINE && dura < 1.2 && e.lineas && e.lineas.length === 1 && primeras[0]) cand.push(['tic', primeras[0].t, 2]);
      (e.lineas || []).forEach((L) => { if (L.tam === 'gigante' && L.palabras && L.palabras[0]) cand.push(['golpe', L.palabras[0].t, 2]); });
      (e.imagenes || (e.imagen ? [e.imagen] : [])).forEach((I) => {
        const t = I.en != null ? I.en : e.en + 0.05;
        const ent = I.entrada || 'enfoque';
        if (I.sonido === false) return;
        if (I.sonido) sfx.push([I.sonido, t]);
        else if (ent === 'caer') sfx.push(['pop', t + 0.45]);
        else cand.push([ent === 'enfoque' ? 'enfoque' : 'whoosh-corto', ent === 'enfoque' ? Math.max(0, t - 0.4) : t, 1]);
      });
      (e.etiquetas || []).forEach((et) => sfx.push(['tic', et.t]));
      (e.lineas || []).forEach((L) => (L.palabras || []).forEach((P) => {
        if (P.tachar || P.subrayar) sfx.push(['trazo', P.t + (P.tachar ? 0.4 : 0.25)]);
        if (CINE && P.acento) cand.push(['brillo', P.t, 0]);
      }));
    });
    // Primero los más importantes (zoom > barrido > imagen); cada uno entra solo si hay aire alrededor.
    const hueco = (n) => (SOPLOS.includes(n) ? 2.5 : n === 'golpe' ? 6 : n === 'brillo' ? 4 : 0.3);
    const choca = (n, t) => sfx.some((x) => (SOPLOS.includes(n) ? SOPLOS.includes(x[0]) : x[0] === n) && Math.abs(x[1] - t) < hueco(n));
    cand.sort((a, b) => b[2] - a[2] || a[1] - b[1]).forEach((c) => {
      if (!choca(c[0], c[1])) sfx.push([c[0], c[1]]);
      // Una imagen sin lugar para su soplo entra con un pop (si no hay otro efecto justo ahí).
      else if (c[2] === 1 && !sfx.some((x) => Math.abs(x[1] - (c[1] + 0.4)) < 0.45)) sfx.push(['pop', c[1] + (c[0] === 'enfoque' ? 0.4 : 0)]);
    });
  }
  const volSfx = R.volumenSonidos ?? 0.4;

  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const num = (n) => Math.round(n * 1000) / 1000;
  let pista = 0, medios = '';
  // Con grabación, el video va en una tarjeta sobre el papel (monocromo: en blanco y negro); su audio es la voz.
  let tarjetaVideo = '';
  if (video) tarjetaVideo = `\n  <div id="tv"><video id="grabacion" src="${esc(videoSrc)}" data-start="0" data-duration="${num(videoSrc !== video.src ? DUR : Math.min(DUR, durVideo))}" data-media-start="${num(videoSrc !== video.src ? 0 : video.inicio || 0)}" data-track-index="${++pista}" ${audioVideo ? 'data-has-audio="true"' : 'muted'} playsinline style="object-position:${esc(video.encuadre || '50% 30%')}"></video></div>`;
  if (voz) medios += `\n  <audio id="voz" src="${esc(voz.src)}" data-start="${num(voz.inicio || 0)}" data-duration="${num(Math.min(durVoz, DUR))}" data-volume="${voz.volumen ?? 1}" data-track-index="${++pista}"></audio>`;
  if (musicaMezclada) medios += `\n  <audio id="musica" src="${esc(musicaMezclada)}" data-start="0" data-duration="${DUR}" data-volume="1" data-track-index="${++pista}"></audio>`;
  const lista = depurar(sfx).filter(([, t]) => t >= 0 && t < DUR);
  lista.forEach(([n, t], i) => {
    medios += `\n  <audio id="sfx-${i}" src="motor/sfx/${n}.wav" data-start="${num(t)}" data-duration="${num(Math.min(SFX_DUR[n], DUR - t))}" data-volume="${n === 'boom' ? Math.min(1, volSfx * 1.6) : ['whoosh', 'whoosh-corto', 'enfoque'].includes(n) ? num(volSfx * 0.7) : volSfx}" data-track-index="${++pista}"></audio>`;
  });

  const leer = (f) => {
    const q = path.join(dir, 'motor', f);
    if (!fs.existsSync(q)) falla(`Falta motor/${f}. Copia la carpeta plantilla/motor del skill a tu proyecto.`);
    return fs.readFileSync(q, 'utf8').replace(/<\/script/gi, '<\\/script');
  };
  if (CINE && !existe('motor/fuentes/BodoniModa.ttf')) falla('Falta motor/fuentes/BodoniModa.ttf: copia otra vez la carpeta plantilla/motor del skill a tu proyecto.');
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  const mono = OPC.fuente || 'Montserrat';
  const sans = OPC.fuenteSans || 'Inter';
  const html = `<!doctype html>
<!-- GENERADO por reels-animados/armar.mjs (estilo ${R.modo}) a partir de reel.js — no edites este archivo: edita reel.js y vuelve a armar. -->
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${esc(R.titulo || 'Reel')}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${leer('cinetica.css')}
${fontFaces}:root { --acento: ${C.acento}; --acento-claro: ${acentoClaro}; --f-mono: "${mono}"; --f-sans: "${sans}"; }
.f-mono { font-family: "${mono}", sans-serif; } .f-sans { font-family: "${sans}", sans-serif; }
#destello { background: ${OPC.destello || C.acento}; }
</style>
</head>
<body>
<div id="root" data-composition-id="reel" data-start="0" data-width="${W}" data-height="${H}" data-duration="${DUR}">
  <div id="fondo" class="capa"></div>${CINE ? '\n  <div id="crema" class="capa"></div>' : '\n  <div id="adornos" class="capa"></div>'}
${tarjetaVideo}
  <div id="escenas" style="position:absolute; left:0; top:0; width:${W}px; height:${H}px"></div>
  ${CINE ? '' : '<div id="logo-fijo"></div>\n  '}<div id="destello" class="capa"></div>${CINE ? '\n  <div id="negro-final" class="capa"></div>' : ''}${medios}
</div>
<script>
window.REEL = ${json(R)};
window.REEL_TEMA = ${json(R.modo)};
window.REEL_FUENTES = ${json({ mono, sans })};
window.REEL_LOGO = ${json(logo)};
</script>
<script>
${leer('cinetica.js')}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✔ index.html armado (${R.modo}) · ${R.formato || '9:16'} (${W}×${H}) · ${DUR}s · ${escenas.length} escenas · ${lista.length} sonidos`);
  escenas.forEach((e, i) => console.log(`   #${String(i + 1).padStart(2)} ${e.en.toFixed(2)}–${(e.hasta ?? DUR).toFixed(2)}s  ${e.cierre ? '[cierre]' : e.lineas.map((L) => L.texto).join(' / ').slice(0, 70)}`));
  avisos.forEach((a) => console.log('  ⚠ ' + a));
}
