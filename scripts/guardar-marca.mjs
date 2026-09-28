#!/usr/bin/env node
// Guarda (o muestra) tu kit de marca en ~/.reels-animados/marca.json.
// Uso:
//   node guardar-marca.mjs ruta/a/marca.json    → la valida y la copia como tu marca
//   node guardar-marca.mjs                      → muestra la marca guardada
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const destino = path.join(os.homedir(), '.reels-animados', 'marca.json');
const origen = process.argv[2];

if (!origen) {
  if (!fs.existsSync(destino)) { console.log('Todavía no hay marca guardada en ' + destino); process.exit(2); }
  console.log(fs.readFileSync(destino, 'utf8'));
  process.exit(0);
}

const m = JSON.parse(fs.readFileSync(origen, 'utf8'));
const errores = [];
const esHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c || '');
for (const k of ['fondo', 'texto', 'acento', 'suave']) if (!esHex((m.colores || {})[k])) errores.push(`colores.${k} debe ser un color #RRGGBB`);
if (m.usuario && !m.usuario.startsWith('@')) m.usuario = '@' + m.usuario;
if (m.logo) {
  m.logo = path.resolve(m.logo.replace(/^~/, os.homedir()));
  if (!fs.existsSync(m.logo)) errores.push('no existe el logo ' + m.logo);
}
for (const rol of ['titulo', 'texto']) {
  const f = (m.fuentes || {})[rol];
  if (f && typeof f === 'object') {
    f.archivo = path.resolve(f.archivo.replace(/^~/, os.homedir()));
    if (!fs.existsSync(f.archivo)) errores.push(`no existe la fuente ${f.archivo}`);
  }
}
if (errores.length) { console.error('✖ ' + errores.join('\n✖ ')); process.exit(1); }

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(m, null, 2));
console.log('✔ Marca guardada en ' + destino);
