#!/usr/bin/env node
// Música de fondo con Suno (vía sunoapi.org) para tu biblioteca local. Opcional: sin llave, la skill funciona igual.
//
//   node musica.mjs "<estilo>" --nombre energico [--duracion 40] [--modelo V5_5]
//   node musica.mjs --lista        → muestra tu biblioteca
//   node musica.mjs --creditos     → créditos que te quedan
//
// La llave va en ~/.reels-animados/keys.env como SUNO_API_KEY=... (nunca en el proyecto ni en el chat).
// Las pistas se guardan en ~/.reels-animados/musica/<nombre>-1.mp3 y -2.mp3 (Suno entrega dos variantes),
// con una ficha .json al lado: prompt, modelo, fecha y proveedor, para saber de dónde salió cada una.
// Sus derechos de uso dependen de los términos de Suno/sunoapi.org y de tu plan: no las subas a un repositorio público.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const BASE = 'https://api.sunoapi.org/api/v1';
const casa = path.join(os.homedir(), '.reels-animados');
const biblioteca = path.join(casa, 'musica');

function llave() {
  if (process.env.SUNO_API_KEY) return process.env.SUNO_API_KEY.trim();
  const f = path.join(casa, 'keys.env');
  const m = fs.existsSync(f) && /^SUNO_API_KEY=(.+)$/m.exec(fs.readFileSync(f, 'utf8'));
  if (!m) { console.error(`✖ Falta la llave de Suno. Guárdala en ${f} como SUNO_API_KEY=... (no la pegues en el chat).`); process.exit(1); }
  return m[1].trim();
}
async function api(ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: cuerpo ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + llave(), 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.code !== 200) throw new Error(`${ruta}: ${j.msg || r.status}`);
  return j.data;
}

if (args.includes('--creditos')) {
  console.log(`Créditos de Suno: ${await api('/generate/credit')}`);
  process.exit(0);
}
if (args.includes('--lista')) {
  if (!fs.existsSync(biblioteca)) { console.log('Tu biblioteca de música está vacía.'); process.exit(0); }
  for (const f of fs.readdirSync(biblioteca).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(biblioteca, f), 'utf8'));
    console.log(`• ${d.nombre}: ${d.pistas.map((p) => `${path.basename(p.archivo)} (${p.duracion.toFixed(0)} s)`).join(', ')} — ${d.estilo}`);
  }
  process.exit(0);
}

const estilo = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const nombre = opt('nombre');
if (!estilo || !nombre) { console.error('Uso: node musica.mjs "<estilo>" --nombre <nombre> [--duracion 40] [--modelo V5_5]'); process.exit(1); }
const duracion = Math.max(10, Math.min(360, parseInt(opt('duracion', '45'), 10)));
const modelo = opt('modelo', 'V5_5');

const antes = await api('/generate/credit');
const tarea = await api('/generate', {
  customMode: true,
  instrumental: true,                 // fondo para voz: sin letra
  model: modelo,
  style: estilo.slice(0, 900),
  title: nombre.slice(0, 80),
  negativeTags: 'vocals, singing, voice, choir, lyrics',
  duration: duracion,                 // solo V5_5 / V6: pista a la medida del reel
  callBackUrl: 'https://example.com/reels-animados',   // obligatorio en la API; consultamos el estado nosotros
});
console.log(`… generando «${nombre}» (${modelo}, ~${duracion} s). Suele tardar 1-3 minutos.`);

let datos;
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 8000));
  datos = await api(`/generate/record-info?taskId=${tarea.taskId}`);
  if (datos.status === 'SUCCESS') break;
  if (/FAILED|ERROR|EXCEPTION/.test(datos.status || '')) throw new Error(`Suno no pudo generar: ${datos.status} ${datos.errorMessage || ''}`);
}
if (datos.status !== 'SUCCESS') throw new Error('Suno tardó demasiado; vuelve a intentar más tarde.');

fs.mkdirSync(biblioteca, { recursive: true });
const pistas = [];
for (const [k, s] of (datos.response.sunoData || []).entries()) {
  const url = s.audioUrl || s.audio_url || s.sourceAudioUrl || s.source_audio_url;
  if (!url) continue;
  const archivo = path.join(biblioteca, `${nombre}-${k + 1}.mp3`);
  fs.writeFileSync(archivo, Buffer.from(await (await fetch(url)).arrayBuffer()));   // los archivos de Suno caducan: se bajan ya
  pistas.push({ archivo, duracion: s.duration || 0, id: s.id });
}
const ficha = { nombre, estilo, modelo, proveedor: 'Suno vía sunoapi.org', fecha: new Date().toISOString(), pistas };
fs.writeFileSync(path.join(biblioteca, `${nombre}.json`), JSON.stringify(ficha, null, 2));
const despues = await api('/generate/credit').catch(() => null);
pistas.forEach((p) => console.log(`✔ ${p.archivo} (${p.duracion.toFixed(1)} s)`));
if (despues != null) console.log(`  créditos: ${antes} → ${despues} (−${(antes - despues).toFixed(1)})`);
