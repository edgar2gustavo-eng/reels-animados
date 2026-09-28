---
name: reels-animados
description: Crea reels animados (Instagram Reels, TikTok, YouTube Shorts) en español a partir de una idea, un guion, una voz en off, una grabación o un video largo del que saca el mejor clip. Sin salir en cámara: escribe el guion, lo narra con voz IA local y lo anima con subtítulos palabra por palabra, gancho, cifras, listas, chats, gráficas, música (Suno) y efectos de sonido. Cuatro estilos: dinámico, editorial con objetos 3D, monocromo (papel blanco, recortes en blanco y negro) y cine (fondo negro, neón). Usa el kit de marca del creador, limpia voces, quita pausas y muletillas y quita fondos de imágenes. Hecho sobre HyperFrames. Úsalo siempre que alguien quiera un reel, short, TikTok o video vertical animado, un video sin mostrar la cara, convertir una idea en video, subtitular su voz o su video, o sacar un clip de una entrevista o podcast, aunque no mencione esta skill.
---

# reels-animados

Hace reels animados para creadores y marcas. El modo principal es **sin rostro**: idea → guion → voz → animación. También sirve con una voz grabada o con una grabación a cámara.

Cada reel es un proyecto pequeño:
- `reel.js`: el guion visual en datos (gancho, momentos, escenas, cierre). **Solo editas este archivo.**
- `palabras.json`: la transcripción palabra por palabra, que marca el ritmo de todo.
- `index.html`: la composición de HyperFrames, que genera `armar.mjs`. No se edita a mano.
- `motor/`: la copia local del motor (subtítulos, escenas, momentos, sonidos).

`<skill>` es la carpeta donde está este archivo. Los scripts están en `<skill>/scripts/`.
`<py>` es el Python del skill: `~/.reels-animados/venv/Scripts/python` en Windows y `~/.reels-animados/venv/bin/python` en Mac o Linux.

Referencias (léelas cuando toque, no antes):
- `references/reel-js.md`: todos los campos de `reel.js` y cada tipo de momento con ejemplo. **Léelo antes de escribir el primer `reel.js`.**
- `references/ganchos.md`: fórmulas de gancho, estructura que retiene, qué momento usar y cierres. **Léelo antes de escribir el guion.**
- `references/subtitulos.md`: los 6 estilos de subtítulo, cuándo usar cada uno y cómo crear uno propio.
- `references/editorial.md`: el modo editorial (tipografía cinética con objetos 3D). **Léelo antes de escribir un reel en ese modo.**
- `references/monocromo-cine.md`: los estilos monocromo y cine (el texto de pantalla es la voz). **Léelo antes de escribir un reel en esos estilos.**
- `references/audio.md`: música con Suno, los 16 efectos, la mezcla automática y la regla de pocos soplos. **Léelo antes de poner música.**
- `references/marca.md`: la entrevista de marca y el formato de `marca.json`.
- `references/errores.md`: errores que ya pasaron y cómo evitarlos. **Léelo antes de mostrar el primer borrador.**

## 0 · Preparar la máquina (una sola vez)

```bash
node <skill>/scripts/preparar.mjs --voz    # Node 22+, ffmpeg, HyperFrames, transcripción y voces IA en español
node <skill>/scripts/preparar.mjs --recortes   # opcional: quitar fondos de imágenes (estilos monocromo y cine)
```
Si algo sale con ✖, explícale al usuario cómo instalarlo en su sistema y no sigas hasta que esté listo.

## 1 · Marca (solo la primera vez)

Revisa si ya hay marca: `node <skill>/scripts/guardar-marca.mjs`. Si ya existe, úsala sin preguntar de nuevo; el creador la configuró para no repetirla.
Si no existe, haz la entrevista de `references/marca.md` en **un solo mensaje**. Escribe el JSON y guárdalo con `node <skill>/scripts/guardar-marca.mjs marca.json`.

## 2 · Entrevista del reel (un solo mensaje, con opciones para responder rápido)

