// Ejemplo: clip de ~30 s de una entrevista o podcast en estilo MONOCROMO, sobre la grabación.
// La grabación va en una tarjeta en blanco y negro; todas las palabras de la voz están en pantalla
// (funcionan como subtítulos) y la palabra clave de cada frase va grande.
// El texto de las líneas debe decir lo mismo que la voz (palabras.json) y en el mismo orden.
// Después de cada cambio: node <skill>/scripts/armar.mjs · Guía: references/monocromo-cine.md
window.REEL = {
  titulo: 'clip-entrevista',
  modo: 'monocromo',
  formato: '9:16',

  marca: { nombre: 'Tu Marca', usuario: '@tumarca', colores: { acento: '#7C3AED' }, logo: 'assets/logo.svg' },
  video: { src: 'assets/clip-cortado.mp4', encuadre: '44% 62%', zoom: 1.35, proporcion: 1, y: 0.63 },
  voz: null,
  palabras: 'palabras.json',
  musica: { nombre: 'monocromo-1' },

  // Con imágenes de apoyo, agrega imagen: { src, palabra } a una escena: la tarjeta se aparta mientras está.
  escenas: [
    { lineas: [{ texto: 'El error más caro es', tam: 'chica' }, { texto: 'Improvisar', tam: 'grande' }, { texto: 'cuando te toca negociar', tam: 'chica' }], texto: { y: 0.14 } },
    { lineas: [{ texto: 'con un cliente', tam: 'chica' }, { texto: 'Grande,', tam: 'grande' }], texto: { y: 0.15 } },
    { lineas: [{ texto: 'o con un cliente', tam: 'chica' }, { texto: 'Pequeño.', tam: 'grande' }], texto: { y: 0.15 } },
    { lineas: [{ texto: 'Prepara', tam: 'chica' }, { texto: 'tres números:', tam: 'grande' }], texto: { y: 0.15, alinear: 'centro' },
      etiquetas: ['Lo que pides', 'Lo que aceptas', 'Cuándo te levantas'], etiquetasY: 0.3, salida: 'subir' },
    { lineas: [{ texto: 'y nunca', tam: 'chica' }, { texto: '~~Improvises~~', tam: 'grande' }], texto: { y: 0.15 },
      imagen: { src: 'assets/B1.png', ancho: 0.6, palabra: 'improvises' } },   // opcional: la tarjeta se aparta
    { lineas: [{ texto: 'Negocia con', tam: 'chica' }, { texto: 'Calma', tam: 'grande' }], texto: { y: 0.15 } },
    { lineas: [{ texto: 'y deja que el silencio', tam: 'chica' }, { texto: 'Trabaje.', tam: 'grande' }], texto: { y: 0.15 } },
    { cierre: { web: false } },   // solo el logo de la marca
  ],

  sonidos: true,
};
