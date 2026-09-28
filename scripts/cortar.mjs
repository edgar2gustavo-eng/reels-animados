#!/usr/bin/env node
// Cortes inteligentes a partir de la transcripción: pausas largas, muletillas y repeticiones.
// Sirve para video (grabación a cámara) y para audio solo (voz en off).
//
//   node cortar.mjs proponer <medio> [palabras.json] [--pausa 0.35] [--aire 0.12]
//        → escribe cortes.json con lo que quitaría y lo muestra. No toca nada.
//   node cortar.mjs aplicar [cortes.json] [--salida assets/voz-cortada.wav]
//        → corta el medio (con fundidos de 30 ms en cada unión) y escribe palabras.json
//          con los tiempos nuevos. No hace falta volver a transcribir.
//
// En cortes.json cada corte tiene "aplicar": true/false. Las muletillas dudosas ("este",
// "o sea", "bueno"…) vienen en false: revísalas y cámbialas a true si sobran.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const modo = args[0];
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const libres = args.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(i > 0 && arr[i - 1].startsWith('--')));
const leer = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const clave = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9ñ]/g, '');
const r3 = (n) => Math.round(n * 1000) / 1000;
const probe = (f, q) => execFileSync('ffprobe', ['-v', 'error', ...q, '-of', 'csv=p=0', f]).toString().trim();

// Muletillas que casi siempre sobran / que solo a veces sobran (dependen del contexto).
const SEGURAS = new Set(['eh', 'ehh', 'ehhh', 'em', 'emm', 'mm', 'mmm', 'hmm', 'ah', 'ahh', 'uh', 'um']);
const DUDOSAS = [['o', 'sea'], ['este'], ['bueno'], ['pues'], ['no'], ['digamos'], ['osea'], ['tipo'], ['sabes']];

if (modo === 'proponer') proponer();
else if (modo === 'aplicar') aplicar();
else {
  console.error('Uso:\n  node cortar.mjs proponer <medio> [palabras.json] [--pausa 0.35] [--aire 0.12]\n  node cortar.mjs aplicar [cortes.json] [--salida ruta]');
  process.exit(1);
}

