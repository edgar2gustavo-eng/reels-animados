# Estilos de subtítulo

Se cambian con una palabra: `subtitulos: { estilo: 'caja' }`. Todos toman los colores y las fuentes de la marca.

| estilo | cómo se ve | palabras por grupo | ideal para |
|---|---|---|---|
| `pop` | mayúsculas gruesas con contorno negro; la palabra activa en color de acento y con un pequeño salto | 3 | la opción segura: consejos, tips, energía media-alta |
| `caja` | cada palabra en un bloque; la activa se invierte al color de acento | 4 | estilo TikTok; fondos claros o con mucho detalle |
| `resaltador` | un marcatextos de color se pinta detrás de cada palabra al decirla | 4 | educación, explicaciones, tono cercano |
| `minimal` | la frase completa en gris, cada palabra se enciende al decirla | 6 | reflexiones, marca personal sobria, voz calmada |
| `impacto` | 1-2 palabras gigantes que entran con un golpe | 2 | ritmo rápido, motivación, anuncios |
| `editorial` | serif elegante (Playfair Display), énfasis en cursiva | 5 | historias, lujo, belleza, opinión |

## Cómo recomendar

Lee el tono del guion y ofrece dos opciones, con una línea de por qué:
- energía alta, humor, ventas → `impacto` o `pop`
- enseñanza paso a paso → `resaltador` o `pop`
- testimonio, historia personal → `minimal` o `editorial`
- video con fondo muy cargado o claro → `caja`, que siempre se lee

## Énfasis

Las palabras con cifras se pintan solas. Para resaltar otras, agrégalas a `enfasis` en `reel.js`. Se comparan sin tildes ni mayúsculas, así que `'subtitulos'` también encuentra «Subtítulos». Resalta 3-6 palabras por reel: si todo resalta, nada resalta.

## Posición

- En vertical, los subtítulos quedan al 64 % de la altura: arriba de la zona que tapan el nombre de usuario y la descripción de Instagram y TikTok (el 20 % inferior).
- Si la cara del creador está baja en el cuadro, sube la línea de subtítulos: `subtitulos: { altura: 0.72 }`.
- Evita la franja derecha, donde van los botones de la app: los subtítulos ya dejan un 6 % de margen a cada lado.

## Crear un estilo propio

Un estilo es una clase CSS en `motor/reel.css` más una fila en la tabla `ESTILOS_SUB` de `motor/motor.js`:

```js
// motor.js → ESTILOS_SUB
neon: { max: 3, fuente: 'titulo', base: 90, mayus: true },
```
```css
/* reel.css: .w es cada palabra; .on = se está diciendo; .dicho = ya se dijo; .enf = énfasis */
.sub-neon .grupo { color: #fff; font-weight: 900; text-shadow: 0 0 .3em var(--acento), 0 0 .8em var(--acento); }
.sub-neon .w.on { color: var(--suave); }
```
Variables disponibles: `--fondo`, `--texto`, `--acento`, `--suave`, `--acento-claro` (el acento aclarado para leerse sobre video), `--sobre-acento` (blanco o negro, lo que contraste con el acento), `--fondo-caja` y `--texto-caja`.

Nada de `transition` ni `animation` de CSS: HyperFrames dibuja cuadro por cuadro y las transiciones de CSS no se sincronizan. Los cambios entre `.on`/`.dicho` son instantáneos, y el movimiento va en GSAP dentro de `subtitulos()` en `motor.js`.
Para que un estilo nuevo quede para todos tus reels, edítalo en `<skill>/plantilla/motor/`; los proyectos nuevos lo copian de ahí.