1. **Tema y objetivo**: ¿qué debe sentir o hacer quien lo vea? (seguirte, comentar, guardar, comprar).
2. **Fuente**, que decide el camino:
   - (a) **solo idea**: el modo principal. Tú escribes el guion y lo narra la voz IA (`dora` femenina; `alex` o `santa` masculinas), o el creador lo graba en audio.
   - (b) **voz en off**: el creador ya tiene un audio narrado.
   - (c) **grabación a cámara**: el creador se grabó hablando; la animación va encima (estilo dinámico) o la grabación va en una tarjeta en blanco y negro sobre papel (estilo monocromo).
   - (d) **clip de un video largo**: entrevista, podcast, live o charla de 5-60 min; tú eliges el mejor tramo de 20-30 s (ver §4).
3. **Duración**: 20-35 s rinde mejor; hasta 60 s si el contenido lo aguanta.
4. **Estilo visual**, en modo sin rostro. Ofrece los cuatro:
   - **dinámico** (el normal): fondo oscuro con escenas de color, subtítulos animados y tarjetas (chat, gráfica, notificaciones…). Para consejos rápidos, ventas y tono energético. Pregunta el estilo de subtítulo (el de su marca, o 2 de `references/subtitulos.md`).
   - **editorial**: papel claro, frases compuestas con tipografía mezclada y objetos 3D. Para datos curiosos, educación y tono premium. Ver `references/editorial.md`.
   - **monocromo**: papel blanco con viñeta, el texto de la voz en sans gruesa que pasa de gris a negro, recortes en blanco y negro que entran desenfocados, píldoras y tachados; cierre en negro con la marca. Para agencias, servicios B2B, reflexiones de negocio. Voz masculina pausada. Necesita imágenes PNG sin fondo (una por escena, casi siempre): pídeselas al creador con una lista. Ver `references/monocromo-cine.md`.
   - **cine**: fondo negro, serif fina mezclada con sans, palabras con brillo de neón, íconos que brillan y vuelos a través del texto; la segunda mitad en papel crema. Para marca personal premium, servicios creativos, lanzamientos. Voz femenina. Necesita 3-5 íconos PNG sin fondo. Ver `references/monocromo-cine.md`.
5. **Material real**: cifras, capturas, testimonios, precios, música propia (mp3). Nunca inventes datos que el video presente como reales.
6. **Cierre**: seguir, comentar una palabra clave, guardar o link en el perfil.

Si el pedido ya trae varias de estas respuestas, no las vuelvas a preguntar.

## 3 · Crear el proyecto

Crea los proyectos fuera de carpetas sincronizadas (OneDrive, iCloud, Dropbox): los renders pesan y la sincronización los bloquea.

```bash
node <skill>/scripts/nuevo.mjs <carpeta>                           # (a) solo idea
node <skill>/scripts/nuevo.mjs <carpeta> --modo editorial          # (a) solo idea, estilo editorial
node <skill>/scripts/nuevo.mjs <carpeta> --modo monocromo          # (a) solo idea, estilo monocromo (o --modo cine)
node <skill>/scripts/nuevo.mjs <carpeta> --voz voz.m4a             # (b) voz en off
node <skill>/scripts/nuevo.mjs <carpeta> --video grabacion.mp4     # (c) grabación
```
Formatos (`--formato`): `9:16` (por defecto), `4:5`, `1:1` y `16:9`. `nuevo` copia la voz como `assets/voz.<ext>` y el video como `assets/grabacion.<ext>`. Todos los comandos siguientes se corren dentro de `<carpeta>`.

**Música** (`references/audio.md`): si el creador tiene llave de Suno en `~/.reels-animados/keys.env`, genera una pista a la medida del estilo con `musica.mjs` (o usa una de su biblioteca: `musica.mjs --lista`) y ponla como `musica: { nombre: '<nombre>-1' }`. Si no, pregúntale por un mp3 propio o libre de derechos (`musica: { src }`). La mezcla con la voz es automática. Sin música, el cierre queda en silencio y `entregar` lo avisa; es aceptable.

## 4 · Voz y transcripción

