#!/usr/bin/env node
// Revisa (y si falta, instala) lo que necesita reels-animados. Se corre una vez por máquina.
// Uso: node preparar.mjs [--voz]    (--voz instala también la voz IA local en español)
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const casa = path.join(os.homedir(), '.reels-animados');
const venv = path.join(casa, 'venv');
const win = process.platform === 'win32';
const py = path.join(venv, win ? 'Scripts' : 'bin', win ? 'python.exe' : 'python');
const conVoz = process.argv.includes('--voz');
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

// HyperFrames (se descarga con npx la primera vez)
const hf = corre('npx', ['-y', 'hyperframes', '--version']);
hf.status === 0 ? bien('HyperFrames ' + hf.stdout.trim().split('\n').pop()) : mal('No pude ejecutar "npx hyperframes": ' + (hf.stderr || '').slice(0, 200));

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
  // --recortes: rembg + scipy para quitar el fondo de imágenes (recortar.py, estilos monocromo y cine).
  const conRecortes = process.argv.includes('--recortes');
  const paquetes = ['faster-whisper', ...(conVoz ? ['kokoro-onnx', 'soundfile'] : []), ...(conRecortes ? ['rembg[cpu]', 'scipy'] : [])];
  const modulo = (p) => p.replace(/\[.*\]$/, '').replace('-', '_');
  const faltan = paquetes.filter((p) => corre(py, ['-c', `import ${modulo(p)}`]).status !== 0);
  if (faltan.length) {
    console.log(`  … instalando ${faltan.join(', ')} (puede tardar unos minutos)`);
    execFileSync(py, ['-m', 'pip', 'install', '-q', ...faltan], { stdio: 'inherit' });
  }
  bien('Transcripción: faster-whisper listo');
  if (conRecortes) bien('Recortes: rembg listo (el modelo, ~180 MB, se descarga la primera vez que recortas)');
  if (conVoz) {
    // El modelo de voz (~350 MB) lo descarga HyperFrames la primera vez que habla; voz.py lo reutiliza.
    const cache = path.join(os.homedir(), '.cache', 'hyperframes', 'tts');
    if (!fs.existsSync(path.join(cache, 'voices', 'voices-v1.0.bin'))) {
      console.log('  … descargando el modelo de voz (una sola vez, ~350 MB)');
      const tmp = path.join(os.tmpdir(), 'reels-hola.wav');
      spawnSync('npx', ['-y', 'hyperframes', 'tts', 'hola', '-v', 'ef_dora', '-o', tmp], { stdio: 'inherit', shell: win, env: { ...process.env, HYPERFRAMES_PYTHON: py } });
    }
    fs.existsSync(path.join(cache, 'voices', 'voices-v1.0.bin'))
      ? bien('Voz IA local: dora, alex y santa listas (scripts/voz.py)')
      : mal('No se pudo descargar el modelo de voz: revisa tu conexión y vuelve a correr con --voz');
  }
}

// Marca
const marca = path.join(casa, 'marca.json');
fs.existsSync(marca) ? bien('Kit de marca: ' + marca) : console.log('  • Todavía no hay kit de marca (se crea en la primera conversación).');

console.log('\nPython del skill: ' + py);
console.log(ok ? '\nTodo listo.' : '\nFalta algo: arregla lo marcado con ✖ y vuelve a correr este script.');
process.exit(ok ? 0 : 1);