function proponer() {
  const [medio, rutaPal = 'palabras.json'] = libres;
  if (!medio || !fs.existsSync(medio)) { console.error('✖ Falta el medio (video o audio) a cortar.'); process.exit(1); }
  if (!fs.existsSync(rutaPal)) { console.error(`✖ No existe ${rutaPal}: transcribe primero con transcribir.py.`); process.exit(1); }
  const P = leer(rutaPal);
  const pausa = parseFloat(opt('pausa', 0.35)), aire = parseFloat(opt('aire', 0.12));
  const duracion = parseFloat(probe(medio, ['-show_entries', 'format=duration']));
  const cortes = [];
  const agregar = (tipo, desde, hasta, texto, aplicar = true) => {
    if (hasta - desde >= 0.06) cortes.push({ tipo, desde: r3(desde), hasta: r3(hasta), texto, aplicar });
  };

  // Silencio antes de la primera palabra y después de la última.
  if (P.length) {
    agregar('pausa', 0, Math.max(0, P[0].start - aire), '(inicio)');
    agregar('pausa', Math.min(duracion, P[P.length - 1].end + aire * 2), duracion, '(final)');
  }
  // Pausas largas entre palabras: deja "aire" a cada lado para que no suene atropellado.
  for (let i = 0; i < P.length - 1; i++) {
    const hueco = P[i + 1].start - P[i].end;
    if (hueco > pausa) agregar('pausa', P[i].end + aire, P[i + 1].start - aire, `${hueco.toFixed(2)} s entre «${P[i].text}» y «${P[i + 1].text}»`);
  }
  // Muletillas. Whisper marca mal los bordes de estas palabras cortas: se corta todo el hueco
  // entre la palabra anterior y la siguiente, o queda un resto ("bueno" → "no").
  const hueco = (i, j) => [P[i - 1] ? Math.max(P[i].start - 0.08, P[i - 1].end + 0.03) : P[i].start - 0.02,
                           P[j + 1] ? Math.max(P[j].end + 0.02, P[j + 1].start - 0.03) : P[j].end + 0.05];
  P.forEach((p, i) => {
    if (SEGURAS.has(clave(p.text))) agregar('muletilla', ...hueco(i, i), p.text);
  });
  for (let i = 0; i < P.length; i++) {
    for (const m of DUDOSAS) {
      const trozo = P.slice(i, i + m.length);
      if (trozo.length === m.length && trozo.every((p, k) => clave(p.text) === m[k])) {
        // Solo la sugerimos si va separada por una pausa o una coma: "este..." de relleno, no "este libro".
        // Es una sugerencia (aplicar: false), así que basta con que esté aislada de un lado.
        const antes = P[i - 1], despues = P[i + m.length];
        const aislada = !antes || trozo[0].start - antes.end > 0.15 || /[,.…?!]$/.test(antes.text) ||
                        !despues || despues.start - trozo[m.length - 1].end > 0.15 || /[,…]$/.test(trozo[m.length - 1].text);
        if (aislada) agregar('muletilla?', ...hueco(i, i + m.length - 1), trozo.map((p) => p.text).join(' '), false);
      }
    }
  }
  // Repeticiones seguidas ("el el", "hoy te voy a, hoy te voy a enseñar"): quita la primera.
  for (let n = 6; n >= 1; n--) {
    for (let i = 0; i + 2 * n <= P.length; i++) {
      const a = P.slice(i, i + n).map((p) => clave(p.text)), b = P.slice(i + n, i + 2 * n).map((p) => clave(p.text));
      if (a.join(' ') === b.join(' ') && a.join('').length > 1 && !yaCubierto(cortes, P[i].start)) {
        agregar('repeticion', P[i].start - 0.02, P[i + n].start - 0.02, P.slice(i, i + n).map((p) => p.text).join(' '));
        i += n - 1;
      }
    }
  }

  cortes.sort((x, y) => x.desde - y.desde);
  const salida = { medio, palabras: rutaPal, duracion: r3(duracion), cortes };
  fs.writeFileSync('cortes.json', JSON.stringify(salida, null, 1));
  const quita = cortes.filter((c) => c.aplicar).reduce((s, c) => s + (c.hasta - c.desde), 0);
  console.log(`✔ cortes.json · ${cortes.length} cortes propuestos · quitaría ${quita.toFixed(1)} s de ${duracion.toFixed(1)} s`);
  cortes.forEach((c, i) => console.log(`  ${String(i + 1).padStart(2)}. ${c.aplicar ? '✂' : '?'} ${c.tipo.padEnd(10)} ${c.desde.toFixed(2)}–${c.hasta.toFixed(2)}  ${c.texto}`));
  if (cortes.some((c) => !c.aplicar)) console.log('  (? = dudoso, en false: cámbialo a true en cortes.json si sobra)');
}

function yaCubierto(cortes, t) { return cortes.some((c) => c.tipo === 'repeticion' && t >= c.desde && t < c.hasta); }

