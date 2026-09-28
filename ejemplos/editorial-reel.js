// Ejemplo del modo editorial: "Tu cerebro toma 35.000 decisiones cada día" (17.5 s, sin voz).
// Cópialo como reel.js en un proyecto y ajusta textos, tiempos y objetos.
window.REEL = {
  titulo: 'decisiones',
  modo: 'editorial',
  formato: '9:16',
  duracion: 17.5,

  marca: {
    nombre: 'Tu Marca',
    colores: { fondo: '#1A1A1A', texto: '#FFFFFF', acento: '#2A10B0', suave: '#C4B5FD' },
    fuentes: { titulo: 'Montserrat', texto: 'Inter' },
  },
  editorial: { papel: 'cuadriculado' },
  voz: null,
  musica: null,

  escenas: [
    { en: 0, hasta: 1.95, tarjeta: true,
      bloques: [
        { texto: '¿Sabías', estilo: 'fuerte', tam: 132, en: 0.35 },
        { texto: 'que…?', estilo: 'fuerte', tam: 132, en: 0.47 },
      ],
      objetos: [{ tipo: 'esfera', lugar: 'tarjeta', tam: 116, en: 0.15, entrada: 'caer' }] },

    { en: 1.95, hasta: 3.55, curvas: ['a'],
      bloques: [
        { texto: 'estudios', estilo: 'fuerte', tam: 150, color: 'acento', en: 2.0 },
        { texto: 'demuestran', tam: 112, en: 2.25 },
        { texto: 'que', tam: 210, alinear: 'derecha', en: 2.55 },
      ],
      objetos: [
        { tipo: 'esfera', lugar: 'arriba-izquierda', tam: 230, en: 2.0 },
        { tipo: 'esfera', x: 990, y: 1740, tam: 300, en: 2.2 },
      ] },

    { en: 3.55, hasta: 7.35, desplazar: [{ en: 4.75, y: -150 }],
      bloques: [
        { texto: '**Tu cerebro** toma', tam: 86, alinear: 'centro', en: 3.6, sale: 4.75 },
        { objeto: { tipo: 'cerebro', tam: 430, aro: true }, en: 3.65 },
        { cifra: '35.000', desde: '31.800', en: 4.95 },
        { texto: 'decisiones', tam: 112, sangria: 110, en: 6.0 },
        { texto: 'cada día', tam: 112, sangria: 110, entrada: 'palabras', en: 6.3 },
      ] },

    { en: 7.35, hasta: 9.65,
      bloques: [
        { texto: 'Cuando aprendes', tam: 84, en: 7.4 },
        { texto: 'a resolver', tam: 84, en: 7.55 },
        { texto: 'Problemas', estilo: 'condensada', tam: 262, entrada: 'barrido', en: 7.9 },
        { texto: 'con método', tam: 84, en: 8.35 },
      ],
      objetos: [
        { tipo: 'estrella', x: 910, y: 330, tam: 330, color: '#B14FE6', en: 7.4 },
        { tipo: 'pieza', x: 720, y: 1400, tam: 330, color: '#7A1FE8', en: 7.95 },
      ] },

    { en: 9.65, hasta: 13.55,
      bloques: [
        { texto: 'Tus decisiones', tam: 92, en: 9.7 },
        { texto: 'se vuelven', tam: 92, en: 9.9 },
        { grafica: { barras: [150, 270, 195, 360] }, en: 10.05 },
        { etiquetas: ['Más rápidas', 'Más precisas', 'Más efectivas'], tiempos: [10.9, 11.7, 12.5] },
      ] },

    { en: 13.55, hasta: 15.15, curvas: ['b', 'c'],
      bloques: [
        { texto: 'Las decisiones inteligentes', tam: 80, color: 'gris', alinear: 'centro', en: 13.75 },
        { texto: 'no son suerte', tam: 80, color: 'gris', alinear: 'centro', en: 14.1 },
      ],
      objetos: [
        { tipo: 'estrella', x: 250, y: 520, tam: 300, color: 'oscuro', en: 13.6 },
        { tipo: 'estrella', x: 880, y: 1520, tam: 380, color: 'oscuro', en: 13.8 },
      ] },

    { en: 15.15, hasta: 17.5, vertical: 'arriba',
      bloques: [
        { texto: 'son', tam: 92, alinear: 'centro', en: 15.2 },
        { texto: 'habilidades', tam: 110, alinear: 'centro', en: 15.35 },
        { texto: 'ENTRENADAS', estilo: 'fuerte', tam: 132, color: 'azul', alinear: 'centro', entrada: 'golpe', en: 15.6 },
        { objeto: { tipo: 'diana', tam: 520, flecha: 16.2 }, en: 15.25 },
      ] },
  ],
  sonidos: true,
};
