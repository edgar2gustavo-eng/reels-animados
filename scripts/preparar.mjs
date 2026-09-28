#!/usr/bin/env node
// Revisa (y si falta, instala) lo que necesita reels-animados. Se corre una vez por máquina.
// Uso: node preparar.mjs            instala todo: transcripción, voces IA, quitar fondos y el navegador de render
//   --sin-voz       no instala la voz IA local (~350 MB)
//   --sin-recortes  no instala rembg (quitar fondos de imágenes, ~180 MB)
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const casa = path.join(os.homedir(), '.reels-animados');
const venv = path.join(casa, 'venv');
const win = process.platform === 'win32';
const py = path.join(venv, win ? 'Scripts' : 'bin', win ? 'python.exe' : 'python');
const conVoz = !process.argv.includes('--sin-voz');   // --voz se acepta por compatibilidad
const conRecortes = !process.argv.includes('--sin-recortes');
// Versión de HyperFrames probada con esta skill. Las más nuevas pueden cambiar reglas del render:
// antes de subirla, prueba los 4 estilos (ver references/errores.md).
const HF = 'hyperframes@0.8.86';
let ok = true;
const bien = (m) => console.log('  ✔ ' + m);
const mal = (m) => { ok = false; console.log('  ✖ ' + m); };
// El shell solo hace falta para npx en Windows (es un .cmd); con él, los argumentos con espacios se rompen.
const corre = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: win && cmd === 'npx' });

console.log('reels-animados · revisión del equipo\n');

// Node 22+
const [mayor] = process.versions.node.split('.').map(Number);
mayor >= 22 ? bien(`Node ${process.versions.node}`) : mal(`Node ${process.versions.node}: HyperFrames necesita Node 22 o más nuevo (https://nodejs.org)`);

// ffmpeg / ffprobe
for (const b of ['ffmpeg', 'ffprobe']) {
  const r = corre(b, ['-version']);
  r.status === 0 ? bien(r.stdout.split('\n')[0].slice(0, 60)) : mal(`${b} no está instalado (Windows: winget install ffmpeg · Mac: brew install ffmpeg · Linux: apt install ffmpeg)`);
}

// HyperFrames (se descarga con npx la primera vez) y su navegador para renderizar (Chrome headless, ~100 MB).
// Sin el navegador, «check» y «render» fallan con «Failed to launch the browser process».
const hf = corre('npx', ['-y', HF, '--version']);
if (hf.status === 0) {
  bien('HyperFrames ' + hf.stdout.trim().split('\n').pop());
  const nav = corre('npx', ['-y', HF, 'browser', 'ensure']);
  nav.status === 0 ? bien('Navegador para renderizar: listo') : mal('No pude preparar el navegador de HyperFrames: corre «npx ' + HF + ' browser ensure --force» y revisa tu conexión');
} else mal('No pude ejecutar "npx ' + HF + '": ' + (hf.stderr || '').slice(0, 200));

// Python + entorno propio para transcribir (y la voz opcional)
const pythons = win ? ['py', 'python', 'python3'] : ['python3', 'python'];
let sistema = null;
for (const p of pythons) {
  const r = corre(p, ['-c', 'import sys; print(sys.version_info[:2] >= (3, 9))']);
  if (r.status === 0 && r.stdout.trim() === 'True') { sistema = p; break; }
}
if (!fs.existsSync(py)) {
  if (!sistema) mal('Python 3.9+ no está instalado (https://www.python.org/downloads/)');
  else {
    console.log(`  … creando entorno de Python en ${venv}`);
    fs.mkdirSync(casa, { recursive: true });
    execFileSync(sistema, ['-m', 'venv', venv], { stdio: 'inherit' });
  }
}
if (fs.existsSync(py)) {
  // rembg + scipy: quitar el fondo de las imágenes que suba el creador (recortar.py). Se instala siempre,
  // salvo con --sin-recortes.
  const paquetes = ['faster-whisper', ...(conVoz ? ['kokoro-onnx', 'soundfile'] : []), ...(conRecortes ? ['rembg[cpu]', 'scipy'] : [])];
  const modulo = (p) => p.replace(/\[.*\]$/, '').replace('-', '_');
  const faltan = paquetes.filter((p) => corre(py, ['-c', `import ${modulo(p)}`]).status !== 0);
  if (faltan.length) {
    console.log(`  … instalando ${faltan.join(', ')} (puede tardar unos minutos)`);
    execFileSync(py, ['-m', 'pip', 'install', '-q', ...faltan], { stdio: 'inherit' });
  }
  bien('Transcripción: faster-whisper listo');
  if (conRecortes) {
    // El modelo (~180 MB) se baja ahora para que el primer recorte no tarde.
    const modelo = path.join(os.homedir(), '.rembg', 'models', 'isnet-general-use', 'isnet-general-use.onnx');
    const modeloViejo = path.join(os.homedir(), '.u2net', 'isnet-general-use.onnx');
    if (!fs.existsSync(modelo) && !fs.existsSync(modeloViejo)) {
      console.log('  … descargando el modelo para quitar fondos (una sola vez, ~180 MB)');
      spawnSync(py, ['-c', "from rembg import new_session; new_session('isnet-general-use')"], { stdio: 'inherit' });
    }
    bien('Quitar fondos de imágenes: rembg listo (scripts/recortar.py)');
  }
  if (conVoz) {
    // El modelo de voz (~350 MB) lo descarga HyperFrames la primera vez que habla; voz.py lo reutiliza.
    const cache = path.join(os.homedir(), '.cache', 'hyperframes', 'tts');
    if (!fs.existsSync(path.join(cache, 'voices', 'voices-v1.0.bin'))) {
      console.log('  … descargando el modelo de voz (una sola vez, ~350 MB)');
      const tmp = path.join(os.tmpdir(), 'reels-hola.wav');
      spawnSync('npx', ['-y', HF, 'tts', 'hola', '-v', 'ef_dora', '-o', tmp], { stdio: 'inherit', shell: win, env: { ...process.env, HYPERFRAMES_PYTHON: py } });
    }
    fs.existsSync(path.join(cache, 'voices', 'voices-v1.0.bin'))
      ? bien('Voz IA local: dora, alex y santa listas (scripts/voz.py)')
      : mal('No se pudo descargar el modelo de voz: revisa tu conexión y vuelve a correr preparar.mjs');
  }
}

// Marca
const marca = path.join(casa, 'marca.json');
fs.existsSync(marca) ? bien('Kit de marca: ' + marca) : console.log('  • Todavía no hay kit de marca (se crea en la primera conversación).');

console.log('\nPython del skill: ' + py);
console.log(ok ? '\nTodo listo.' : '\nFalta algo: arregla lo marcado con ✖ y vuelve a correr este script.');
process.exit(ok ? 0 : 1);