**(a) Solo idea.** Escribe el guion con `references/ganchos.md` y muéstraselo al creador antes de generar la voz. Ritmo de la voz IA con `voz.py`: ~2.6-2.7 palabras por segundo (30 s ≈ 80 palabras; para un largo exacto, ajusta `--velocidad` en lugar de reescribir). Frases cortas, de 6 a 12 palabras. La palabra clave del cierre va en minúsculas y con tilde («comenta guía»); en mayúsculas, la voz la deletrea. Excepción: «IA» va en mayúsculas para que la voz diga «i-a» (en minúsculas dice «ya»). Cuando el creador apruebe:
```bash
<py> <skill>/scripts/voz.py "<guion>" --voz alex --salida assets/voz.wav    # o: guion.txt · --velocidad 0.95 · --pausa 0.3
<py> <skill>/scripts/transcribir.py assets/voz.wav
```
Pon `voz: { src: 'assets/voz.wav' }` en `reel.js`. Si lo olvidas, `armar.mjs` la detecta y te avisa.

**(b) Voz en off grabada y (c) grabación.** Primero límpiala y quítale lo que sobra:
```bash
node <skill>/scripts/limpiar-voz.mjs assets/voz.m4a assets/voz-limpia.wav      # ruido, graves, eses, volumen (--ruido suave|medio|fuerte); en video: assets/grabacion.mp4
<py> <skill>/scripts/transcribir.py assets/voz-limpia.wav
node <skill>/scripts/cortar.mjs proponer assets/voz-limpia.wav                  # pausas, muletillas y repeticiones → cortes.json
```
Revisa la lista que imprime `cortar`: lo marcado con ✂ se quita y lo marcado con ? es dudoso («este», «bueno», «o sea»). Decide cada dudoso según la frase: ponlo en `"aplicar": true` si sobra. Luego:
```bash
node <skill>/scripts/cortar.mjs aplicar                                          # corta con fundidos y reescribe palabras.json
```
El resultado se llama como el original más `-cortado` (`assets/voz-limpia-cortado.wav`, `assets/grabacion-cortado.mp4`). Apunta `voz.src` o `video.src` en `reel.js` a ese archivo. No hace falta volver a transcribir: `aplicar` recalcula los tiempos.

Whisper a veces no escribe las muletillas («eh», «mmm»): las omite y deja un hueco. `cortar` las atrapa como pausas si duran más de 0.35 s. Si el creador dice que se trabó y `proponer` no encuentra nada, prueba `--pausa 0.25` o pregúntale en qué frase fue, y agrega ese corte a mano en `cortes.json` (`{ "tipo": "manual", "desde": s, "hasta": s, "texto": "…", "aplicar": true }`).

**(d) Clip de un video largo.**
1. Transcribe el video completo con tiempos por frase (faster-whisper `small`, en CPU tarda ~1 min por cada 3 min de video):
   ```bash
   ffmpeg -i video.mp4 -vn -ac 1 -ar 16000 audio.wav
   <py> -c "from faster_whisper import WhisperModel; m=WhisperModel('small',device='cpu',compute_type='int8'); s,_=m.transcribe('audio.wav',language='es',vad_filter=True); [print(f'{x.start:7.1f} {x.end:7.1f} {x.text.strip()}') for x in s]" > transcripcion.txt
   ```
2. Lee `transcripcion.txt` entera y elige el tramo: una idea completa que se entienda sin contexto, que **arranque con gancho** (una afirmación fuerte, una pregunta, un número) y cierre con una conclusión. Las conclusiones y las «lecciones» del final suelen ser el mejor clip. Díle al creador qué tramo elegiste y por qué.
3. Corta un margen amplio, transcríbelo palabra por palabra y ajusta el inicio y el fin exactos a la primera y la última palabra:
   ```bash
   ffmpeg -ss <inicio-3> -i video.mp4 -t <dur+6> -c:v libx264 -crf 16 -c:a aac assets/tramo.mp4
   <py> <skill>/scripts/transcribir.py assets/tramo.mp4
   ffmpeg -ss <primera palabra - 0.2> -i assets/tramo.mp4 -t <dur> -c:v libx264 -crf 16 -c:a aac assets/clip.mp4
   <py> <skill>/scripts/transcribir.py assets/clip.mp4
   ```
