# SPIDER-MAN: Brand New Day — Landing

Landing de estreno construida con **Astro + React**, HTML, CSS y JavaScript.
Proyecto realizado para la oferta *Programador/a web de la landing de
SPIDER-MAN: Brand New Day con InfoJobs* (referencia IJ-JOB).

> Proyecto de portfolio. No afiliado a Sony Pictures ni a Marvel: las marcas,
> personajes y material promocional pertenecen a sus titulares.

---

## Cómo probarla en 2 minutos

Sólo hace falta tener [Node.js 18 o superior](https://nodejs.org) instalado.

```bash
npm install     # instala las dependencias (una sola vez)
npm run dev     # arranca el servidor de desarrollo
```

Abrí **http://localhost:4321** en el navegador. Listo.

### Ver la versión de producción

```bash
npm run build   # genera el sitio estático en dist/
npm run preview # lo sirve tal cual se subiría a producción
```

### Pasar la batería de comprobaciones

```bash
npm run build
npm test
```

Abre un navegador real, recorre la página como una persona y comprueba **38
cosas**: que el contador cuente, que el filtro de sesiones filtre, que el
`.ics` se descargue bien formado, que no haya scroll horizontal en móvil, que
la consola esté limpia… Al terminar deja capturas de pantalla en
`tests/capturas/`. Detalle completo más abajo.

---

## Qué hay en la página

| Sección | Qué hace |
|---|---|
| **Hero** | Cielo en degradado de la noche al amanecer, skyline dibujado en SVG y cuenta atrás en vivo hasta el 29 de julio. |
| **Sinopsis** | Texto de presentación y tres cifras clave. |
| **Tráiler** | Reproductor que no toca YouTube hasta que alguien pulsa play. |
| **Reparto** | Ocho fichas del reparto anunciado y ficha técnica de la película. |
| **Sesiones** | Buscador de sesiones por ciudad y formato (IMAX, 4DX, V.O.S.E., Digital). |
| **Estreno** | La fecha a pantalla completa, el botón de calendario y los botones para compartir. |
| **FAQ** | Acordeón de preguntas frecuentes. |
| **404** | Página de error a juego con el resto del sitio, no la de por defecto del hosting. |

---

## Decisiones técnicas

La oferta pedía tres cosas concretas. Cada una tiene una respuesta en el
código:

### 1. «Asegurar que el sitio aguante picos de tráfico masivos»

Esta es la pregunta que más peso tiene en el brief, y no se resuelve con una
sola decisión sino con cuatro:

**a) El sitio compila a HTML estático.** No hay servidor de aplicación que se
caiga, ni base de datos que saturar, ni funciones serverless que arranquen en
frío bajo carga. `npm run build` genera puros archivos; un pico de tráfico se
lo come una CDN, que es exactamente para lo que existen.

**b) Los assets llevan cabecera de caché agresiva** (`public/_headers`, que
leen solos Netlify y Cloudflare Pages). Los archivos con hash en el nombre (`_astro/client.a1b2c3.js`,
`/fonts/*.woff2`) se marcan `immutable, max-age=31536000`: la CDN los sirve
desde el borde durante un año sin volver a preguntarle nada al origen. Esa es
la diferencia real entre "es estático" y "aguanta un pico": sin estas
cabeceras, cada visita puede seguir golpeando el servidor de origen aunque el
archivo no haya cambiado.

**c) Las fuentes están autoalojadas** (`public/fonts/`, subset latin, unos 65
KB en total) en vez de pedírselas a `fonts.googleapis.com`. Un dominio externo
menos es una conexión TLS menos y un punto de fallo menos en el camino
crítico: si Google Fonts tiene una mala noche justo el día del estreno, acá no
se entera nadie.

**d) El JavaScript que llega al navegador es el mínimo**, gracias a la
**arquitectura de islas** de Astro: la página se envía como HTML y sólo los
trozos interactivos cargan React, cada uno por separado y cuando toca.

| Isla | Cuándo carga | Por qué |
|---|---|---|
| `CuentaAtras` | `client:load` | Es el elemento firma del hero: tiene que estar contando desde el primer instante. |
| `BotonCalendario` | `client:visible` | Sólo importa cuando alguien puede pulsarlo. |
| `Trailer` | `client:visible` | Está tres pantallas más abajo. |
| `Entradas` | `client:visible` | Ídem. |

El resto de la página — navegación, sinopsis, reparto, FAQ, pie — es HTML y CSS
puros, con cero JavaScript.

### 2. «Implementar interfaces que hagan la navegación fluida»

- **Nada escucha el evento `scroll`.** El aparecer de las secciones, la barra
  de navegación que se vuelve sólida y el indicador de sección activa usan
  `IntersectionObserver`: el navegador avisa cuando algo cruza el umbral, en
  vez de ejecutar código nuestro en cada píxel scrolleado.
