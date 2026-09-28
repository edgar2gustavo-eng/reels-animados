# reels-animados

**Una skill para Claude Code que convierte una idea en un reel animado listo para publicar, sin que tengas que salir en cámara.** Claude escribe el guion, lo narra con una voz IA en español y lo anima con tu marca: escenas, subtítulos, chats, gráficas, notificaciones, efectos de sonido y cierre con llamado a la acción. También funciona con tu voz grabada o con un video tuyo. Todo en español, gratis, y hecha sobre [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP).

> Le dices a Claude: *«Hazme un reel de 30 segundos sobre cómo conseguir clientes por Instagram, con voz masculina, y que al final comenten CLIENTES»*, y te entrega el MP4, la portada y el texto para publicar.

<!-- Reemplaza con tu GIF o video de demostración -->
<!-- ![demo](docs/demo.gif) -->

## Qué hace

**Sin rostro (el modo principal)**
- **Guion con estructura que retiene**: gancho en los primeros segundos, 2-4 puntos y un solo cierre.
- **Voz IA local en español**: Dora (femenina), Alex y Santa (masculinas). Gratis y sin enviar nada a internet.
- **Escenas por sección**: cada punto tiene su propio fondo animado (rayos, piso en perspectiva, puntos, ondas…), un barrido de transición y el número gigante de fondo.
- **13 tipos de momento** que aparecen justo cuando la voz los nombra: cifras que cuentan, títulos, listas, **chats**, **comparaciones antes/después**, **gráficas**, **notificaciones**, **citas**, **emojis**, íconos, palabras gigantes, capturas y zooms.
- **6 estilos de subtítulo**: `pop`, `caja`, `resaltador`, `minimal`, `impacto` y `editorial`. Cambiar de estilo es cambiar una palabra.
- **Modo editorial**: tipografía cinética sobre papel, con cifras que brillan, gráficas que se dibujan y **objetos 3D hechos con código** (cerebro, diana con flecha, estrellas, rompecabezas, monedas…). Sin IA de imágenes ni modelos descargados.
- **Estilo monocromo**: el texto de la voz aparece palabra por palabra sobre papel blanco con viñeta, pasa de gris a negro al decirse, con recortes en blanco y negro que entran desenfocados, píldoras, tachados y cierre en negro con tu marca.
- **Estilo cine**: fondo negro, serif fina (Bodoni Moda) mezclada con sans, palabras con brillo de neón, íconos que brillan, trazos a mano y vuelos a través del texto, con un cambio a papel crema.

**Con tu voz o tu video**
- **Limpia la voz** grabada con el celular: ruido, graves, eses y volumen.
- **Cortes inteligentes** con la transcripción: pausas largas, muletillas («eh», «este», «o sea») y frases repetidas, con fundidos en cada unión.
- **Animación encima de tu grabación**: subtítulos, momentos y zooms, con recorte automático a vertical.
- **Tu grabación en estilo monocromo**: el video en blanco y negro en una tarjeta sobre papel, con cada palabra en pantalla como subtítulo.
- **Clips de videos largos**: de una entrevista, podcast o live de una hora, Claude encuentra el mejor tramo de 30 s (que arranque con gancho y se entienda solo), lo recorta y le quita las pausas.

**Siempre**
- **Tu kit de marca una sola vez**: colores, fuentes, logo y @usuario en todos tus reels.
- **Entrega lista para publicar**: volumen a −14 LUFS (el de Instagram, TikTok y YouTube), versión liviana para WhatsApp, portada y revisión automática.
- **Música a la medida con Suno** (opcional, con tu llave de sunoapi.org): una pista instrumental por estilo, guardada en tu biblioteca local, que baja sola cuando hablas.
- **16 efectos de sonido propios**, sintetizados con código, con reglas para que no suenen de más.
- **Quita el fondo de tus imágenes** (rembg, local) para los estilos monocromo y cine.
- Formatos **9:16, 4:5, 1:1 y 16:9**.

## Instalar

