# Estilos «monocromo» y «cine»: la tipografía sigue a la voz

Dos estilos de reel sin rostro en los que **el texto de pantalla es la voz**: cada palabra aparece justo cuando se dice. No llevan subtítulos aparte: la frase escrita *es* el diseño.

| | monocromo | cine |
|---|---|---|
| Fondo | papel blanco hueso con rejilla tenue y viñeta gris | negro profundo; puede pasar a papel crema |
| Letra | sans gruesa (Montserrat) con jerarquía chica / grande | serif fina de alto contraste (Bodoni Moda) mezclada con sans (Inter) |
| Cómo entra una palabra | desenfocada y gris claro; al decirse se pone negra | desenfocada y un poco más grande; se asienta |
| Imágenes | recortes en blanco y negro con sombra, que entran desenfocados o desde un lado y se acercan despacio | íconos pequeños que brillan del color del neón, que giran o se enfocan al entrar |
| Toques | píldoras oscuras, palabras tachadas, logo fijo arriba, cierre en negro con destello de color | palabras con brillo de neón, trazo a mano que subraya, portada crema con aspas, vuelo a través del texto |
| Voz | masculina y pausada (Alex) | femenina (Dora) |
| Música (Suno) | minimal corporativa: pulsos graves, piano apagado | cinematográfica oscura: dron, piano suave, pulso lento |

## Flujo

1. `node <skill>/scripts/nuevo.mjs <carpeta> --modo monocromo` (o `--modo cine`).
2. Escribe el guion (voz) y genera la voz: `python <skill>/scripts/voz.py "<guion>" --voz alex` (cine: `--voz dora`).
3. Transcribe: `python <skill>/scripts/transcribir.py assets/voz.wav` → `palabras.json`.
4. Escribe las `escenas` en `reel.js` (abajo). **No hace falta poner tiempos**: `armar.mjs` busca cada palabra de pantalla en la voz y saca de ahí cuándo entra cada palabra, cada escena, cada píldora y cada imagen.
5. `node <skill>/scripts/armar.mjs`: imprime la tabla de escenas con sus tiempos y avisa si alguna palabra de pantalla no aparece en la voz.
6. `npx hyperframes@0.8.86 check`, snapshots, render y `entregar.mjs`, como siempre.

## Escenas

```js
modo: 'monocromo',            // o 'cine'
voz: { src: 'assets/voz.wav' },
palabras: 'palabras.json',
musica: { nombre: 'monocromo-1' },
escenas: [
  { lineas: [{ texto: 'Publicar más', tam: 'chica' }, { texto: 'no te hace', tam: 'chica' }, { texto: 'Crecer', tam: 'gigante' }],
    imagen: { src: 'assets/calendario.png', y: 0.6, ancho: 0.56, rotar: -10 } },
  { lineas: [{ texto: '3 preguntas', tam: 'grande' }, { texto: 'deben estar claras', tam: 'chica' }],
    texto: { y: 0.24, alinear: 'centro' }, etiquetas: ['¿Para quién es?', '¿Qué problema resuelve?'], salida: 'subir' },
  { cierre: { lema: 'Contenido con sistema', web: '@tuusuario' } },   // solo monocromo
]
```

### Líneas
- `texto`: lo que se ve. Tiene que decir **lo mismo que la voz y en el mismo orden**, pero puede saltarse palabras («La mayoría de creadores empieza por aquí» → «creadores» / «empieza por aquí»). Los números valen escritos con cifra: «3 preguntas» encuentra «tres preguntas».
- `tam`: `chica`, `media`, `grande` o `gigante`. Monocromo: combina una línea chica con una grande, como en «Publicar más / **Crecer**».
- Cine: `cursiva: true` (serif en cursiva) o `sans: true` (sans limpia). Mezclar las tres en una misma escena es lo que da el look de la referencia. `brillo: 'verde'` es el color de neón de las palabras marcadas; también `amarillo`, `violeta`, `rosa`, `azul`, `naranja`, `blanco` o un hex.
- `alinear` y `sangria` (fracción del ancho) por línea; `escala: 0.8` achica una línea. Si una línea no cabe, se achica sola.
- `en: 12.3` fuerza el tiempo de una línea (sus palabras se reparten desde ahí) y no la busca en la voz.