- **El amanecer del fondo lo anima el compositor.** La capa de atmósfera se
  aclara al bajar mediante `animation-timeline: scroll()`, CSS puro. Donde el
  navegador no lo soporta queda el degradado fijo, que ya se ve bien: mejora
  progresiva, no dependencia.
- **Cero saltos de layout.** El hueco del tráiler se reserva con
  `aspect-ratio` antes de cargar nada, y la cuenta atrás usa cifras de ancho
  fijo (`tabular-nums`) para que pasar de `09` a `10` no mueva un píxel.

### 3. «Desarrollar y optimizar funcionalidades clave»

- **Cuenta atrás.** La fecha lleva zona horaria explícita (`+02:00`), porque si
  no cada visitante vería un número distinto según su país. Y recalcula contra
  el reloj real en cada tick en vez de restar un segundo: si la pestaña pasa a
  segundo plano el navegador estrangula los temporizadores, y restando se
  acumularía el retraso como error permanente.
- **Tráiler con patrón *facade*.** Un iframe de YouTube arrastra cientos de KB
  y abre conexiones a tres dominios en cuanto aparece en el DOM, lo mire
  alguien o no. Aquí la página no le pide nada a YouTube hasta el click.
- **Añadir al calendario sin backend.** El archivo `.ics` se genera en el
  propio navegador con un `Blob`, siguiendo el RFC 5545 (saltos CRLF, escape de
  comas y punto y coma, recordatorio 24 h antes). También hay enlace directo a
  Google Calendar y a Outlook.
- **Buscador de sesiones.** Filtra en memoria sobre datos que ya viajaron con
  el HTML: cambiar de ciudad no dispara ni una petición más.
- **Compartir.** Botones de WhatsApp, X, Facebook y copiar enlace en la
  sección de estreno — enlaces "intent" públicos, sin backend ni API key. Una
  landing que se dirige a toda la comunidad de Marvel vive de que la
  reenvíen.

### Accesibilidad

No es un extra al final, está en el código desde el principio:

- Enlace «saltar al contenido», un solo `<h1>`, jerarquía de encabezados
  correcta y `lang="es"`.
- La cuenta atrás está oculta al lector de pantalla (`aria-hidden`) porque
  anunciar «42 segundos… 41 segundos…» sin parar vuelve la página inusable; la
  misma información se da una vez en texto accesible.
- Menú de calendario navegable con teclado, se cierra con `Escape`, anuncia su
  estado con `aria-expanded`.
- Todo respeta `prefers-reduced-motion`: quien pidió menos movimiento recibe
  menos movimiento.
- El acordeón de FAQ usa `<details>` nativo: accesible por teclado y buscable
  con Ctrl+F incluso plegado, con cero JavaScript.

### SEO

`<title>` y meta description propios, URL canónica, Open Graph y Twitter Card
con imagen de 1200×630, datos estructurados `schema.org/Movie` para que Google
entienda que esto es una película y no un blog, `sitemap-index.xml` generado
automáticamente por `@astrojs/sitemap`, y un `favicon.svg` + `favicon.ico` +
`apple-touch-icon.png` para que el icono se vea nítido en cualquier pestaña,
marcador o pantalla de inicio de iOS.

---

## Seguridad

No hay backend, ni login, ni base de datos, ni cookies de sesión: por lo
tanto no hay ningún token, JWT ni credencial que proteger — no existen
porque no hace falta nada de eso para lo que pide la oferta. Dicho esto, el
proyecto sí tiene un par de capas de seguridad reales:

- **Content-Security-Policy con hashes automáticos.** Astro calcula el hash
  SHA-256 de cada script y estilo que genera y arma la política él mismo
  (`security.csp` en `astro.config.mjs`). No hace falta `'unsafe-inline'`
  — que anularía buena parte de la protección — ni un servidor que emita un
  nonce por request, imposible en un sitio 100% estático. El único dominio
  externo permitido es `youtube-nocookie.com`, y sólo como `frame-src` para
  el tráiler.
- **Cabeceras de seguridad estándar** en `public/_headers`:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (nadie puede
  meter el sitio en un `<iframe>` ajeno) y `Referrer-Policy:
  strict-origin-when-cross-origin`.
- **El JSON-LD escapa `<`** antes de inyectarse con `set:html`, para que un
  valor que algún día contenga `</script>` no pueda cerrar la etiqueta antes
  de tiempo e inyectar HTML arbitrario.
- **Sin `dangerouslySetInnerHTML` ni `innerHTML`** en ningún componente de
  React: todo el texto que viene de `pelicula.js` se renderiza como texto,
  nunca como HTML.
