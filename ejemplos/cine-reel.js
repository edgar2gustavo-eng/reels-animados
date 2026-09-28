// Guion del reel en estilo CINE. Después de cada cambio: node <skill>/scripts/armar.mjs
// Cada línea de pantalla aparece cuando la voz la dice (palabras.json). Ver references/monocromo-cine.md.
window.REEL = {
  titulo: 'cine-prueba',
  modo: 'cine',
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
  musica: { nombre: 'cine-1' },

  escenas: [
    { portada: true, texto: { y: 0.56 },
      lineas: [{ texto: 'Los creadores', tam: 'media', cursiva: true }, { texto: 'que venden', tam: 'grande' }],
      imagen: { src: 'assets/portada.svg', y: 0.38, ancho: 0.3, entrada: 'caer', brillo: false } },
    { salida: 'barrido',
      lineas: [{ texto: 'No dependen', tam: 'grande' }, { texto: 'de la *suerte*.', tam: 'grande', cursiva: true, brillo: 'verde' }],
      imagen: { src: 'assets/trebol.svg', x: 0.5, y: 0.62, ancho: 0.26, entrada: 'girar', brillo: 'verde', palabra: 'suerte' } },
    { lineas: [{ texto: 'Tienen _guion_,', tam: 'media', brillo: 'verde' }] },
    { salida: 'zoom', texto: { y: 0.4 },
      lineas: [{ texto: 'ritmo', tam: 'gigante', cursiva: true }, { texto: '& *constancia*', tam: 'grande', brillo: 'amarillo' }],
      imagen: { src: 'assets/rayo.svg', y: 0.64, ancho: 0.34, entrada: 'girar', brillo: 'amarillo', palabra: 'constancia' } },
    { lineas: [{ texto: 'trabajando juntos.', tam: 'chica', cursiva: true }] },
    { lineas: [{ texto: 'Un *gancho*', tam: 'grande', brillo: 'verde' }, { texto: 'en tres segundos,', tam: 'media', cursiva: true }],
      imagen: { src: 'assets/cronometro.svg', y: 0.27, ancho: 0.24, brillo: 'verde' } },
    { lineas: [{ texto: 'una historia', tam: 'media', cursiva: true }, { texto: 'que *conecta*', tam: 'grande', brillo: 'amarillo' }],
      imagen: { src: 'assets/ojo.svg', y: 0.3, ancho: 0.36, brillo: 'amarillo', palabra: 'conecta' } },
    { lineas: [{ texto: 'y un cierre', tam: 'media' }, { texto: 'que invita a actuar.', tam: 'chica', cursiva: true }] },
    { fondo: 'crema', lineas: [{ texto: 'Ese es el contenido', tam: 'chica', cursiva: true }, { texto: 'que retiene,', tam: 'media', sans: true }] },
    { fondo: 'crema', lineas: [{ texto: 'conecta', tam: 'grande', cursiva: true }, { texto: 'y vende.', tam: 'media', sans: true }] },
    { fondo: 'crema', lineas: [{ texto: '¿Quieres llevar tu marca', tam: 'media', sans: true }, { texto: 'al siguiente nivel?', tam: 'grande', cursiva: true }] },
    { fondo: 'crema', lineas: [{ texto: 'Escríbenos por', tam: 'media', sans: true }, { texto: 'mensaje directo.', tam: 'grande', cursiva: true }] },
  ],

  sonidos: true,
};