4. `cortar.mjs proponer assets/clip.mp4` y **aplica solo las pausas**: en una charla, las repeticiones suelen ser a propósito («los de aquí, los de allá», «pedir un poco más, pedir un poco más»); cortarlas cambia el sentido. Luego `cortar.mjs aplicar`.
5. Si el video es de otra persona, díselo al creador y recomiéndale darle crédito (en pantalla o en la descripción): publicar contenido ajeno como propio puede terminar en un reclamo de derechos.

**Revisa la transcripción**: lee el texto que imprimen los scripts y corrige en `palabras.json` los nombres propios y términos que salieron mal. Si un error se repite, agrégalo al `glosario` de la marca. No toques los tiempos, salvo para unir palabras que se separaron (por ejemplo, «a Mateur» → «amateur»: toma el `start` de la primera y el `end` de la última). Los `id` no importan.

## 4½ · Imágenes (monocromo y cine)

Estos estilos se apoyan en imágenes: casi una por escena en monocromo y 3-5 íconos en cine. Pídeselas al creador con una **lista numerada** (A1, A2… o B1…) que diga en qué frase va cada una y qué tipo de imagen funciona (recortes de fotos u objetos 3D con buena luz; los íconos planos se ven pobres). Mientras llegan, arma el reel con lo que haya: en monocromo, sin imagen se queda la grabación o el texto solo.

Casi ninguna imagen llega sin fondo. Quítaselo con:
```bash
<py> <skill>/scripts/recortar.py originales/A1.jpg originales/A2.webp ... --salida assets    # rembg local
<py> <skill>/scripts/recortar.py originales/A2.png --tinta --salida assets                    # luz sobre fondo negro → tinta
<py> <skill>/scripts/recortar.py originales/A8.webp --arriba 0.05 --salida assets             # quita antes un pie de foto
```
Revisa los recortes sobre papel antes de armar (una hoja con todos, abierta con Read): si el recorte se comió el objeto (pasa con luces sobre negro), usa `--tinta`; si quedaron manchitas, `recortar.py` ya borra las sueltas.

## 5 · Guion visual en `reel.js`

**En modo editorial**, sigue `references/editorial.md` en lugar de esta sección: cada frase del guion es una escena con bloques y objetos 3D, sin subtítulos. El resto del flujo (armar, check, snapshots, render, entregar) es igual.

**En monocromo y cine**, sigue `references/monocromo-cine.md`: escribe las escenas con el texto que se verá (lo mismo que dice la voz, en el mismo orden) y `armar.mjs` saca todos los tiempos de `palabras.json`. Revisa la tabla de escenas que imprime y sus avisos.

Con la transcripción a la vista, decide qué pasa en pantalla y cuándo, usando los tiempos reales de `palabras.json`. Guía completa en `references/ganchos.md`. Lo esencial:
- **Gancho** (0-4 s): una frase corta que abre una pregunta, distinta de lo que dice la voz. Máximo 7 palabras.
- **Secciones**: cada punto del guion empieza con un momento `titulo` («Paso *1*»). En modo sin rostro, cada título abre una **escena nueva**, con otro fondo, un barrido de transición y el número gigante de fondo. Por eso conviene estructurar el guion en 2-4 puntos.
- **Un momento cada 2-4 s**, elegido según lo que dice la voz: número → `cifra`; enumeración → `lista`; conversación o mensaje → `chat`; antes/después o mal/bien → `comparar`; crecimiento o datos → `grafica`; ventas, seguidores o avisos → `notificacion`; frase para recordar → `cita`; emoción u objeto → `emoji` o `icono`; idea clave → `palabra` (una o dos por reel).
- Cada momento empieza en el `start` de la palabra que lo motiva. Si dos tarjetas se tocan, la segunda empieza cuando termina la primera.
- **Cierre**: `cta.en` en el `start` de la frase de despedida. Deja 2-3 s de cierre, alargando `duracion` si hace falta.
- **Audios cortos** (menos de 15 s): gancho, una sola sección con 1-2 momentos y cierre. No metas más: se amontonan. Si el contenido promete más de lo que entrega («3 trucos» y solo dice uno), no lo repitas en el gancho y avísale al creador.