- **`npm audit` da 0 vulnerabilidades.** No siempre fue así: al revisar el
  proyecto aparecieron 3 avisos (uno de ellos alto) en Astro/esbuild/sharp;
  se corrigieron subiendo Astro de la rama 5.x a la 7.1.3 (junto con
  `@astrojs/react` a 6.0.1) y corriendo `npm audit fix`. Tras la subida se
  volvió a correr toda la batería de `npm test` — 38/38 — para confirmar que
  el salto de versión mayor no rompió nada. Conviene volver a correr
  `npm audit` antes de cada despliegue importante: las dependencias no se
  quedan seguras solas.

Se auditó el código en busca de API keys, tokens o contraseñas hardcodeadas:
no hay ninguna, porque no hay ningún servicio que las necesite.

---

## Manejo de errores

Una landing que va a ver "toda la comunidad de Marvel" no puede quedar en
blanco por un dato mal formado o un navegador raro. Cada escenario tiene una
respuesta concreta, no un intento genérico de "atrapar todo":

| Situación | Qué pasa |
|---|---|
| Se visita una URL que no existe | `404.astro`: página propia a juego con el resto del sitio, no la de error por defecto del hosting. |
| `estrenoISO` queda mal formado en `pelicula.js` | `CuentaAtras` detecta la fecha inválida (`Number.isNaN`) y muestra un mensaje en vez de contar `NaN:NaN:NaN:NaN` para siempre. |
| Una isla de React explota en pleno render | Cada isla (`CuentaAtras`, `Trailer`, `BotonCalendario`, `Entradas`) está envuelta en su propio `ErrorBoundary`: si una falla, muestra un mensaje de repuesto y las otras tres siguen funcionando — no se cae la página entera por una. |
| Falla la descarga del `.ics` (Blob/`URL.createObjectURL` no disponible) | `try/catch` alrededor de la descarga: si falla, el menú avisa y deja a mano los enlaces a Google Calendar y Outlook como plan B. |
| El navegador no expone la Clipboard API (contexto sin TLS, navegador viejo) | El botón de copiar enlace cae a un `<textarea>` oculto + `execCommand('copy')`. |
| Sin sesiones para la ciudad o el formato elegido | Estado vacío explícito con `role="status"`, no una lista que desaparece sin explicación. |
| Sin ciudades cargadas (por si `cines`/`ciudades` llegan vacíos de una futura API) | Mensaje "todavía no hay sesiones publicadas" en vez de pestañas vacías. |
| Falla la carga de una fuente | `font-display: swap` + pila de reserva `system-ui`: el texto se ve enseguida con la fuente del sistema y cambia cuando llega la definitiva, nunca invisible. |
| El visitante pidió menos movimiento (`prefers-reduced-motion`) | Todas las animaciones se desactivan; el contenido aparece ya revelado en vez de depender de una animación que no va a correr. |
| JavaScript deshabilitado | El HTML de cada isla ya sale renderizado desde el build (Astro las hidrata, no las crea): la cuenta atrás se ve con guiones (`--`) en vez de un hueco en blanco, y el resto del sitio —que no depende de React— funciona igual. |

---

## Estructura del proyecto

```
landing-spider-man/
├── astro.config.mjs          Configuración de Astro (React, sitemap, salida estática)
├── package.json
├── public/                    Se copia tal cual a la raíz del sitio
│   ├── _headers               Cabeceras de caché — Netlify / Cloudflare Pages
│   ├── fonts/                  Archivo, Manrope y Space Mono autoalojados (.woff2)
│   ├── favicon.svg / favicon.ico / apple-touch-icon.png
│   ├── og.png                 Imagen de las tarjetas al compartir el enlace
│   └── robots.txt
├── src/
│   ├── data/
│   │   └── pelicula.js        ← FUENTE ÚNICA DE VERDAD (fecha, reparto, cines, FAQ)
│   ├── styles/
│   │   ├── fuentes.css         @font-face de las fuentes autoalojadas
│   │   └── global.css         Tokens, reset, tipografía y estilos de las islas React
│   ├── layouts/
│   │   └── Base.astro         <head>, metadatos y el observador del revelado al scroll
│   ├── components/
│   │   ├── Atmosfera.astro    Capa de amanecer animada por scroll
│   │   ├── Navegacion.astro   Barra fija + indicador de sección activa
│   │   ├── Hero.astro
│   │   ├── Skyline.astro      Skyline en SVG, sin imágenes externas
│   │   ├── Sinopsis.astro
│   │   ├── SeccionTrailer.astro
│   │   ├── Reparto.astro
│   │   ├── Sesiones.astro
│   │   ├── Estreno.astro
│   │   ├── Compartir.astro    Botones de WhatsApp, X, Facebook y copiar enlace
│   │   ├── Faq.astro
│   │   ├── Pie.astro
│   │   └── react/             ← Las cuatro islas interactivas
│   │       ├── CuentaAtras.jsx
│   │       ├── Trailer.jsx
│   │       ├── BotonCalendario.jsx
│   │       ├── Entradas.jsx
│   │       └── ErrorBoundary.jsx  Red de seguridad: si una isla falla, no se cae la página
│   └── pages/
│       ├── index.astro        La página, montada a partir de los componentes
│       └── 404.astro          Página de error a juego con el resto del sitio
├── tests/
│   └── verificar.mjs          Batería de comprobaciones en navegador real
├── legacy/
│   └── index-original.html   Primer prototipo en un solo archivo, antes de Astro
└── GUIA-PASO-A-PASO.txt      Tutorial de cómo se construyó esto, archivo por archivo
```