Marcas dentro de `texto`:
- `*palabra*` → acento. En cine brilla con el neón de la línea; en monocromo queda en negro intenso.
- `~~palabra~~` → se tacha con una línea que se dibuja (sonido de trazo).
- `_palabra_` → se subraya con un trazo a mano que brilla (cine).
- Una marca puede abarcar varias palabras: `*idea clara*`.

### Posición del texto
`texto: { x: 0.5, y: 0.19, alinear: 'izquierda' }` (x e y en fracción de la pantalla). En monocromo, `y` es el borde superior del bloque (por defecto 0.19) y las líneas se alinean a la izquierda dentro del bloque centrado. En cine, `y` es el centro del bloque (por defecto 0.46) y se centra.

### Imagen
```js
imagen: { src: 'assets/lupa.png', x: 0.58, y: 0.6, ancho: 0.62, entrada: 'derecha', rotar: -8, palabra: 'claridad' }
```
- `x`, `y`: centro de la imagen; `ancho`: fracción del ancho de pantalla (monocromo 0.72, cine 0.34 por defecto).
- `entrada`: `enfoque` (por defecto: aparece desenfocada y grande y se enfoca), `izquierda`, `derecha`, `abajo`, `arriba`, `girar` (gira en 3D, ideal para íconos en cine), `caer`.
- `palabra`: entra cuando la voz dice esa palabra de la escena; si no, al empezar la escena. O `en: 12.4`.
- `deriva: 1.07`: cuánto se acerca la cámara mientras está en pantalla.
- Monocromo: la imagen se pasa a blanco y negro sola (`color: true` para dejarla a color). Cine: brilla del color `brillo` de la imagen (`brillo: false` para quitarlo).
- Varias imágenes: `imagenes: [{...}, {...}]`.
- **Quitar el fondo**: casi ninguna imagen de internet viene transparente. `<py> <skill>/scripts/recortar.py originales/*.jpg --salida assets` quita el fondo con rembg (local, código abierto), recorta al objeto y borra manchitas sueltas. Sirve también con el cuadriculado de «transparente» pintado encima. `--arriba 0.05` recorta antes un pie de foto; `--tinta` convierte luces sobre fondo negro (tableros, neones) en tinta oscura, ideal para monocromo. Revisa siempre el resultado sobre papel antes de armar.
- **Formato**: PNG sin fondo, de 800 px o más. En monocromo funcionan mejor recortes de fotos o renders 3D (cohetes, manos, esculturas, objetos) con buena luz; en cine, íconos 3D simples.

### Etiquetas (píldoras)
`etiquetas: ['¿Para quién es?', …]` y `etiquetasY: 0.39`. Cada píldora entra cuando la voz empieza a decirla.

### Salidas entre escenas
`salida`: `desenfoque` (por defecto), `zoom` (la cámara vuela a través del texto; úsalo 1-2 veces en cine), `barrido` (sale hacia un lado con desenfoque), `subir` o `corte`. En escenas muy cortas la salida se acorta sola.

