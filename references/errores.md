# Errores que ya pasaron (no los repitas)

## Tiempos y transcripción
- **Transcribir el archivo equivocado.** Si quitas silencios, los tiempos del original ya no sirven. Transcribe siempre el archivo que apunta `video.src`.
- **Momentos que se adelantan a la voz.** Un momento que aparece antes de que se diga su palabra se siente raro. Usa el `start` exacto de la palabra en `palabras.json`, no una estimación.
- **Números como texto.** Whisper a veces escribe «tres» y a veces «3»: el conteo de `cifra` necesita dígitos en `texto`, aunque la voz diga la palabra.
- **Símbolos sueltos.** `transcribir.py` ya pega «90 %» → «90%» y «$ 50» → «$50». Si ves otro símbolo suelto, pégalo a mano en `palabras.json`, uniendo `start` y `end`.
- **Palabras partidas.** Whisper a veces separa palabras extranjeras («a Mateur» por «amateur»). Únelas: `start` de la primera, `end` de la última y cualquier `id`.
- **Voz IA más corta o larga de lo planeado.** Con `voz.py`, la voz IA dice ~2.7 palabras por segundo, contando las pausas entre frases. Ajusta con `--velocidad` (0.9-1.1) o `--pausa` antes de reescribir el guion.
- **Letras «rotas» en la terminal.** En Windows, la consola a veces muestra «Sab�as» aunque el archivo esté bien (UTF-8). Revisa el texto en el archivo antes de «corregir» tildes.

## Diseño
- **Palabras de subtítulo pegadas.** Pasaba porque las palabras que aún no se decían esperaban agrandadas (`fromTo` de GSAP aplica el estado inicial de inmediato). Ya se corrigió con `immediateRender: false`. Si creas animaciones por palabra, usa lo mismo.
- **Dos tarjetas a la vez.** Un momento con tarjeta (chat, gráfica, lista…) que empieza antes de que termine otro se encima. El motor ya retira los títulos solos; para el resto, haz que el `en` del siguiente sea ≥ `en + dur` del anterior.
- **Emojis dentro de textos.** Se ven distinto (o como cuadros) según la computadora. Usa el momento `emoji`.
- **Tarjetas que chocan con los subtítulos.** Los momentos van al 36 % de la altura y los subtítulos al 64 %. Si mueves uno con `altura`, deja al menos un 20 % de distancia. `check` lo avisa como `content_overlap`.
- **Tapar la cara.** En grabaciones, revisa las capturas: si el gancho o una tarjeta tapa los ojos, mueve la tarjeta con `altura` o acorta el gancho.
- **Demasiados momentos.** Más de uno cada 2 s cansa y compite con los subtítulos. Lo justo es un cambio cada 2-4 s.
- **Gancho largo.** Más de 7 palabras no se alcanza a leer en 3 s.
- **Cierre que repite el botón.** Con `accion: 'comentar'`, el botón ya dice «Comenta GUIA»: el `texto` debe decir otra cosa («Te mando la *guía*»).
- **Cierre de menos de 2 s.** No da tiempo de leerlo: alarga `duracion`.
- **Subtítulos en dos líneas que se tocan.** Ya se corrigió con interlineado 1.24. Si creas un estilo con una fuente muy alta, sube su `line-height`.

