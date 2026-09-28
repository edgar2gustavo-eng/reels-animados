# `reel.js`: referencia completa

`reel.js` define `window.REEL = { ... }`. Es JavaScript, así que admite comentarios y comas finales. Todos los tiempos van en **segundos del reel final** y salen de `palabras.json`.

## Campos generales

| campo | qué es | por defecto |
|---|---|---|
| `titulo` | nombre interno del reel | nombre de la carpeta |
| `formato` | `'9:16'` (1080×1920), `'4:5'` (1080×1350), `'1:1'` (1080×1080), `'16:9'` (1920×1080) | `'9:16'` |
| `duracion` | largo total en segundos | lo que dure el video o la voz (+0.6 s) |
| `marca` | `{ nombre, usuario, colores, fuentes, logo }`: la copia `nuevo.mjs` desde tu kit de marca | — |
| `video` | `{ src, inicio, encuadre, saltosZoom, silenciar }`: la grabación de fondo | `null` |
| `voz` | `{ src, inicio, volumen }`: voz en off, si no hay video | `null` |
| `musica` | `{ nombre }` de tu biblioteca de Suno, o `{ src, inicio }` con un mp3 propio; `volumen` opcional. Se mezcla sola con la voz (ver `audio.md`) | `null` |
| `palabras` | ruta a `palabras.json` (o la lista directa) | `'palabras.json'` |
| `subtitulos` | `{ estilo, palabrasPorGrupo, altura }`, o `false` para quitarlos | `{ estilo: 'pop' }` |
| `enfasis` | palabras que se pintan con el acento. Las cifras ya se pintan solas | `[]` |
| `gancho` | `{ texto, etiqueta, desde, hasta }`: título de los primeros segundos | — |
| `momentos` | lista de apariciones animadas (ver abajo) | `[]` |
| `escenas` | fondos por sección, solo sin grabación (ver abajo) | una por cada `titulo` |
| `cta` | `{ texto, accion, palabraClave, boton, en }`: el cierre | — |
| `barraProgreso` | barra de avance arriba | `true` |
| `marcaDeAgua` | logo pequeño + @usuario arriba a la izquierda | `true` |
| `sonidos` | efectos automáticos por momento (`false` para ninguno) | `true` |
| `volumenSonidos` | volumen de los efectos, de 0 a 1 (en monocromo y cine, 0.4) | `0.5` |

### `video`
```js
video: {
  src: 'assets/grabacion-cortada.mp4',
  inicio: 0,              // segundo del archivo desde el que arranca
  encuadre: '50% 30%',    // qué parte se ve al recortar a vertical (x% y%): '30% 50%' corre el recorte a la izquierda
  saltosZoom: true,       // alterna acercamiento 1× ↔ 1.12× en cada frase nueva: da ritmo
  silenciar: false,       // true = no usar el audio de la grabación
},
```
Si la grabación es horizontal y el reel vertical, se recorta sola (`object-fit: cover`). Con fuentes de baja resolución (720p o menos) la imagen se ve blanda: conviene pedir el archivo original del celular.

### `subtitulos`
```js
subtitulos: { estilo: 'resaltador', palabrasPorGrupo: 3, altura: 0.66 },
```
`altura` es la posición vertical del centro de los subtítulos, de 0 (arriba) a 1 (abajo). Por defecto es 0.64 en vertical y 0.80 en horizontal. Los estilos están en `subtitulos.md`.

### `gancho`
```js
gancho: { etiqueta: '3 errores', texto: 'Estás *perdiendo clientes* por esto', desde: 0, hasta: 3.2 },
```
- Lo que va entre `*asteriscos*` sale en un bloque de color de acento.
- `etiqueta` es opcional: una píldora pequeña arriba del texto.
- Dura hasta `hasta`; lo ideal es 2.5-4 s.

## Escenas (modo sin rostro)

Sin grabación, el fondo cambia por sección: cada escena tiene su propio fondo animado, un barrido de color de acento al entrar y, opcionalmente, una palabra gigante de fondo. **No hace falta escribirlas**: se arman solas, una al inicio y otra por cada momento `titulo` (con su número gigante de fondo: «Paso *2*» → «02»).

Para controlarlas a mano:
```js
escenas: [
  { en: 0, fondo: 'manchas' },
  { en: 5.5, fondo: 'rayos', palabra: '01' },
  { en: 11.4, fondo: 'rejilla', palabra: 'VENDE' },
  { en: 21.6, fondo: 'puntos' },
],
```
Fondos: `manchas` (luces difusas), `rayos` (rayos girando), `rejilla` (piso en perspectiva que avanza), `puntos` (trama que se desplaza), `ondas` (anillos desde el centro) y `diagonal` (bloque de color inclinado). Sin `fondo`, se van alternando en ese orden.

