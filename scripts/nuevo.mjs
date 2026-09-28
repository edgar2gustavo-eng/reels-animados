#!/usr/bin/env node
// Crea la carpeta de un reel nuevo con el motor, tu marca y un reel.js listo para llenar.
// Uso:
//   node nuevo.mjs <carpeta> [--formato 9:16] [--video ruta.mp4] [--voz ruta.wav] [--marca ruta.json] [--modo editorial|monocromo|cine]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, def) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : def; };
const carpeta = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!carpeta) { console.error('Uso: node nuevo.mjs <carpeta> [--formato 9:16] [--video v.mp4] [--voz v.wav]'); process.exit(1); }

const dir = path.resolve(carpeta);
if (fs.existsSync(path.join(dir, 'reel.js'))) { console.error(`✖ ${dir} ya tiene un reel.js; no lo piso.`); process.exit(1); }
fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
fs.cpSync(path.join(aqui, '..', 'plantilla', 'motor'), path.join(dir, 'motor'), { recursive: true });

// ---------- marca ----------
const rutaMarca = opt('marca', path.join(os.homedir(), '.reels-animados', 'marca.json'));
let marca = {};
if (fs.existsSync(rutaMarca)) marca = JSON.parse(fs.readFileSync(rutaMarca, 'utf8'));
else console.log(`⚠ No hay kit de marca en ${rutaMarca}: uso colores neutros. Crea uno con guardar-marca.mjs.`);

// El proyecto guarda su propia copia del logo y las fuentes: así se puede mover o compartir.
const copiar = (origen, nombre) => {
  if (!origen) return null;
  const abs = path.resolve(origen.replace(/^~/, os.homedir()));
  if (!fs.existsSync(abs)) { console.log(`⚠ No existe ${abs}`); return null; }
  const rel = 'assets/' + (nombre || path.basename(abs));
  fs.copyFileSync(abs, path.join(dir, rel));
  return rel;
};
const logo = copiar(marca.logo, 'logo' + path.extname(marca.logo || '.png'));
const fuentes = {};
for (const rol of ['titulo', 'texto']) {
  const f = (marca.fuentes || {})[rol];
  if (f && typeof f === 'object') fuentes[rol] = { familia: f.familia, archivo: copiar(f.archivo) };
  else if (f) fuentes[rol] = f;
}
const video = copiar(opt('video'), 'grabacion' + path.extname(opt('video') || '.mp4'));
const voz = copiar(opt('voz'), 'voz' + path.extname(opt('voz') || '.wav'));

const marcaReel = {
  nombre: marca.nombre || '', usuario: marca.usuario || '',
  colores: marca.colores || { fondo: '#111111', texto: '#FFFFFF', acento: '#7C3AED', suave: '#C4B5FD' },
  fuentes: Object.keys(fuentes).length ? fuentes : { titulo: 'Montserrat', texto: 'Inter' },
  logo,
};
const cta = marca.cta || { texto: 'Sígueme para *más*', accion: 'seguir' };
const J = (o) => JSON.stringify(o, null, 2).replace(/\n/g, '\n  ');