### Con una grabación (entrevista, podcast, video a cámara)
```js
video: { src: 'assets/clip-limpio.mp4', encuadre: '50% 30%', proporcion: 1, y: 0.64, ancho: 0.84 },
voz: null,
palabras: 'palabras.json',   // transcripción del clip (transcribir.py sobre el video)
```
- La grabación va en una **tarjeta** sobre el papel (en monocromo, en blanco y negro; `color: true` la deja a color), con esquinas redondeadas y sombra. Entra enfocándose y la cámara se acerca despacio todo el reel (`deriva: 1.1`). Su audio es la voz.
- `zoom: 1.3` acerca la grabación hacia el `encuadre` (útil si la persona sale chica o la fuente es 16:9).
- `proporcion`: 1 (cuadrada, por defecto), 0.8 (4:5) o 1.78 (16:9). `encuadre`: qué parte del video se ve (`'50% 30%'` = centrado, un poco arriba: la cara).
- **Subtítulos**: en este estilo el texto de pantalla es la voz. Con una grabación, escribe **todas** las palabras de cada frase en las líneas (así funcionan como subtítulos) y deja en `grande`/`gigante` la palabra clave de cada frase.
- Las escenas con `imagen` apartan la tarjeta (se desenfoca y se va) y muestran la imagen como plano de apoyo; cuando vuelve una escena sin imagen, la tarjeta regresa. El cierre también la aparta.
- Deja espacio: con la tarjeta ocupando el centro-abajo, el texto va arriba (`texto: { y: 0.15 }` si hay tres líneas).

### Monocromo: marco y cierre
- El logo de la marca queda fijo arriba al centro (`monocromo: { logoFijo: false }` para quitarlo).
- `monocromo: { adorno: 'assets/hojas.png' }` pone un adorno en la esquina superior izquierda y otro girado en la inferior derecha (como las hojas de la referencia).
- `{ cierre: { lema, web, nombre, resaltar } }` (`web: false` y sin `lema` = solo el logo y el nombre): destello del color de acento (`monocromo: { destello: '#E0622B' }` para cambiarlo), fondo oscuro y la marca que aparece letra por letra. `resaltar: 'IA'` pinta esas letras con el acento. Dale ~3 s después de la última palabra (sale solo).
- `monocromo: { fuente: 'Poppins' }` cambia la sans gruesa (cualquiera de las incluidas).

### Cine: portada y crema
- `portada: true` en la primera escena: papel crema con aspas negras que giran en las esquinas, un ícono y el título.
- `fondo: 'crema'` pasa esa escena a papel crema (con transición). En la referencia, la primera mitad va en negro con neón y la segunda en crema con letra negra: el cambio marca el paso del problema a la propuesta.
- Al final se funde a negro (`cine: { fundidoFinal: false }` para quitarlo).

## Sonido
Pocos efectos: la voz y la música llevan el ritmo. En escenas cortas, un soplo por cambio de escena se vuelve un zumbido constante.
- Los soplos (`whoosh`, `whoosh-corto`, `enfoque`) solo marcan movimiento: salida `zoom` → `whoosh`; `barrido` o `subir` → `whoosh-corto`; imagen con `enfoque` → `enfoque`; desde un lado → `whoosh-corto`. Nunca suenan dos a menos de 2.5 s (gana el zoom, luego el barrido, luego la imagen) y van un 30 % más bajos que el resto. Las salidas con `desenfoque` son silenciosas.
- Imagen que `cae` → `pop`. `sonido: 'brillo'` o `sonido: false` en la imagen para cambiarlo.
- Píldora → `tic`. Tachado o subrayado → `trazo`. Palabra de neón (cine) → `brillo`, uno cada 4 s como máximo. Cierre (monocromo) → `boom`.
- Volumen general: `volumenSonidos: 0.4` (por defecto). `sonidos: false` los quita todos.
- Música: `node <skill>/scripts/musica.mjs "<estilo>" --nombre <nombre>`. Estilos que funcionan:
  - monocromo: `minimal corporate tech ambient, deep sub bass pulses, soft muted piano chords, subtle ticking percussion, clean modern agency, cinematic, restrained, 100 bpm`
  - cine: `dark cinematic minimal, deep ambient drone, soft felt piano, slow heartbeat pulse, elegant luxury trailer tension, airy risers, 85 bpm`

## Guion
- Frases cortas, una idea por escena. Monocromo: una palabra clave gigante por escena, y enumeraciones rápidas («hashtags, horarios, tendencias») con una escena por palabra.
- Cine: 2-3 escenas con neón y un ícono cada una; la segunda mitad en crema con la propuesta y la invitación.
- Ritmo: monocromo 2.2-2.4 palabras/s (Alex, pausado); cine 2.6-2.8 (Dora).