## Momentos

Todos llevan `tipo` y `en` (segundo en que aparecen). Casi todos aceptan `dur` y `altura` (0-1). En los textos, `*asteriscos*` resaltan.

### `cifra`: número grande que cuenta desde 0
```js
{ tipo: 'cifra', en: 4.2, dur: 2.4, texto: '90%', detalle: 'deja de ver en 3 segundos' }
{ tipo: 'cifra', en: 9.0, texto: '$1.200', detalle: 'ahorrados al *mes*' }
{ tipo: 'cifra', en: 12.3, texto: '3x', contar: false }     // sin animación de conteo
```
Úsalo cuando la voz dice un número. El conteo entiende `90%`, `$1.200`, `3x` y `4,5`.

### `titulo`: píldora de sección
```js
{ tipo: 'titulo', en: 7.3, dur: 2, texto: 'Paso *1*' }
```
Úsalo para marcar el inicio de cada punto. Aparece arriba, sin tapar el centro.

### `lista`: puntos que aparecen uno a uno
```js
{ tipo: 'lista', en: 12.5, dur: 3.5, titulo: 'Lo que *necesitas*', icono: 'check',
  items: ['Tu celular', 'Buena luz', { texto: 'Un *guion*', en: 14.2 }] }
```
Sin `en`, los ítems se reparten a lo largo de `dur`. Con `en`, cada ítem aparece cuando se nombra, que es lo que mejor funciona. Íconos: los mismos de `icono`.

### `palabra`: palabra gigante a pantalla completa
```js
{ tipo: 'palabra', en: 10.7, dur: 1.1, texto: 'Gratis' }
```
Llena la pantalla con el color de acento y oculta los subtítulos mientras dura. Es el golpe más fuerte: úsalo una o dos veces por reel, en la idea clave.

### `imagen`: captura o foto en una tarjeta
```js
{ tipo: 'imagen', en: 9.3, dur: 2.6, src: 'assets/captura.png', texto: 'Mira el *resultado*' }
```
Úsalo cuando la voz nombra algo que se puede mostrar (una app, un resultado, un comentario). La tarjeta se achica sola para no chocar con los subtítulos. Tapa los datos de terceros antes de usar una captura.

### `icono`: ícono que aparece con un aro
```js
{ tipo: 'icono', en: 8.8, icono: 'idea' }
```
Íconos: `check`, `x`, `fuego`, `idea`, `flecha`, `estrella`, `corazon`, `dinero`, `reloj`, `grafica`, `alerta`, `mas`.

### `zoom`: acercamiento rápido a la grabación
```js
{ tipo: 'zoom', en: 0.6, dur: 1.4, escala: 1.3 }
```
Solo funciona con `video`. Úsalo para remarcar una frase fuerte o un gesto.

### `chat`: conversación de mensajes (DM, WhatsApp)
```js
{ tipo: 'chat', en: 7.6, dur: 3.7, nombre: 'María', mensajes: [
  { de: 'ellos', texto: 'Hola, ¿cuánto cuesta?', en: 7.9 },
  { de: 'yo', texto: '*$49* al mes. ¿Te lo activo?', en: 8.9 },
  { de: 'ellos', texto: '¡Sí, de una!', en: 10.3 },
] }
```
Los mensajes de `ellos` aparecen primero como «escribiendo…» (si hay tiempo). Úsalo cuando la voz cuenta una conversación, una objeción o un mensaje de un cliente. Si es un caso real, pide permiso y cambia el nombre.

### `comparar`: antes/después, mal/bien
```js
{ tipo: 'comparar', en: 15.4, dur: 5.8,
  mal: { titulo: 'Antes', items: ['«20 años de experiencia»'] },
  bien: { titulo: 'Ahora', items: ['«Tu local *lleno* en 30 días»'], en: 18.8 } }
```
Dos columnas: la de `mal` con ✗ y el texto tachado, la de `bien` con ✓ y borde de acento. Cada columna acepta su propio `en`, para que aparezca justo cuando la voz la nombra.

### `grafica`: barras que crecen
```js
{ tipo: 'grafica', en: 22.4, dur: 2.2, titulo: 'Tus ventas por *semana*', unidad: '%', prefijo: '$', destacar: 3,
  barras: [{ etiqueta: 'S1', valor: 12 }, { etiqueta: 'S2', valor: 18 }, { etiqueta: 'S3', valor: 27 }, { etiqueta: 'S4', valor: 41 }] }
```
La barra `destacar` (por defecto, la última) va en color de acento. Dale al menos 2 s: las barras tardan ~1.5 s en crecer. Si los datos no son reales, que la voz lo diga («por ejemplo»).

