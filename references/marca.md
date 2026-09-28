# Kit de marca

La marca se guarda una sola vez en `~/.reels-animados/marca.json`, y cada reel nuevo copia sus datos a `reel.js` (el logo y las fuentes también se copian a `assets/`). Si el creador cambia su marca, los reels viejos no se rompen.

## Entrevista (un solo mensaje)

Pregunta lo que falte, con sugerencias:
1. **Nombre** de la marca o del creador, y **@usuario** de la red principal.
2. **Colores** (4, en hex). Si no los sabe, propón una paleta a partir de su logo o su rubro:
   - `fondo`: el color del cierre y de los reels sin grabación. Mejor oscuro: los reels se ven de noche y el contraste con los subtítulos es mayor.
   - `texto`: casi siempre blanco o casi blanco sobre un fondo oscuro.
   - `acento`: el color de la marca: palabra activa, botones, bloques del gancho.
   - `suave`: una versión clara del acento o un segundo color, para los énfasis.
3. **Fuentes**: una para títulos (gruesa) y otra para textos. Las que vienen incluidas en HyperFrames funcionan sin archivos: Inter, Montserrat, Outfit, Nunito, Oswald, League Gothic, Archivo Black, Poppins, Roboto, Open Sans, Lato, Playfair Display, EB Garamond, Space Mono, IBM Plex Mono, JetBrains Mono y Source Code Pro. Para otra fuente se necesita el archivo `.woff2`.
   Combinaciones que funcionan: Archivo Black + Inter (directa), Montserrat + Inter (versátil), League Gothic + Outfit (impacto), Poppins + Poppins (amigable), Playfair Display + Lato (elegante).
4. **Logo**: ruta a un PNG o SVG, idealmente cuadrado. Se muestra en círculo en el cierre y en la marca de agua.
5. **Estilo de subtítulo** favorito (ver `subtitulos.md`).
6. **Cierre** habitual: seguir, comentar una palabra, guardar o link.
7. **Glosario**: nombres que la transcripción suele escribir mal (su marca, su nombre, productos).

## `marca.json`

```json
{
  "nombre": "Ana Fotografía",
  "usuario": "@anafoto",
  "colores": { "fondo": "#141414", "texto": "#FFFFFF", "acento": "#FF5A36", "suave": "#FFC2B3" },
  "fuentes": { "titulo": "Archivo Black", "texto": "Inter" },
  "logo": "C:/Users/ana/marca/logo.png",
  "subtitulos": "pop",
  "cta": { "texto": "Sígueme para *más trucos*", "accion": "seguir" },
  "glosario": { "ana foto": "Ana Foto", "light room": "Lightroom" }
}
```

- Fuente propia: `"titulo": { "familia": "Mi Fuente", "archivo": "C:/fuentes/mifuente.woff2" }`.
- Glosario: la clave es cómo suele salir mal (sin tildes ni puntuación, de 1 a 3 palabras) y el valor es cómo debe escribirse. Además, los valores se le pasan al reconocedor como pista, así que también mejoran lo que escucha.

Guárdala con `node <skill>/scripts/guardar-marca.mjs marca.json`. El script valida los colores y las rutas y agrega la `@` si falta.

## Varias marcas

Si el creador maneja varias marcas (por ejemplo, la suya y la de un cliente), guarda cada una en su propio archivo y pásala al crear el proyecto: `node nuevo.mjs <carpeta> --marca marcas/cliente.json`.
