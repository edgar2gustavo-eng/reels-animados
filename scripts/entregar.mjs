#!/usr/bin/env node
// Último paso: deja el render listo para publicar y lo revisa.
//   node entregar.mjs <render.mp4> [--nombre mi-reel] [--portada 1.5]
// (se corre dentro de la carpeta del proyecto)
//
// Hace:
//  1. Volumen final a -14 LUFS / pico -1 dB (lo que usan Instagram, TikTok y YouTube; así no te bajan ni te suben el volumen).
//  2. Versión liviana (720p) para WhatsApp o para mandar a un cliente.
//  3. Portada PNG en el segundo indicado (por defecto, a mitad del gancho).
//  4. Revisión: duración, audio presente, cuadros negros, silencios largos, volumen medido.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const entrada = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!entrada || !fs.existsSync(entrada)) { console.error('Uso: node entregar.mjs <render.mp4> [--nombre mi-reel] [--portada 1.5]'); process.exit(1); }
const nombre = opt('nombre', path.basename(entrada, '.mp4').replace(/-(borrador|render)$/, ''));
const carpeta = 'renders';
fs.mkdirSync(carpeta, { recursive: true });
const ffErr = (a) => spawnSync('ffmpeg', ['-hide_banner', ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stderr;
const probe = (f, q) => execFileSync('ffprobe', ['-v', 'error', ...q, '-of', 'csv=p=0', f]).toString().trim();
const problemas = [], avisos = [], notas = [];

// ---------- 1. volumen final (dos pasadas: medir y luego corregir con precisión) ----------
const final = path.join(carpeta, nombre + '.mp4');
const tieneAudio = probe(entrada, ['-select_streams', 'a', '-show_entries', 'stream=index']) !== '';
if (tieneAudio) {
  const m = ffErr(['-i', entrada, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  const filtro = `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const tmp = final + '.tmp.mp4';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', entrada, '-c:v', 'copy', '-af', filtro, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, final);
  notas.push(`volumen: ${j.input_i} → -14 LUFS`);
} else {
  if (path.resolve(entrada) !== path.resolve(final)) fs.copyFileSync(entrada, final);
  problemas.push('el video no tiene audio');
}

// ---------- 2. versión liviana ----------
const liviana = path.join(carpeta, nombre + '-liviano.mp4');
const [w, h] = probe(final, ['-select_streams', 'v:0', '-show_entries', 'stream=width,height']).split(',').map(Number);
const escala = w < h ? 'scale=720:-2' : 'scale=-2:720';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', final, '-vf', escala, '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', liviana]);

// ---------- 3. portada ----------
let portada = null;
const tPortada = opt('portada', null) ?? leerGancho();
if (tPortada != null) {
  portada = path.join(carpeta, nombre + '-portada.png');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(tPortada), '-i', final, '-frames:v', '1', portada]);
}
function leerGancho() {
  try {
    const html = fs.readFileSync('index.html', 'utf8');
    const g = /"gancho":\{[^}]*?"hasta":([\d.]+)/.exec(html);
    return g ? Math.min(1.5, parseFloat(g[1]) * 0.5) : 1;
  } catch { return 1; }
}

// ---------- 4. revisión ----------
const dur = parseFloat(probe(final, ['-show_entries', 'format=duration']));
try {
  const esperada = parseFloat(/data-duration="([\d.]+)"/.exec(fs.readFileSync('index.html', 'utf8'))[1]);
  if (Math.abs(dur - esperada) > 0.15) problemas.push(`dura ${dur.toFixed(2)} s y debía durar ${esperada} s`);
} catch { /* sin index.html: no se compara */ }
// En el estilo cine el fondo es negro y a veces solo hay una palabra chica: ahí solo cuenta un negro largo.
let cine = false;
try { cine = /\(estilo cine\)/.test(fs.readFileSync('index.html', 'utf8')); } catch { /* sin index.html */ }
const negros = [...ffErr(['-i', final, '-vf', `blackdetect=d=${cine ? 2.2 : 0.25}:pic_th=0.97`, '-an', '-f', 'null', '-']).matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)];
negros.forEach((b) => problemas.push(`pantalla negra de ${(+b[1]).toFixed(2)} a ${(+b[2]).toFixed(2)} s`));
if (tieneAudio) {
  const sil = [...ffErr(['-i', final, '-af', 'silencedetect=noise=-50dB:d=1.5', '-vn', '-f', 'null', '-']).matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)];
  sil.forEach((s) => avisos.push(`silencio de ${(+s[1]).toFixed(1)} a ${(+s[2]).toFixed(1)} s: con música de fondo no se notaría`));
  const lu = [...ffErr(['-i', final, '-af', 'ebur128', '-vn', '-f', 'null', '-']).matchAll(/I:\s+(-?[\d.]+) LUFS/g)];
  if (lu.length) notas.push(`volumen medido: ${lu[lu.length - 1][1]} LUFS`);
}
const fps = probe(final, ['-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate']);
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1) + ' MB';

console.log(`✔ ${final} · ${w}×${h} · ${fps.replace('/1', '')} fps · ${dur.toFixed(2)} s · ${mb(final)}`);
console.log(`✔ ${liviana} · ${mb(liviana)}`);
if (portada) console.log(`✔ ${portada} (segundo ${tPortada})`);
notas.forEach((n) => console.log('  · ' + n));
avisos.forEach((a) => console.log('  ⚠ ' + a));
if (problemas.length) { problemas.forEach((p) => console.log('  ✖ ' + p)); process.exitCode = 2; }
else console.log('  Revisión: sin pantallas negras, con audio y duración correcta.');
