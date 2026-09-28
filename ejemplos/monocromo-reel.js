// Ejemplo: «La IA no arregla el desorden», estilo MONOCROMO con voz IA (Alex) e imágenes A1-A10 recortadas con recortar.py. Después de cada cambio: node <skill>/scripts/armar.mjs
// Cada línea aparece cuando la voz la dice (palabras.json): no hace falta poner tiempos.
window.REEL = {
  titulo: 'ia-desorden',
  modo: 'monocromo',
  formato: '9:16',

  marca: {
    nombre: 'Tu Marca',
    usuario: '@tumarca',
    colores: { fondo: '#1A1A1A', texto: '#FFFFFF', acento: '#7C3AED', suave: '#C4B5FD' },
    fuentes: { titulo: 'Archivo Black', texto: 'Inter' },
    logo: 'assets/logo.svg',
  },
  voz: { src: 'assets/voz.wav' },
  palabras: 'palabras.json',
  musica: { nombre: 'monocromo-1' },

  escenas: [
    { lineas: [{ texto: 'La inteligencia artificial', tam: 'chica' }, { texto: 'no arregla un negocio', tam: 'chica' }, { texto: 'Desordenado', tam: 'gigante' }],
      imagen: { src: 'assets/A1.png', y: 0.68, ancho: 0.54 } },
    { lineas: [{ texto: 'Lo', tam: 'chica' }, { texto: 'Acelera', tam: 'gigante' }],
      imagen: { src: 'assets/A2.png', y: 0.6, ancho: 0.76, entrada: 'izquierda', rotar: -4, sonido: 'subida' } },
    { lineas: [{ texto: 'Muchos empiezan por las', tam: 'chica' }, { texto: 'Herramientas', tam: 'grande' }],
      imagen: { src: 'assets/A3.png', x: 0.52, y: 0.6, ancho: 0.7, entrada: 'derecha', rotar: 5 } },
    { lineas: [{ texto: 'ChatGPT', tam: 'grande' }], texto: { y: 0.24 },
      imagen: { src: 'assets/A4.png', y: 0.56, ancho: 0.5, entrada: 'abajo' } },
    { lineas: [{ texto: 'Automatizaciones', tam: 'grande' }], texto: { y: 0.24 },
      imagen: { src: 'assets/A5.png', y: 0.57, ancho: 0.62 } },
    { lineas: [{ texto: 'Agentes', tam: 'grande' }], texto: { y: 0.24 },
      imagen: { src: 'assets/A6.png', y: 0.56, ancho: 0.6, sonido: 'brillo' } },
    { lineas: [{ texto: 'Pero antes de automatizar…', tam: 'chica' }], texto: { y: 0.44 } },
    { lineas: [{ texto: 'necesitas', tam: 'chica' }, { texto: '3 cosas', tam: 'grande' }],
      texto: { y: 0.24, alinear: 'centro' }, etiquetasY: 0.39, salida: 'subir',
      etiquetas: ['Un proceso claro', 'Datos ordenados', 'Una persona responsable'] },
    { lineas: [{ texto: 'Sin eso, la IA no ahorra', tam: 'chica' }, { texto: '~~Tiempo~~', tam: 'grande' }],
      imagen: { src: 'assets/A7.png', y: 0.63, ancho: 0.42 } },
    { lineas: [{ texto: 'Multiplica', tam: 'chica' }, { texto: 'Errores', tam: 'grande' }],
      imagen: { src: 'assets/A8.png', y: 0.6, ancho: 0.88, entrada: 'derecha', sonido: 'teclado' } },
    { lineas: [{ texto: 'Primero', tam: 'chica' }, { texto: 'Ordena', tam: 'grande' }],
      imagen: { src: 'assets/A9.png', y: 0.58, ancho: 0.6 } },
    { lineas: [{ texto: 'Después', tam: 'chica' }, { texto: 'Automatiza', tam: 'grande' }],
      imagen: { src: 'assets/A10.png', x: 0.56, y: 0.64, ancho: 0.56, entrada: 'derecha' } },
    { cierre: { web: false } },   // solo el logo de la marca
  ],

  sonidos: true,
};