const reel = `// Guion del reel en datos. Después de cada cambio: node <skill>/scripts/armar.mjs
// Campos y ejemplos de cada momento: references/reel-js.md del skill.
window.REEL = {
  titulo: '${path.basename(dir)}',
  formato: '${opt('formato', '9:16')}',          // 9:16 · 4:5 · 1:1 · 16:9
  // duracion: 30,                 // opcional: por defecto la del video/voz

  marca: ${J(marcaReel)},

  video: ${video ? `{ src: '${video}', inicio: 0, encuadre: '50% 50%', saltosZoom: true }` : 'null'},   // tu grabación (modo grabación)
  voz: ${voz ? `{ src: '${voz}' }` : 'null'},     // voz en off (modo texto)
  musica: null,                    // { src: 'assets/musica.mp3', volumen: 0.12, inicio: 0 }
  palabras: 'palabras.json',       // sale de scripts/transcribir.py

  subtitulos: { estilo: '${marca.subtitulos || 'pop'}' },   // pop · caja · resaltador · minimal · impacto · editorial
  enfasis: [],                     // palabras que se pintan con tu acento (las cifras ya se pintan solas)

  gancho: { texto: '', desde: 0, hasta: 3 },   // *asteriscos* = palabra resaltada

  momentos: [
    // { tipo: 'cifra', en: 4.2, texto: '90%', detalle: 'abandona en 3 s' },
  ],

  cta: ${J(cta)},
  barraProgreso: true,
  marcaDeAgua: true,
  sonidos: true,
};
`;
// Modo editorial: tipografía cinética sobre papel con objetos 3D (ver references/editorial.md).
const reelEditorial = `// Guion del reel en modo EDITORIAL. Después de cada cambio: node <skill>/scripts/armar.mjs
// Todos los bloques, objetos 3D y opciones: references/editorial.md del skill.
window.REEL = {
  titulo: '${path.basename(dir)}',
  modo: 'editorial',
  formato: '${opt('formato', '9:16')}',
  // duracion: 20,

  marca: ${J(marcaReel)},
  editorial: { papel: 'cuadriculado' },   // cuadriculado · puntos · liso
  voz: ${voz ? `{ src: '${voz}' }` : 'null'},
  musica: null,
  palabras: 'palabras.json',              // solo para leer los tiempos de cada frase

  escenas: [
    // { en: 0, hasta: 2, tarjeta: true,
    //   bloques: [{ texto: '¿Sabías', estilo: 'fuerte' }, { texto: 'que…?', estilo: 'fuerte' }],
    //   objetos: [{ tipo: 'esfera', lugar: 'tarjeta', tam: 120, entrada: 'caer' }] },
  ],
  sonidos: true,
};
`;
// Monocromo y cine: la tipografía sigue a la voz (ver references/monocromo-cine.md).
const modo = opt('modo');
const reelCinetica = `// Guion del reel en estilo ${String(modo).toUpperCase()}. Después de cada cambio: node <skill>/scripts/armar.mjs
// Cada línea aparece cuando la voz la dice (palabras.json): no hace falta poner tiempos.
// Líneas, marcas (*acento*, ~~tachado~~, _subrayado_), imágenes y salidas: references/monocromo-cine.md del skill.
window.REEL = {
  titulo: '${path.basename(dir)}',
  modo: '${modo}',
  formato: '${opt('formato', '9:16')}',

  marca: ${J(marcaReel)},
${video ? `  video: { src: '${video}', encuadre: '50% 40%', zoom: 1, proporcion: 1 },   // tarjeta con la grabación; zoom 1.3 acerca a la cara
  voz: null,` : `  voz: ${voz ? `{ src: '${voz}' }` : "{ src: 'assets/voz.wav' }"},`}
  palabras: 'palabras.json',
  musica: null,                            // { nombre: '${modo}-1' } de tu biblioteca (musica.mjs)

  escenas: [
${modo === 'cine' ? `    // { portada: true, lineas: [{ texto: 'Los creadores', tam: 'media', cursiva: true }, { texto: 'que venden', tam: 'grande' }],
    //   imagen: { src: 'assets/icono.png', y: 0.38, ancho: 0.3, entrada: 'caer', brillo: false } },
    // { lineas: [{ texto: 'No dependen', tam: 'grande' }, { texto: 'de la *suerte*.', tam: 'grande', cursiva: true, brillo: 'verde' }],
    //   imagen: { src: 'assets/trebol.png', ancho: 0.26, entrada: 'girar', brillo: 'verde', palabra: 'suerte' }, salida: 'barrido' },
    // { fondo: 'crema', lineas: [{ texto: 'Escríbenos por', tam: 'media', sans: true }, { texto: 'mensaje directo.', tam: 'grande', cursiva: true }] },`
    : `    // { lineas: [{ texto: 'Publicar más', tam: 'chica' }, { texto: 'Crecer', tam: 'gigante' }],
    //   imagen: { src: 'assets/calendario.png', y: 0.6, ancho: 0.56, rotar: -10 } },
    // { lineas: [{ texto: '3 preguntas', tam: 'grande' }], texto: { alinear: 'centro' }, etiquetas: ['¿Para quién es?', '¿Qué resuelve?'] },
    // { cierre: { lema: 'Tu lema', web: '@tuusuario' } },`}
  ],
  sonidos: true,
};
`;
const plantillas = { editorial: reelEditorial, monocromo: reelCinetica, cine: reelCinetica };
if (modo && !plantillas[modo]) { console.error(`✖ modo "${modo}" no existe. Usa: editorial, monocromo o cine (o nada, para el estilo dinámico).`); process.exit(1); }
fs.writeFileSync(path.join(dir, 'reel.js'), plantillas[modo] || reel);
fs.writeFileSync(path.join(dir, '.gitignore'), 'renders/\n*.mp4\n!assets/*.mp4\nsnapshots/\n.thumbnails/\n');
console.log(`✔ Proyecto listo en ${dir}`);
console.log(`  marca: ${marca.nombre || '(neutra)'} · ${modo ? 'estilo ' + modo + ' · ' : ''}formato ${opt('formato', '9:16')}${video ? ' · video ' + video : ''}${voz ? ' · voz ' + voz : ''}`);