function aplicar() {
  const rutaCortes = libres[0] || 'cortes.json';
  const C = leer(rutaCortes);
  const P = leer(C.palabras);
  const esVideo = probe(C.medio, ['-select_streams', 'v', '-show_entries', 'stream=index']) !== '';
  const ext = path.extname(C.medio);
  const salida = opt('salida', C.medio.replace(ext, '-cortado' + (esVideo ? ext : '.wav')));

  // Tramos que se conservan = todo menos la unión de los cortes aplicados.
  const fuera = C.cortes.filter((c) => c.aplicar).map((c) => [Math.max(0, c.desde), Math.min(C.duracion, c.hasta)]).sort((a, b) => a[0] - b[0]);
  const unidos = [];
  for (const f of fuera) { const u = unidos[unidos.length - 1]; if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]); else unidos.push([...f]); }
  let tramos = [], cursor = 0;
  for (const [a, b] of unidos) { if (a > cursor) tramos.push([cursor, a]); cursor = b; }
  if (cursor < C.duracion) tramos.push([cursor, C.duracion]);
  if (esVideo) {
    // En video, cada corte cae justo en un límite de cuadro: así audio e imagen no se desfasan.
    const [fn, fd] = probe(C.medio, ['-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate']).split('/').map(Number);
    const fps = fn / (fd || 1);
    tramos = tramos.map(([a, b]) => [Math.round(a * fps) / fps, Math.round(b * fps) / fps]);
  }
  tramos = tramos.filter(([a, b]) => b - a > 0.05);

  // Un solo filtro: cada tramo con fundido de 30 ms de entrada y salida (evita el "clic" al unir).
  const F = 0.03;
  let fc = '';
  tramos.forEach(([a, b], k) => {
    const d = b - a;
    fc += `[0:a]atrim=${a.toFixed(4)}:${b.toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=${F},afade=t=out:st=${Math.max(0, d - F).toFixed(4)}:d=${F}[a${k}];\n`;
    if (esVideo) fc += `[0:v]trim=${a.toFixed(4)}:${b.toFixed(4)},setpts=PTS-STARTPTS[v${k}];\n`;
  });
  fc += tramos.map((_, k) => (esVideo ? `[v${k}]` : '') + `[a${k}]`).join('') + `concat=n=${tramos.length}:v=${esVideo ? 1 : 0}:a=1` + (esVideo ? '[v][a]' : '[a]');
  const archivoFiltro = path.join(os.tmpdir(), `reels-cortes-${process.pid}.txt`);
  fs.writeFileSync(archivoFiltro, fc);
  const codec = esVideo
    ? ['-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k']
    : ['-map', '[a]', '-c:a', 'pcm_s16le'];
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', C.medio, '-/filter_complex', archivoFiltro, ...codec, salida], { stdio: 'inherit' });
  fs.unlinkSync(archivoFiltro);

  // Reubica cada palabra en el tiempo nuevo; las que caen en un corte desaparecen.
  let offset = 0;
  const mapa = tramos.map(([a, b]) => { const m = { a, b, off: offset }; offset += b - a; return m; });
  const nuevas = [];
  for (const p of P) {
    const centro = (p.start + p.end) / 2;
    const m = mapa.find((t) => centro >= t.a && centro < t.b);
    if (!m) continue;
    // Si lo anterior se cortó y esta palabra ahora abre la frase, va con mayúscula.
    const previa = nuevas[nuevas.length - 1];
    let text = p.text;
    if (!previa || /[.?!…]$/.test(previa.text)) text = text.charAt(0).toUpperCase() + text.slice(1);
    nuevas.push({ id: 'w' + nuevas.length, text, start: r3(Math.max(m.a, p.start) - m.a + m.off), end: r3(Math.min(m.b, p.end) - m.a + m.off) });
  }
  const rutaPal = opt('palabras', C.palabras);
  fs.writeFileSync(C.palabras.replace(/\.json$/, '-original.json'), JSON.stringify(P, null, 1));
  fs.writeFileSync(rutaPal, JSON.stringify(nuevas, null, 1));
  const dur = parseFloat(probe(salida, ['-show_entries', 'format=duration']));
  console.log(`✔ ${salida} · ${C.duracion.toFixed(1)} s → ${dur.toFixed(1)} s · ${tramos.length} tramos con fundido`);
  console.log(`✔ ${rutaPal} actualizado (${P.length} → ${nuevas.length} palabras; el original quedó en ${C.palabras.replace(/\.json$/, '-original.json')})`);
  console.log(`  Recuerda apuntar reel.js a ${salida}.`);
}