Luego arma y revisa:
```bash
node <skill>/scripts/armar.mjs
npx hyperframes check                     # debe decir "Check passed"
```
Atiende los avisos (⚠) de `armar`. `check` detecta textos encimados o fuera del cuadro. El aviso `composition_file_too_large` sale siempre, porque el motor va incrustado en `index.html`: ignóralo. Corrige en `reel.js`, vuelve a armar y repite hasta que pase.

## 6 · Mirar antes de mostrar (obligatorio)

```bash
npx hyperframes snapshot --at <t1>,<t2>,...     # un instante en la mitad de cada momento, más el gancho y el cierre
```
Pide todos los instantes en una sola llamada: cada `snapshot` borra los anteriores y agrega por su cuenta un cuadro cerca del final. Mira la hoja de contacto (`snapshots/contact-sheet.jpg`; con 9 cuadros o más, `contact-sheet-1.jpg`, `-2.jpg`…) con Read y repasa `references/errores.md`. Busca textos cortados o encimados, tarjetas que choquen con los subtítulos o con otra tarjeta, y cierres vacíos. Corrige y repite.

Después abre la vista previa para el creador con `npx hyperframes preview --background`, dale el enlace y pregúntale qué cambiaría.

## 7 · Render y entrega

Solo cuando el creador apruebe:
```bash
npx hyperframes render --quality delivery --output renders/borrador.mp4
node <skill>/scripts/entregar.mjs renders/borrador.mp4 --nombre <nombre>
```
`entregar` deja el volumen en −14 LUFS (el de Instagram, TikTok y YouTube), crea una versión liviana y la portada, y revisa pantallas negras, audio y duración. Si marca ✖, corrige antes de entregar. Los ⚠ son sugerencias: un silencio de más de 1.5 s, por ejemplo, se tapa con música. Mira 3 cuadros del MP4 final: `ffmpeg -y -ss <s> -i renders/<nombre>.mp4 -frames:v 1 cuadro-<s>.png` y ábrelos con Read. Entrega:
1. `renders/<nombre>.mp4`, su duración, y la versión `-liviano.mp4` para WhatsApp.
2. La portada `renders/<nombre>-portada.png`. Cambia el segundo con `--portada <s>` si otro cuadro vende mejor.
3. **Texto para publicar**: 2-3 líneas en el tono del creador, una pregunta que invite a comentar y 3-5 hashtags del nicho (no genéricos como #viral).
4. Qué puede pedir cambiar: voz, estilo de subtítulo, gancho, momentos, ritmo o cierre. Cambiar de estilo o de voz es cambiar una palabra.

## Reglas

- **`reel.js` es la única fuente de verdad.** Después de cada cambio, corre `armar.mjs`. Si editas `index.html` a mano, el siguiente armado borra el cambio.
- Transcribe y corta siempre el archivo final. Si cambias el audio después, los tiempos quedan corridos.
- Los datos que el video presenta como reales (cifras, ventas, testimonios, chats) deben venir del creador. Si un ejemplo es ilustrativo, dilo en el guion («por ejemplo…») o pregúntale al creador.
- Nunca pongas en pantalla el nombre o la foto de un tercero sin permiso del creador. En capturas, pide que se tapen primero.
- La voz IA es sintética: si el creador publica con ella, sugiérele marcarlo cuando la plataforma lo pida.
- En grabaciones a cámara, los subtítulos, el gancho y las tarjetas no deben tapar la cara: sube `subtitulos.altura` o mueve los momentos con `altura`.
- Pocos soplos: la voz y la música llevan el ritmo. `armar.mjs` ya impide dos soplos a menos de 2.5 s; si agregas `sonido` a mano, usa efectos variados (ver `references/audio.md`).
- La llave de Suno (y cualquier otra) vive solo en `~/.reels-animados/keys.env`: no la pidas por el chat, no la imprimas, no la pongas en el proyecto.
- Contenido de terceros (clips de entrevistas, podcasts, videos ajenos): avísale al creador de quién es y recomiéndale dar crédito.
