# Modo editorial: tipografía cinética con objetos 3D

Estilo «revista en movimiento»: papel claro cuadriculado, cada frase compuesta con tipografías mezcladas (serif cursiva elegante contra letra gruesa o condensada), cifras con brillo, gráficas que se dibujan y **objetos 3D brillantes hechos con código** (Three.js). No lleva subtítulos: **la frase es la escena**. Ejemplo completo en `ejemplos/editorial-reel.js`.

**Cuándo usarlo**: datos curiosos, «¿sabías que…?», consejos de productividad, educación, marca personal con tono premium y cualquier reel sin rostro que deba verse «de agencia». Para listas rápidas o con chats y notificaciones, mejor el modo normal.

## Estructura

```js
window.REEL = {
  modo: 'editorial',
  formato: '9:16',
  duracion: 18,                         // o la de la voz
  marca: { ... },                       // el acento se usa en la tarjeta, los botones y el texto marcado
  editorial: { papel: 'cuadriculado' }, // cuadriculado · puntos · liso (opcional: color, tinta, gris, linea)
  voz: { src: 'assets/voz.wav' },       // opcional
  palabras: 'palabras.json',            // no se dibuja: solo sirve para leer los tiempos de cada frase
  musica: null,
  escenas: [ /* ... */ ],
};
```

## Escenas

Cada escena ocupa la pantalla desde `en` hasta `hasta` (o hasta la escena siguiente). Al cambiar de escena, los bloques se desvanecen con desenfoque y suena un whoosh (nunca dos a menos de 2.5 s: en escenas cortas, el que sobra se vuelve un pop). Efectos por bloque y objeto: `audio.md`.

| campo | qué es |
|---|---|
| `en`, `hasta` | segundos de inicio y fin |
| `bloques` | lo que se compone en la columna central, de arriba a abajo (ver abajo) |
| `vertical` | `'centro'` (por defecto), `'arriba'` o `'abajo'`: dónde se agrupa la columna |
| `tarjeta` | `true` → los bloques van dentro de un bloque redondeado del color de acento, que se abre al entrar (ideal para el gancho) |
| `curvas` | curvas grises que se dibujan de fondo: `'a'`, `'b'`, `'c'`, `'d'` (combinables: `['b', 'c']`) |
| `objetos` | objetos 3D decorativos fuera de la columna (esquinas, bordes) |
| `desplazar` | `[{ en: 4.75, y: -150 }]` → toda la columna sube (o baja) en ese momento. Úsalo cuando un bloque de arriba se va (`sale`) y lo de abajo debe ocupar su lugar |

## Bloques

Todos aceptan `en` (cuándo aparecen; por defecto se escalonan 0.15 s desde el inicio de la escena), `sale` (retirarlo antes del final de la escena), `alinear` (`'izquierda'` · `'centro'` · `'derecha'`) y `sangria` (px desde la izquierda).

### Texto
```js
{ texto: 'Tu cerebro toma', tam: 86 }                       // cursiva serif (por defecto)
{ texto: 'estudios', estilo: 'fuerte', color: 'acento' }     // gruesa (fuente de títulos de la marca)
{ texto: 'Problemas', estilo: 'condensada', entrada: 'barrido' }   // condensada gigante en mayúsculas
{ texto: '**Tu cerebro** toma' }                              // mezcla: **fuerte** dentro de la cursiva
{ texto: 'decisiones *cada* día' }                            // *palabra* → color de acento
```
- `estilo`: `cursiva` (96 px), `fuerte` (118 px) o `condensada` (250 px). `tam` cambia el tamaño. `fuerte` y `condensada` van en una sola línea y se achican solas si no caben (una palabra larga como «PRODUCTIVIDAD»); la cursiva pasa a otra línea.
- `color`: `tinta` (por defecto), `gris`, `acento`, `suave`, `naranja`, `azul`, `blanco` o un `#hex`. Dentro de una `tarjeta`, el texto va en blanco o negro (lo que contraste con el acento) y el `*acento*` se ve en el color `suave`.
- `entrada`: `subir` (por defecto: sube y se enfoca), `barrido` (entra de lado con desenfoque de movimiento), `golpe` (llega grande y se asienta) o `palabras` (una palabra tras otra).

**Regla de composición**: las palabras de unión van en cursiva y la palabra clave en fuerte o condensada. Una o dos palabras clave por escena; si todo es grande, nada destaca.

### Objeto 3D en la columna
```js
{ objeto: { tipo: 'cerebro', tam: 430, aro: true }, en: 3.65 }
{ objeto: { tipo: 'diana', tam: 520, flecha: 16.2 }, en: 15.25 }   // la flecha se clava en ese segundo
```
Reserva un hueco en la columna y el objeto se dibuja centrado ahí. `aro: true` agrega un círculo punteado que gira. `alto` fuerza el alto del hueco.

