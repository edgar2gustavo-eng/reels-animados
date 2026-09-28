/* reels-animados · objetos 3D del modo editorial (Three.js, código abierto).
 * Todos los objetos se construyen con código: no se descarga ningún modelo.
 * El movimiento sale solo del tiempo que manda HyperFrames (hf-seek), así cada cuadro es repetible.
 * Para sumar un objeto: una función en FABRICA que devuelva un Mesh o Group de radio ~1, y listo.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const datos = await window.__editorialListo;
const { W, H } = datos;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('lienzo3d'), alpha: true, antialias: true });
renderer.setSize(W, H, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;   // ACES lava los colores de marca
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.8;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
camera.position.set(0, 0, 20);
const K = (2 * 20 * Math.tan(THREE.MathUtils.degToRad(15))) / H;   // unidades 3D por píxel en z = 0
const aMundo = (px, py) => [(px - W / 2) * K, (H / 2 - py) * K];

// Luz de estudio con sombra suave sobre el "papel".
const sol = new THREE.DirectionalLight(0xffffff, 2.2);
sol.position.set(-4, 7, 12);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.radius = 10;
sol.shadow.blurSamples = 20;
Object.assign(sol.shadow.camera, { left: -H * K / 2, right: H * K / 2, top: H * K / 2 + 2, bottom: -H * K / 2 - 2, near: 1, far: 40 });
scene.add(sol, new THREE.HemisphereLight(0xffffff, 0xcfcfe0, 0.7));
const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
piso.position.z = -1.15;   // más cerca: la sombra queda pegada al objeto, no flotando aparte
piso.receiveShadow = true;
scene.add(piso);

// ---------- colores ----------
const MARCA = datos.colores || {};
const NOMBRES = { acento: MARCA.acento || '#7C3AED', suave: MARCA.suave || '#C4B5FD', lima: '#A8DB12', naranja: '#F2A33A', rojo: '#B3202E', oro: '#E8B53A', oscuro: '#3E1370', azul: '#2A10B0', rosa: '#EC5A8D', turquesa: '#35D0C0' };
const colorDe = (c, def) => new THREE.Color(NOMBRES[c] || c || NOMBRES[def] || def);
const brillante = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, ...extra });
const sombra = (o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return o; };

// ---------- ruido 3D determinista (pliegues del cerebro) ----------
const perm = new Uint8Array(512);
{ let s = 1234567; const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y, z) => { const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z); return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
function ruido(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z), L = THREE.MathUtils.lerp;
  const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  return L(L(L(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u), L(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
           L(L(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u), L(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
}
const pliegue = (x, y, z) => Math.pow(1 - Math.abs(ruido(x, y, z)), 3) * 0.7 + Math.pow(1 - Math.abs(ruido(x * 2.1 + 5, y * 2.1, z * 2.1)), 3) * 0.3;

// ---------- biblioteca ----------
function estrellaForma(puntas, R, r, curva) {
  const s = new THREE.Shape();
  for (let i = 0; i < puntas * 2; i++) {
    const a = (i / (puntas * 2)) * Math.PI * 2 + Math.PI / 2, rad = i % 2 ? r : R;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i === 0) s.moveTo(x, y);
    else if (curva) { const am = ((i - 0.5) / (puntas * 2)) * Math.PI * 2 + Math.PI / 2; s.quadraticCurveTo(Math.cos(am) * curva, Math.sin(am) * curva, x, y); }
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
const extruir = (forma, prof, bisel) => { const g = new THREE.ExtrudeGeometry(forma, { depth: prof, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel * 0.6, bevelSegments: 10, curveSegments: 32 }); g.center(); return g; };

const FABRICA = {
  esfera: (c) => new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), brillante(colorDe(c, 'lima'))),
  // Estrella de 4 puntas con bordes curvos (el "destello" de los reels editoriales)
  estrella: (c) => new THREE.Mesh(extruir(estrellaForma(4, 1, 0.26, 0.34), 0.18, 0.14), brillante(colorDe(c, 'acento'), { iridescence: 0.35, iridescenceIOR: 1.4 })),
  pieza: (c) => {
    const s = new THREE.Shape(), L = 0.8, rr = 0.16, e = 0.28, r = 0.3, cu = Math.sqrt(r * r - e * e), a = Math.PI / 2 - Math.asin(e / r);
    s.moveTo(-L + rr, -L);
    s.lineTo(-cu, -L); s.absarc(0, -L + e, r, -Math.PI / 2 - a, -Math.PI / 2 + a, true);
    s.lineTo(L - rr, -L); s.quadraticCurveTo(L, -L, L, -L + rr);
    s.lineTo(L, -cu); s.absarc(L + e, 0, r, Math.PI + a, Math.PI - a, false);
    s.lineTo(L, L - rr); s.quadraticCurveTo(L, L, L - rr, L);
    s.lineTo(cu, L); s.absarc(0, L + e, r, -Math.PI / 2 + a, (3 * Math.PI) / 2 - a, false);
    s.lineTo(-L + rr, L); s.quadraticCurveTo(-L, L, -L, L - rr);
    s.lineTo(-L, cu); s.absarc(-L + e, 0, r, Math.PI - a, -(Math.PI - a), true);
    s.lineTo(-L, -L + rr); s.quadraticCurveTo(-L, -L, -L + rr, -L);
    return new THREE.Mesh(extruir(s, 0.3, 0.1), brillante(colorDe(c, 'acento')));
  },
  moneda: (c) => {
    const g = new THREE.Group(), oro = new THREE.MeshPhysicalMaterial({ color: colorDe(c, 'oro'), metalness: 0.9, roughness: 0.25, clearcoat: 0.6 });
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.22, 96), oro); cuerpo.rotation.x = Math.PI / 2; g.add(cuerpo);
    const borde = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 16, 96), oro); borde.position.z = 0.11; g.add(borde);
    const signo = new THREE.Mesh(extruir(estrellaForma(5, 0.45, 0.2, 0), 0.04, 0.03), oro); signo.position.z = 0.12; g.add(signo);
    return g;
  },
  cubo: (c) => {
    const geo = new THREE.BoxGeometry(1.3, 1.3, 1.3, 1, 1, 1);
    const m = new THREE.Mesh(geo, brillante(colorDe(c, 'suave')));
    // bordes suavizados con una segunda caja un poco más chica y redondeada visualmente por el clearcoat
    return m;
  },
  anillo: (c) => new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.3, 48, 120), brillante(colorDe(c, 'naranja'))),
  pildora: (c) => new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 16, 48), brillante(colorDe(c, 'rosa'))),
  cerebro: (c) => {
    const g = new THREE.Group();
    const piel = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 });
    const base = colorDe(c, '#E2CFC7'), oscuro = base.clone().multiplyScalar(0.55), cc = new THREE.Color();
    const hemisferio = (lado) => {
      const geo = new THREE.SphereGeometry(1, 220, 160), pos = geo.attributes.position, col = [];
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const f = pliegue(x * 2.9 + lado * 3, y * 2.9, z * 2.9), r = 1 + 0.11 * f;
        let yy = y * 0.78; if (yy < -0.3) yy = -0.3 + (yy + 0.3) * 0.45;
        let xx = x * 0.62; if (xx * lado < 0.06) xx = lado * (0.06 + (xx * lado - 0.06) * 0.15);
        pos.setXYZ(i, xx * r, yy * r, z * 1.05 * r);
        cc.copy(oscuro).lerp(base, Math.min(1, f * 1.15)); col.push(cc.r, cc.g, cc.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, piel); m.position.x = lado * 0.07; return m;
    };
    g.add(hemisferio(1), hemisferio(-1));
    const cg = new THREE.SphereGeometry(1, 120, 80), cp = cg.attributes.position, ccol = [];
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
      const f = Math.pow(Math.abs(Math.sin(y * 22 + ruido(x * 3, y * 3, z * 3) * 2)), 0.6), r = 1 + 0.05 * f;
      cp.setXYZ(i, x * 0.72 * r, y * 0.42 * r, z * 0.5 * r);
      cc.copy(oscuro).lerp(base, f); ccol.push(cc.r, cc.g, cc.b);
    }
    cg.setAttribute('color', new THREE.Float32BufferAttribute(ccol, 3)); cg.computeVertexNormals();
    const cereb = new THREE.Mesh(cg, piel); cereb.position.set(0, -0.48, -0.72); g.add(cereb);
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.6, 32), new THREE.MeshStandardMaterial({ color: base.clone().multiplyScalar(0.92), roughness: 0.6 }));
    tronco.position.set(0, -0.7, -0.3); tronco.rotation.x = 0.35; g.add(tronco);
    return g;
  },
  diana: (c) => {
    const g = new THREE.Group();
    const rojo = new THREE.MeshStandardMaterial({ color: colorDe(c, 'rojo'), roughness: 0.45 }), blanco = new THREE.MeshStandardMaterial({ color: 0xF7F4F0, roughness: 0.5 });
    [[1.0, blanco, 0.16], [0.82, rojo, 0.2], [0.6, blanco, 0.24], [0.4, rojo, 0.28]].forEach(([r, mat, h]) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96), mat); d.rotation.x = Math.PI / 2; d.position.z = h / 2; g.add(d);
    });
    return g;
  },
};
function flecha() {
  const g = new THREE.Group();
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.6 }));
  asta.rotation.z = Math.PI / 2; asta.position.x = 0.8;
  const punta = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0x444449, metalness: 0.6, roughness: 0.3 }));
  punta.rotation.z = Math.PI / 2; punta.position.x = -0.05;
  g.add(asta, punta);
  const pluma = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.8, side: THREE.DoubleSide });
  for (let k = 0; k < 3; k++) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.34, 0); sh.lineTo(0.26, 0.11); sh.lineTo(-0.04, 0.11);
    const p = new THREE.Mesh(new THREE.ShapeGeometry(sh), pluma); p.position.x = 1.25; p.rotation.x = (k / 3) * Math.PI * 2; g.add(p);
  }
  return sombra(g);
}

// ---------- movimiento ----------
const c01 = (x) => Math.min(1, Math.max(0, x));
const eOut = (x) => 1 - Math.pow(1 - c01(x), 3);
const eInOut = (x) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eBack = (x, s = 1.7) => { x = c01(x) - 1; return x * x * ((s + 1) * x + s) + 1; };
const rebote = (x) => { x = c01(x); const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
const vida = (t, t0, t1, din = 0.45, dout = 0.2) => (t < t0 || t > t1 ? 0 : Math.min(eBack((t - t0) / din), 1 - eOut((t - (t1 - dout)) / dout)));
// Mismo desplazamiento que la columna de texto (tl.to con power3.inOut de 0.55 s).
function desplazamiento(lista, t) {
  let y = 0;
  lista.forEach((d) => { if (t >= d.en) y += (d.y - y) * eInOut((t - d.en) / 0.55); });
  return y;
}
// Giro propio de cada objeto (i = índice, para que dos iguales no giren igual).
const GIRO = {
  esfera: () => [0, 0, 0],
  estrella: (t, i) => [0.35, -0.5 + t * (0.8 + i * 0.1) * (i % 2 ? -1 : 1), 0.25 + t * 0.35],
  pieza: (t) => [0.55 + Math.sin(t * 1.4) * 0.12, -0.45 + Math.sin(t) * 0.25, -0.35 + t * 0.12],
  moneda: (t) => [0.2, t * 1.6, 0],
  cubo: (t) => [0.5 + t * 0.3, 0.6 + t * 0.5, 0],
  anillo: (t) => [0.9 + Math.sin(t) * 0.2, t * 0.7, 0],
  pildora: (t) => [0.3, 0, 0.6 + Math.sin(t * 1.2) * 0.3],
  cerebro: (t, i, t0) => [0.28 + Math.sin(t * 1.3) * 0.06, -0.75 + Math.sin((t - t0) * 0.9) * 0.45, 0.04],   // tres cuartos, sin mostrar la base
  diana: () => [0.12, -0.62, 0.02],
};

const piezas = datos.objetos.map((d, i) => {
  const fab = FABRICA[d.tipo];
  if (!fab) { console.warn('[reels-animados] objeto 3D desconocido: ' + d.tipo); return null; }
  const obj = sombra(fab(d.color));
  scene.add(obj);
  const p = { d, obj, i };
  if (d.tipo === 'diana' && d.flecha != null) { p.flecha = flecha(); scene.add(p.flecha); }
  return p;
}).filter(Boolean);

function renderAt(t) {
  piezas.forEach(({ d, obj, i, flecha: fl }) => {
    let s = vida(t, d.t0, d.t1, 0.5);
    let py = d.py + desplazamiento(d.desplazar, t);
    if (d.entrada === 'caer') { s = t < d.t0 ? 0 : Math.min(1, 1 - eOut((t - (d.t1 - 0.2)) / 0.2)); py -= (1 - rebote((t - d.t0) / 0.55)) * 420; }
    obj.visible = s > 0.001;
    if (fl) fl.visible = false;
    if (!obj.visible) return;
    const [x, y] = aMundo(d.px, py), esc = (d.tam / 2) * K;
    obj.position.set(x, y, 0.2);
    obj.scale.setScalar(esc * s);
    let golpe = 0;
    if (fl && t > d.flecha) golpe = Math.exp(-(t - d.flecha) * 6) * Math.sin((t - d.flecha) * 38);
    const g = GIRO[d.tipo](t, i, d.t0);
    obj.rotation.set(g[0] + golpe * 0.03, g[1] + golpe * 0.05, g[2]);
    // Diana: la flecha vuela desde la derecha y se clava en d.flecha; después vibra.
    if (fl && t > d.flecha - 0.5) {
      const v = Math.pow(c01((t - (d.flecha - 0.5)) / 0.5), 1.6);
      const [sx, sy] = aMundo(W + 420, py - 190);
      fl.scale.setScalar(esc);
      fl.position.set(THREE.MathUtils.lerp(sx, x + 0.05 * esc, v), THREE.MathUtils.lerp(sy, y, v) + Math.sin(v * Math.PI) * 0.4, 0.55 * esc);
      fl.rotation.set(0, -0.62, -0.08 * (1 - v) + golpe * 0.12);
      fl.visible = true;
    }
  });
  renderer.render(scene, camera);
}

window.addEventListener('hf-seek', (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
