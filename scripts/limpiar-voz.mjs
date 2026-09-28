#!/usr/bin/env node
// Deja una voz grabada con el celular sonando "de locutor": quita graves de fondo y ruido,
// suaviza las eses, comprime y normaliza el volumen. Sirve para audio o video (el video se copia tal cual).
//
//   node limpiar-voz.mjs <entrada> [salida] [--ruido suave|medio|fuerte|no] [--probar]
//   --probar  escribe solo los primeros 12 s, para comparar antes de procesar todo
//
// La voz IA ya sale limpia: esto es para voces grabadas.
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const libres = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--ruido'].includes(args[i - 1])));
const [entrada, salidaArg] = libres;
if (!entrada) { console.error('Uso: node limpiar-voz.mjs <entrada> [salida] [--ruido suave|medio|fuerte|no] [--probar]'); process.exit(1); }

const probe = (q) => execFileSync('ffprobe', ['-v', 'error', ...q, '-of', 'csv=p=0', entrada]).toString().trim();
const esVideo = probe(['-select_streams', 'v', '-show_entries', 'stream=index']) !== '';
const ext = path.extname(entrada);
const salida = salidaArg || entrada.replace(ext, '-limpia' + (esVideo ? ext : '.wav'));

// Medido con voz + ruido rosa: afftdn solo casi no cambia nada en las pausas; lo que más ayuda es la
// puerta (agate), que baja el ruido cuando no se habla. "medio" llevó la relación voz/ruido de 21 a 37 dB
// sin comerse finales de palabra.
const NIVELES = {
  no: [],
  suave: ['afftdn=nr=12:nf=-45:tn=1', 'agate=threshold=0.015:ratio=2:attack=5:release=200:range=0.25'],
  medio: ['afftdn=nr=20:nf=-45:tn=1', 'agate=threshold=0.02:ratio=4:attack=5:release=150:range=0.1'],
  fuerte: ['afftdn=nr=30:nf=-40:tn=1', 'agate=threshold=0.03:ratio=6:attack=5:release=150:range=0.05'],
};
const nivel = opt('ruido', 'medio');
if (!NIVELES[nivel]) { console.error('--ruido debe ser: suave, medio, fuerte o no'); process.exit(1); }

const cadena = [
  'highpass=f=80',                                   // fuera el zumbido y los golpes graves
  ...NIVELES[nivel],                                 // fuera el ruido de fondo (ventilador, calle)
  'deesser=i=0.3',                                   // eses menos filosas
  'acompressor=threshold=-21dB:ratio=3:attack=8:release=120:makeup=2',  // voz pareja, sin saltos de volumen
  'loudnorm=I=-16:TP=-1.5:LRA=9',                    // volumen de voz estándar
  'aresample=48000',
].join(',');

const corto = args.includes('--probar') ? ['-t', '12'] : [];
const codec = esVideo ? ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k'] : ['-c:a', 'pcm_s16le'];
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', entrada, ...corto, '-af', cadena, ...codec, salida], { stdio: 'inherit' });

// Mide el resultado para confirmar que quedó en el nivel esperado.
const medida = spawnSync('ffmpeg', ['-hide_banner', '-i', salida, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const lufs = /I:\s+(-?[\d.]+) LUFS/g, todos = [...medida.matchAll(lufs)];
console.log(`✔ ${salida}${corto.length ? ' (solo 12 s de prueba)' : ''} · volumen ${todos.length ? todos[todos.length - 1][1] + ' LUFS' : '?'} · ruido: ${opt('ruido', 'medio')}`);
