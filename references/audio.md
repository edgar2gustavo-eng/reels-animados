# Audio: música, efectos y mezcla

La voz manda. La música la acompaña por debajo y los efectos marcan pocos momentos. Todo se mezcla solo al armar.

## Música

### Con Suno (opcional, recomendado)
Música instrumental a la medida del estilo, generada con la API de Suno vía [sunoapi.org](https://sunoapi.org). Sin llave, la skill funciona igual (sin música o con un mp3 propio).

1. El creador crea su llave en sunoapi.org y la guarda **él mismo** en `~/.reels-animados/keys.env`:
   ```
   SUNO_API_KEY=...
   ```
   Nunca le pidas que la pegue en el chat, y nunca la imprimas ni la escribas en el proyecto. Para comprobar que está, mira solo que exista la línea.
2. Genera y guarda en la biblioteca local:
   ```bash
   node <skill>/scripts/musica.mjs --creditos                                   # créditos que quedan
   node <skill>/scripts/musica.mjs "<estilo en inglés>" --nombre energico --duracion 40
   node <skill>/scripts/musica.mjs --lista                                      # tu biblioteca
   ```
   Cada generación cuesta ~12 créditos y entrega **dos** variantes: `~/.reels-animados/musica/<nombre>-1.mp3` y `-2.mp3`, con una ficha `.json` (estilo, modelo, fecha). Tarda 1-3 minutos. Los archivos de Suno caducan en sus servidores a los 14 días: el script los baja al momento.
3. Úsala en `reel.js`: `musica: { nombre: 'energico-1' }`. `armar.mjs` la copia a `assets/`.

**Derechos**: dependen de los términos de Suno/sunoapi.org y del plan del creador. La biblioteca vive fuera del proyecto y del repositorio: no subas esas pistas a un repositorio público.

Estilos que funcionan (el `--duracion` al largo del reel + 5 s):

| estilo del reel | prompt de Suno |
|---|---|
| dinámico, energético (probado: «energico») | `modern upbeat corporate pop, punchy drums, plucky synth, warm bass, motivational and confident, clean mix for voiceover, 118 BPM, instrumental` |
| reflexivo, calma (probado: «sueno») | `calm dreamy lo-fi, soft felt piano, warm pads, gentle brushed beat, relaxing night mood, elegant and minimal, clean mix for voiceover, 78 BPM, instrumental` |
| monocromo (probado) | `minimal corporate tech ambient, deep sub bass pulses, soft muted piano chords, subtle ticking percussion, clean modern agency, cinematic, restrained, 100 bpm` |
| cine (probado) | `dark cinematic minimal, deep ambient drone, soft felt piano, slow heartbeat pulse, elegant luxury trailer tension, airy risers, 85 bpm` |
| editorial, curiosidad (sin probar) | `playful minimal electronic, soft marimba, light percussion, curious, clean mix for voiceover, 105 BPM, instrumental` |

Siempre instrumental (el script ya lo pide y excluye voces). No pidas «como la canción X» ni nombres de artistas.

### Con un mp3 propio
`musica: { src: 'assets/musica.mp3', inicio: 12 }` (`inicio` = segundo de la pista donde empieza). Solo música que el creador pueda usar: propia, con licencia o libre de derechos.

### Mezcla automática
No hay que ajustar volúmenes a mano. `armar.mjs`:
- mide el volumen real de la voz (LUFS) y pone la música **3 dB por debajo** en las pausas;
- cuando alguien habla, la baja otros ~6 dB con *sidechain* (la voz la empuja hacia abajo), así siempre se entiende;
- la hace entrar con un fundido de 0.5 s y salir con uno de 1.8 s al final;
- guarda la mezcla en `assets/.mezcla/` y la reutiliza si nada cambió.

`musica: { nombre, volumen: 0.8 }` la baja un poco más si el creador la siente fuerte. Con una grabación, la «voz» es el audio del video.

## Efectos de sonido

16 efectos sintetizados con código (`scripts/sfx.py`, numpy): sin muestras de terceros, así que se publican con la skill. Viven en `motor/sfx/`.

| efecto | qué es | lo usa |
|---|---|---|
| `whoosh` | soplo que cruza | vuelo con zoom (cine), algunas transiciones |
| `whoosh-corto` | soplo breve | barridos, imágenes que entran de lado, comparaciones |
| `enfoque` | aire que crece y se corta | imagen que entra enfocándose (monocromo, cine) |
| `subida` | tensión que sube | antes de una palabra gigante, antes del cierre, gráficas |
| `golpe` | impacto con cuerpo | palabra gigante, entradas fuertes, flecha que se clava |
| `boom` | golpe grave de cine | cierre de monocromo |
| `pop` | burbuja corta | cifras, íconos, objetos 3D, tarjetas |
| `clic` | clic seco | mensajes propios en un chat |
| `tic` | tic de reloj | cada punto de una lista, píldoras, enumeraciones rápidas |
| `ding` | campana | libre |
| `notificacion` | dos notas | notificaciones |
| `exito` | arpegio ascendente | cierre con botón |
| `dinero` | monedas | monedas, ventas |
| `brillo` | destellos | estrellas, emojis, palabras de neón |
| `teclado` | tecleo | escribir, fichas que caen (dominó) |
| `trazo` | lápiz | tachados y subrayados |

Para regenerarlos o crear uno nuevo: agrega una función en `sfx.py`, súmala a `EFECTOS` y corre `<py> <skill>/scripts/sfx.py plantilla/motor/sfx <nombre>`. Suma su duración a `SFX_DUR` en `armar.mjs`.

### Reglas (ya las aplica `armar.mjs`)
- **Pocos soplos.** Nunca dos soplos (`whoosh`, `whoosh-corto`, `enfoque`) a menos de 2.5 s, en ningún estilo: el que sobra se cambia por un `pop` suave o se quita. Los soplos van un 30 % más bajos que el resto. Un soplo en cada cambio de escena se vuelve un zumbido constante; el creador lo nota enseguida.
- **Variedad.** Cada momento tiene su propio efecto (golpe, tic, brillo, trazo, subida…). Si un reel suena monótono, cambia efectos por momento o imagen con `sonido: 'teclado'`, no agregues más.
- **Sin amontonar.** Si dos efectos caen a menos de 0.22 s, queda el más importante (`boom` > `golpe` > `exito` > `trazo` > `enfoque` > `subida` > …).
- `sonido: false` en un momento o imagen lo silencia; `sonidos: false` en `reel.js` quita todos; `volumenSonidos` (0-1) los sube o baja todos.

## Entrega
`entregar.mjs` normaliza el reel a **−14 LUFS** (el de Instagram, TikTok y YouTube) en dos pasadas, con picos a −1 dBTP, y avisa silencios de más de 1.5 s. No subas volúmenes a mano para compensar: se nivelan ahí.