### Dónde se cambian las cosas

Casi todo el contenido vive en **`src/data/pelicula.js`**. Si cambia la fecha
de estreno, llega el ID del tráiler o hay que añadir una ciudad, se toca ese
archivo y nada más:

```js
estrenoISO: '2026-07-29T00:00:00+02:00',   // mueve la cuenta atrás
trailerId: '',                             // pon el ID de YouTube y el reproductor se activa solo
```

Mientras `trailerId` esté vacío, la sección del tráiler muestra un estado
«próximamente» en lugar de romper con un vídeo inexistente.

Los colores y tipografías están en un solo bloque de variables al principio de
**`src/styles/global.css`**.

---

## Qué comprueba `npm test`

Levanta un servidor con el sitio ya compilado, abre el Edge o Chrome que ya
tengas instalado (no descarga ningún navegador) y verifica:

**Estructura y SEO** — idioma declarado, título y descripción de longitud
razonable, Open Graph, datos estructurados, un único `<h1>`, enlace de salto al
contenido.

**Cuenta atrás** — que se hidrate con cifras reales, que avance con el tiempo,
que esté oculta al lector de pantalla y que la fecha se anuncie en texto
accesible.

**Revelado al scroll** — que al cargar no esté todo revelado y que tras
recorrer la página lo esté (41 de 41 elementos).

**Navegación** — barra transparente sobre el hero, sólida al bajar, indicador
de sección activa funcionando.

**Sesiones** — que cargue la primera ciudad, que cambiar de ciudad cambie la
lista, que el filtro de formato sea coherente y que el estado vacío se
comunique.

**Calendario** — que el menú se abra, que anuncie `aria-expanded`, que ofrezca
tres destinos, que descargue un `.ics` con la fecha correcta, saltos CRLF y el
título bien escapado, y que `Escape` lo cierre.

**Tráiler** — que no exista ningún iframe de YouTube antes del click y que la
caja reserve su espacio.

**FAQ** — que el acordeón empiece cerrado y abra al pulsar.

**Responsive** — sin scroll horizontal a 390 px, 820 px y 1440 px, con captura
de página completa en cada tamaño.

**Consola** — cero errores de JavaScript.

---

## Desplegar

Al ser un sitio estático vale cualquier hosting. Con Netlify o Cloudflare
Pages basta con:

- Comando de build: `npm run build`
- Carpeta de publicación: `dist`

Los dos leen `public/_headers` solos, sin configuración extra en el panel —
las cabeceras de caché de un año para los assets con hash ya vienen en el
repo.

Antes de subirlo a producción, dos archivos llevan el dominio de ejemplo
`spiderman-brand-new-day.example` y hay que cambiarlo por el real:

1. `site` en `astro.config.mjs` — alimenta la URL canónica, el `sitemap-index.xml`
   y las rutas absolutas de las tarjetas de Open Graph.
2. La línea `Sitemap:` en `public/robots.txt`.

Si el hosting elegido no es Netlify ni Cloudflare Pages (GitHub Pages,
S3 + CloudFront...), configurá la caché de `/​_astro/*` y `/fonts/*` a mano ahí:
es la pieza que más hace que el sitio aguante un pico de tráfico sin
depender de que el origen responda rápido.

---

## Stack

- **[Astro 7](https://astro.build)** — sitio estático con arquitectura de islas
- **[React 19](https://react.dev)** — sólo en las cuatro partes interactivas
- **CSS moderno** — variables, `grid`, `clamp()`, `aspect-ratio`,
  `animation-timeline`. Sin frameworks de estilos.
- **JavaScript** — sin TypeScript, sin dependencias de runtime más allá de React
- **[playwright-core](https://playwright.dev)** — sólo en desarrollo, para los tests