### Cifra con brillo
```js
{ cifra: '35.000', desde: '31.800', en: 4.95 }        // cuenta de 31.800 a 35.000
{ cifra: '90%', color: 'acento', tam: 200 }
{ cifra: '7–9', tam: 200 }                            // un rango no se cuenta: aparece tal cual
```
`contar: false` la muestra fija aunque sea un número. El brillo es ancho: deja aire con el bloque de arriba.

### Gráfica
```js
{ grafica: { barras: [150, 270, 195, 360] }, en: 10.05 }
{ grafica: { barras: [{ valor: 12 }, { valor: 30 }], linea: false, alto: 360, colores: [['#35D0C0', '#1C9E92'], ['#F7B23B', '#F0612A']] } }
```
Las barras crecen de a una y una línea de tendencia con flecha se dibuja encima.

### Etiquetas punteadas
```js
{ etiquetas: ['Más rápidas', 'Más precisas', 'Más efectivas'], tiempos: [10.9, 11.7, 12.5] }
```
Se apilan al centro, cada una con un tic. Pon cada tiempo en la palabra que la nombra.

### Cierre: marca y botón
```js
{ marca: true, en: 19.2 }                        // logo de la marca en círculo + @usuario
{ boton: 'Sígueme para *más*', en: 20.5 }       // píldora de color de acento, con campanita
```
El cierre del modo editorial se arma con bloques (el `cta` del modo dinámico no aplica aquí). Una receta que funciona para «seguir»:
```js
{ en: 18.6, hasta: 22.8, vertical: 'centro',
  bloques: [
    { marca: true },
    { texto: 'Sígueme para más', tam: 84, alinear: 'centro' },
    { texto: 'hábitos', estilo: 'fuerte', color: 'acento', alinear: 'centro' },
    { boton: 'Seguir', en: 20.9 },
  ] }
```
Para «comenta» o «guarda», cambia el texto del botón («Comenta *GUÍA*», «Guárdalo»).

## Objetos 3D

Todos están hechos con código (Three.js): no se descarga nada, no cuestan créditos y toman los colores de la marca.

| tipo | qué es | color por defecto |
|---|---|---|
| `esfera` | bola brillante | `lima` |
| `estrella` | destello de 4 puntas con bordes curvos | `acento` |
| `pieza` | pieza de rompecabezas | `acento` |
| `cerebro` | cerebro con pliegues, cerebelo y tronco (gira en vista de tres cuartos) | rosado grisáceo |
| `diana` | diana de anillos; con `flecha: s`, una flecha se clava en ese segundo | `rojo` |
| `moneda` | moneda metálica que gira | `oro` |
| `cubo`, `anillo`, `pildora` | formas brillantes simples | `suave`, `naranja`, `rosa` |

Opciones de cada objeto: `tam` (px), `color` (`acento`, `suave`, `lima`, `naranja`, `rojo`, `oro`, `oscuro`, `azul`, `rosa`, `turquesa` o `#hex`), `en`, `sale` y `entrada` (`'aparecer'` por defecto, o `'caer'`, que cae con rebote).

Los objetos decorativos (en `objetos` de la escena) se ubican con `lugar` (las esquinas dejan margen para que un objeto de hasta ~300 px gire sin tocar el borde; si es más grande, usa `x`/`y`): `'arriba-izquierda'`, `'arriba-derecha'`, `'abajo-izquierda'`, `'abajo-derecha'`, `'arriba'`, `'abajo'`, `'centro'` o `'tarjeta'` (la esquina de la tarjeta de color). También con `x` y `y` en px de la pantalla (1080 × 1920).

**Qué objeto usar**: cerebro → mente, decisiones, aprendizaje; diana → metas, precisión, habilidades; pieza → método, solución, encajar; estrella → idea brillante, novedad; moneda → dinero, ventas; esfera, cubo, anillo y píldora → decoración de color. Dos o tres objetos por escena como máximo, y lejos del texto.

Para sumar un objeto nuevo: una función en `FABRICA` dentro de `motor/objetos3d.js` que devuelva una malla de radio ~1, y su giro en `GIRO`.

## Con voz

1. Escribe el guion en frases cortas: cada frase será una escena.
2. Genera la voz y transcribe (paso 4 del SKILL.md).
3. Cada escena empieza en el `start` de la primera palabra de su frase, y cada bloque en el `start` de la palabra que muestra. El texto en pantalla puede resumir la frase dicha, pero no contradecirla.

## Revisión

`armar.mjs` → `npx hyperframes@0.8.86 check` → `snapshot` en la mitad de cada escena. Revisa que:
- los objetos no tapen el texto;
- nada toque los bordes (la columna deja 9 % a los lados y 12 % arriba y abajo);
- las escenas con `desplazar` no dejen un hueco.