Necesitas [Claude Code](https://claude.com/claude-code), **Node.js 22+**, **ffmpeg** y **Python 3.9+**.

**Mac, Linux o Git Bash:**
```bash
git clone https://github.com/edgar2gustavo-eng/reels-animados ~/.claude/skills/reels-animados
node ~/.claude/skills/reels-animados/scripts/preparar.mjs
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/edgar2gustavo-eng/reels-animados "$HOME\.claude\skills\reels-animados"
node "$HOME\.claude\skills\reels-animados\scripts\preparar.mjs"
```

**O pídeselo a Claude Code:** *«Instala la skill https://github.com/edgar2gustavo-eng/reels-animados en mi carpeta de skills y corre su preparar.mjs»*.

Después, **reinicia Claude Code** para que cargue la skill.

`preparar.mjs` revisa lo que falta y crea un entorno de Python en `~/.reels-animados/` con la transcripción (faster-whisper), las voces (Kokoro, ~350 MB), el recorte de fondos de imágenes (rembg, ~180 MB) y el navegador con el que HyperFrames renderiza (~100 MB). Todo se descarga una sola vez. Si no quieres alguna parte: `--sin-voz` o `--sin-recortes`. Para instalar ffmpeg: `winget install ffmpeg` en Windows o `brew install ffmpeg` en Mac.

Opcional:
- **Música con Suno**: crea tu llave en [sunoapi.org](https://sunoapi.org) y guárdala en `~/.reels-animados/keys.env` como `SUNO_API_KEY=...`. Nunca la pegues en el chat ni la subas a un repositorio. Las pistas quedan en `~/.reels-animados/musica/` y sus derechos dependen de tu plan de Suno.

## Usar

Abre Claude Code en una carpeta (mejor si no está sincronizada con OneDrive, iCloud o Dropbox) y pídelo con tus palabras:

- *«Hazme un reel de 3 errores al grabarse con el celular. No quiero salir en cámara; usa voz de hombre»*
- *«Tengo este audio (`idea.m4a`): límpialo, quítale las muletillas y anímalo»*
- *«Ponle subtítulos estilo pop a mi video `grabacion.mp4` y quítale los silencios»*
- *«El mismo reel, pero con subtítulos estilo caja y la voz de Dora»*
- *«Te paso fotos de mis productos: quítales el fondo y haz un reel en estilo monocromo con ellas»*
- *«Saca el mejor minuto de este podcast (`episodio.mp4`) y hazlo un reel de 30 segundos con subtítulos»*

La primera vez, Claude te pregunta por tu marca y la guarda para siempre en `~/.reels-animados/marca.json`.

## Cómo funciona

```
idea ──► guion ──► voz.py (voz IA)  ─┐
audio grabado ──► limpiar-voz.mjs ───┼─► transcribir.py ─► cortar.mjs (pausas, muletillas, repeticiones)
video a cámara ──────────────────────┘                                     │
                                                                          ▼
                    reel.js  ◄── Claude escribe aquí el guion visual: gancho, escenas, momentos, cierre
                       │
                       ├─ armar.mjs              genera index.html (composición HyperFrames)
                       ├─ hyperframes check      revisa textos encimados, contraste…
                       ├─ hyperframes render     → MP4
                       └─ entregar.mjs           volumen −14 LUFS, versión liviana, portada, revisión
```

Cada reel es una carpeta con un `reel.js` legible: puedes editarlo a mano, cambiar un color o un tiempo, y volver a armar.

## Personalizar

- **Nuevos estilos de subtítulo**: una clase CSS en `plantilla/motor/reel.css` (ver `references/subtitulos.md`).
- **Nuevos momentos**: una función en `MOMENTOS` dentro de `plantilla/motor/motor.js`.
- **Nuevos fondos de escena**: una función en `FONDO` dentro de `plantilla/motor/motor.js`.
- **Nuevos objetos 3D**: una función en `FABRICA` dentro de `plantilla/motor/objetos3d.js` (ver `references/editorial.md`).
- **Guía de ganchos, estructura y cierres**: `references/ganchos.md`.

## Créditos

Creado por **Edgar Navarrete** ([@edgar2gustavo-eng](https://github.com/edgar2gustavo-eng)).

- Motor de video: [HyperFrames](https://github.com/heygen-com/hyperframes), de HeyGen (Apache 2.0).
- Transcripción: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT).
- Voces: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0), vía [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT).
- Emojis: [Twemoji](https://github.com/jdecked/twemoji) (gráficos CC-BY 4.0).
- Quitar fondos: [rembg](https://github.com/danielgatis/rembg) (MIT), opcional. Música: [Suno](https://suno.com) vía [sunoapi.org](https://sunoapi.org), opcional y con la llave de cada usuario.
- Animación: [GSAP](https://gsap.com). Objetos 3D: [Three.js](https://threejs.org) (MIT).
- Fuente del estilo cine: [Bodoni Moda](https://github.com/indestructible-type/Bodoni) (SIL Open Font License 1.1, incluida en `plantilla/motor/fuentes/`).
- Ideas tomadas de proyectos abiertos: cortes por palabra y revisiones automáticas de [Montazh_Agent](https://github.com/AgentSmoki/Montazh_Agent); cortes de silencio de [auto-editor](https://github.com/WyattBlue/auto-editor).

Licencia MIT: úsala, modifícala y compártela. Si te sirvió, cuéntalo y dale una estrella al repositorio.