## HyperFrames
- **Cortar por volumen en vez de por palabras.** Un ventilador o la calle confunden a los cortes por volumen. `cortar.mjs` usa la transcripción: detecta pausas reales, muletillas y repeticiones.
- **Limpieza que sube el ruido.** Comprimir la voz sin una puerta de ruido sube el ruido de fondo en las pausas (lo medimos: empeoraba 4 dB). `limpiar-voz.mjs` ya lleva la puerta.
- **Reel mudo en modo «solo idea».** `reel.js` nace con `voz: null`. Después de generar la voz, pon `voz: { src: 'assets/voz.wav' }`. `armar.mjs` ya la detecta sola y avisa si no hay audio.
- **`composition_file_too_large` en `check`.** Sale siempre (el motor va incrustado) y no afecta el render: ignóralo.
- **Avisos informativos (ℹ) esperables en `check`.** `text_occluded` sobre la marca de agua mientras hay una `palabra` a pantalla completa, y `content_overlap` en el instante en que entra un grupo de subtítulos `impacto` (entra agrandado). Son transitorios: si `check` dice «Check passed», está bien.
- **Avisos del modo editorial en `check`.** Un `console_warning` de sombreadores de Three.js (X4122/X4008) sale siempre: es del navegador y no afecta el render. `text_occluded` cuando el brillo de una `cifra` toca el texto de arriba: deja más aire o baja `tam`.
- **Palabras muy largas en `impacto`.** Ya se corrigió: el motor achica el grupo hasta que la palabra más larga («PUBLICACIONES») quepa en el ancho.
- **Tarjetas con huecos.** Chat y lista crecen a medida que entra cada mensaje o punto. Si creas un momento con elementos que aparecen de a uno, usa `crecer()` de `motor.js` (anima la altura; HyperFrames rechaza animar márgenes).
- **Editar `index.html` a mano.** Se pierde en el siguiente `armar.mjs`. Todo va en `reel.js`, o en `motor/` si es un cambio de diseño.
- **Aviso de contraste en `check`.** Cuando la palabra activa pasa sobre el fondo del mismo color, `check` puede marcar contraste bajo porque mide el relleno y no el contorno negro. Mira la captura: si se lee, está bien. Si no se lee, usa `caja` o cambia el color `suave`.
- **Video sin audio en el render.** `armar.mjs` detecta si la grabación tiene audio y la marca con `data-has-audio`. Si el render sale mudo, revisa `ffprobe assets/grabacion.mp4`.
- **La transcripción de HyperFrames (`npx hyperframes transcribe`) necesita whisper.cpp**, que en Windows no viene instalado. Por eso el skill usa `transcribir.py` con faster-whisper.
- **Voz IA: usa `voz.py`, no `npx hyperframes tts`.** El de HyperFrames solo ofrece la voz femenina (Dora) y necesita `HYPERFRAMES_PYTHON`; `voz.py` usa el mismo modelo, suma las voces masculinas (Alex, Santa) y hace pausas naturales entre frases.
- **`text_occluded` por la viñeta** (monocromo y cine). Una viñeta hecha con un `div` encima de todo hace que `check` crea que tapa el texto. Ya va en `#root::after`, que se ve igual y no cuenta como elemento.
- **`subtitulos: false` no quitaba los subtítulos.** Ya se corrigió en `motor.js`.
- **Proyectos dentro de OneDrive, iCloud o Dropbox.** La sincronización bloquea archivos durante el render. Crea los proyectos en una carpeta local.

## Audio
- **Zumbido constante.** Un soplo en cada cambio de escena o título, en escenas de 1-2 s, suena como un ventilador. El creador lo nota enseguida. Ya se limita: nunca dos soplos a menos de 2.5 s, en todos los estilos. Si quieres más vida, varía efectos (golpe, tic, brillo, trazo, subida), no sumes soplos.
- **Música a volumen fijo.** Con niveles fijos, la música tapaba a Dora (voz baja) y quedaba muy baja con Alex. `armar.mjs` ahora mide la voz y ubica la música en relación a ella; no la subas ni la bajes a mano salvo que el creador lo pida (`musica.volumen`).
- **«la ia» dicho como «la ya».** Kokoro lee «ia» en minúsculas como «ya». En el guion para la voz, escribe «IA» en mayúsculas.
- **Llaves en el chat.** La llave de Suno va solo en `~/.reels-animados/keys.env`. Si el creador la pega en el chat, dile que la rote.

## Monocromo y cine
- **Palabras que no aparecen en la voz.** El texto de pantalla tiene que decir lo mismo que la voz y en el mismo orden (puede saltarse palabras). `armar` avisa las que no encuentra; las pone justo después de la anterior, lo que suele verse mal. Corrige el texto o la transcripción. Las palabras que whisper separa («chat gpt») ya se reconocen solas («ChatGPT»).
- **Escena que se va antes de leerse.** En escenas cortas, la salida empezaba antes de que la última palabra se enfocara. Ya se corrigió: ninguna escena sale hasta 0.4 s después de su última palabra.
- **Pantalla vacía entre frases (cine).** Con fondo negro, cada hueco se nota. Las escenas de cine entran 0.12 s antes de su primera palabra para no dejar la pantalla vacía.
- **Imagen que tapa la palabra clave.** Revisa las capturas: si el ícono cae sobre el texto, bájalo con `y`.
- **Imágenes con fondo.** Casi todas llegan con fondo (o con el cuadriculado de «transparente» pintado). Pásalas por `recortar.py` y míralas sobre papel antes de armar. Luces sobre negro (tableros, neones): `--tinta`.
- **Grabación de baja calidad en la tarjeta.** Un video de 360p se ve suave agrandado; el blanco y negro con contraste lo disimula, pero pide la mejor versión disponible.