### `notificacion`: notificaciones del celular
```js
{ tipo: 'notificacion', en: 27.3, dur: 1.8, app: 'Tienda', icono: 'dinero', items: [
  { titulo: 'Nueva venta', texto: '*$49* · Plan mensual', en: 27.4 },
  { titulo: 'Nueva venta', texto: '*$129* · Plan anual', en: 27.8 },
] }
```
Caen una debajo de otra, arriba de la pantalla. Úsalo para mostrar un resultado: ventas, seguidores, mensajes o reservas.

### `cita`: frase para recordar
```js
{ tipo: 'cita', en: 24.4, dur: 2, texto: 'Lo que no mides, *no mejora*', autor: 'Tu Marca' }
```
Letra serif en cursiva, con comillas grandes. Atribuye solo citas verificables; si no estás seguro del autor, usa el nombre del creador o no pongas autor.

### `emoji`: emoji grande que rebota
```js
{ tipo: 'emoji', en: 14.4, dur: 1, emoji: '💰' }
```
`armar.mjs` descarga el emoji (Twemoji) una sola vez a `assets/emoji/`, así se ve igual en cualquier computadora. No pongas emojis dentro de los textos: dependen de las fuentes de cada equipo.

### `lista` numerada
`numerada: true` cambia los íconos por 1, 2, 3…

### Sonidos
Cada momento trae su propio sonido: `cifra`/`icono` → pop, `emoji` → brillo, `palabra` → golpe (con una subida antes), `grafica` → subida, `comparar` → whoosh-corto, `imagen`/`titulo`/`cita` → whoosh, cada ítem de `lista` → tic, cada mensaje de `chat` → pop (clic si lo mandas tú) y cada `notificacion` → notificacion. El gancho lleva whoosh y el cierre, exito. Nunca suenan dos soplos a menos de 2.5 s: el que sobra se vuelve un pop o se quita. Para cambiarlo: `sonido: 'ding'`. Para quitarlo: `sonido: false`. Lista completa de efectos y reglas en `audio.md`.

## Cierre (`cta`)
```js
cta: { en: 26.4, texto: 'Sígueme para *más trucos*', accion: 'seguir' }
cta: { texto: 'Te mando la *guía completa*', accion: 'comentar', palabraClave: 'GUIA' }   // el botón ya dice «Comenta GUIA»
cta: { texto: 'Guárdalo para *después*', accion: 'guardar' }
cta: { texto: 'Plantilla *gratis*', accion: 'enlace', boton: 'Link en mi perfil' }
```
El botón se arma solo según `accion` («Seguir», «Comenta <palabraClave>», «Guárdalo» o el texto de `boton`), así que `texto` no debe repetirlo. La `palabraClave` es lo que se ve en pantalla: escríbela tal como la esperan tus respuestas automáticas (si tu herramienta busca «GUIA» sin tilde, así). En el guion para la voz IA va distinto: en minúsculas y con tilde («comenta guía»), porque en mayúsculas la voz la deletrea.

Con video, el cierre sube como un panel sobre la mitad de abajo; sin video, ocupa toda la pantalla. Los subtítulos se ocultan cuando empieza. Dale al menos 2 s.

## Ejemplo completo (grabación de 28 s)
```js
window.REEL = {
  titulo: 'errores-luz',
  formato: '9:16',
  duracion: 28.5,
  marca: { /* la pone nuevo.mjs */ },
  video: { src: 'assets/grabacion-cortada.mp4', encuadre: '50% 40%' },
  palabras: 'palabras.json',
  subtitulos: { estilo: 'pop' },
  enfasis: ['ventana', 'gratis'],
  gancho: { etiqueta: '3 errores', texto: 'Tu luz *te delata*', hasta: 3 },
  momentos: [
    { tipo: 'zoom', en: 0.4, dur: 1.2 },
    { tipo: 'titulo', en: 3.1, texto: 'Error *1*' },
    { tipo: 'icono', en: 4.0, icono: 'x' },
    { tipo: 'titulo', en: 9.8, texto: 'Error *2*' },
    { tipo: 'imagen', en: 11.2, dur: 2.5, src: 'assets/antes-despues.jpg', texto: 'Antes / *después*' },
    { tipo: 'titulo', en: 16.5, texto: 'Error *3*' },
    { tipo: 'cifra', en: 18.0, texto: '0', detalle: 'soles: usa la *ventana*', contar: false },
    { tipo: 'palabra', en: 22.1, dur: 1, texto: 'Gratis' },
  ],
  cta: { en: 25.6, texto: 'Guárdalo para tu *próxima grabación*', accion: 'guardar' },
};
```
