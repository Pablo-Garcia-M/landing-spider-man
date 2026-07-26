# SPIDER-MAN: Brand New Day — Landing

Landing de estreno construida con **Astro + React**, HTML, CSS y JavaScript.
Proyecto realizado para la oferta *Programador/a web de la landing de
SPIDER-MAN: Brand New Day con InfoJobs* (referencia IJ-JOB).

> Proyecto de portfolio. No afiliado a Sony Pictures ni a Marvel: las marcas,
> personajes y material promocional pertenecen a sus titulares.

---

## Ver la demo

El sitio está desplegado en GitHub Pages, pero mientras el proyecto espera
aprobación queda fuera de buscadores (`noindex`, sin sitemap) y detrás de un
candado simbólico en el propio front-end — no es seguridad real, es un filtro
para que sólo entre quien tenga el link y la clave. Si querés ver la demo en
vivo, pedime el enlace y la clave de acceso.

---

## Cómo probarla en 2 minutos

Sólo hace falta tener [Node.js 22.12 o superior](https://nodejs.org) instalado
(lo exige Astro 7).

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

Abre un navegador real, recorre la página como una persona y comprueba **41
cosas**: que el contador cuente, que el candado de acceso funcione, que el
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
| **Estreno** | La fecha a pantalla completa, el botón de calendario y los botones para compartir. |
| **Preguntas** | Acordeón de preguntas frecuentes. |
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

**b) El sitio se sirve desde GitHub Pages, detrás de la CDN de Fastly.**
Los assets con hash en el nombre (`_astro/client.a1b2c3.js`,
`_astro/archivo-variable.a1b2c3.woff2`) son inmutables por construcción: si
el contenido cambia, cambia el nombre del archivo, así que un pico de
tráfico repitiendo la misma URL una y otra vez es exactamente el caso ideal
para cualquier CDN — nunca hay que revalidar nada. GitHub Pages no permite
configurar cabeceras `Cache-Control` a medida (a diferencia de Netlify o
Cloudflare Pages), pero tampoco hace falta: al ser 100% estático detrás de
una CDN global, no hay ningún cómputo por request que un pico de tráfico
pueda saturar.

**c) Las fuentes están autoalojadas** (`src/fonts/`, subset latin, unos 65
KB en total) en vez de pedírselas a `fonts.googleapis.com`. Un dominio externo
menos es una conexión TLS menos y un punto de fallo menos en el camino
crítico: si Google Fonts tiene una mala noche justo el día del estreno, acá no
se entera nadie. Al vivir en `src/` (no en `public/`), Vite las procesa como
cualquier otro asset del build: les asigna un nombre con hash y las sirve
desde `_astro/`, junto con el JS y el CSS.

**d) El JavaScript que llega al navegador es el mínimo**, gracias a la
**arquitectura de islas** de Astro: la página se envía como HTML y sólo los
trozos interactivos cargan React, cada uno por separado y cuando toca.

| Isla | Cuándo carga | Por qué |
|---|---|---|
| `CuentaAtras` | `client:load` | Es el elemento firma del hero: tiene que estar contando desde el primer instante. |
| `BotonCalendario` | `client:visible` | Sólo importa cuando alguien puede pulsarlo. |
| `Trailer` | `client:visible` | Está tres pantallas más abajo. |

El resto de la página — navegación, sinopsis, reparto, preguntas, pie — es HTML
y CSS puros, con cero JavaScript.

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
- El acordeón de preguntas usa `<details>` nativo: accesible por teclado y
  buscable con Ctrl+F incluso plegado, con cero JavaScript.

### No indexable, a propósito

Este es un proyecto de portfolio, no una página oficial — y justamente por
eso NO busca aparecer en buscadores. Pensarlo al revés de "SEO" da esto:

- `<meta name="robots" content="noindex, nofollow">` en cada página: le pide
  a Google/Bing que no la listen ni seleccionen sus enlaces para descubrir
  más contenido.
- `robots.txt` con `Disallow: /` para reforzarlo.
- Sin sitemap: generar uno sólo tendría sentido si quisiéramos ayudar a los
  buscadores a encontrar páginas, justo lo contrario de la idea.

Importante: esto la saca de los resultados de búsqueda, **no la hace
privada**. GitHub Pages no ofrece control de acceso — cualquiera con el
link exacto puede entrar. Es el mismo patrón que un video de YouTube "no
listado": no aparece navegando ni buscando, pero el link en sí funciona
para quien lo tenga.

Lo que sí se mantiene, porque no tiene que ver con buscadores sino con
cómo se ve el link cuando VOS lo mandás: `<title>`/meta description
propios, URL canónica, y Open Graph + Twitter Card con imagen de 1200×630
(la tarjeta que aparece en WhatsApp/Slack al pegar el link). También un
`favicon.svg` + `favicon.ico` + `apple-touch-icon.png` para que el ícono
se vea nítido en cualquier pestaña o pantalla de inicio.

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
- **Límite real de GitHub Pages, dicho sin vueltas:** a diferencia de Netlify
  o Cloudflare Pages, no deja configurar cabeceras HTTP a medida
  (`X-Frame-Options`, `Referrer-Policy`, etc.) — no hay ningún archivo de
  configuración que lo resuelva, es una limitación de la plataforma. La CSP
  igual protege porque viaja como `<meta>` en el propio HTML, no como
  cabecera; lo que sí queda sin cubrir es la protección específica contra
  clickjacking (`frame-ancestors`, que el spec de CSP ignora a propósito
  cuando se entrega por `<meta>`). Si el día de mañana esto importa más que
  la simplicidad de GitHub Pages, migrar a Netlify o Cloudflare Pages es
  cuestión de minutos — el sitio sigue siendo el mismo HTML estático.
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
  volvió a correr toda la batería de `npm test`, sin ningún fallo, para
  confirmar que el salto de versión mayor no rompió nada. Conviene volver a
  correr `npm audit` antes de cada despliegue importante: las dependencias no
  se quedan seguras solas.

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
| Una isla de React explota en pleno render | Cada isla (`CuentaAtras`, `Trailer`, `BotonCalendario`) está envuelta en su propio `ErrorBoundary`: si una falla, muestra un mensaje de repuesto y las otras siguen funcionando — no se cae la página entera por una. |
| Falla la descarga del `.ics` (Blob/`URL.createObjectURL` no disponible) | `try/catch` alrededor de la descarga: si falla, el menú avisa y deja a mano los enlaces a Google Calendar y Outlook como plan B. |
| El navegador no expone la Clipboard API (contexto sin TLS, navegador viejo) | El botón de copiar enlace cae a un `<textarea>` oculto + `execCommand('copy')`. |
| Falla la carga de una fuente | `font-display: swap` + pila de reserva `system-ui`: el texto se ve enseguida con la fuente del sistema y cambia cuando llega la definitiva, nunca invisible. |
| El visitante pidió menos movimiento (`prefers-reduced-motion`) | Todas las animaciones se desactivan; el contenido aparece ya revelado en vez de depender de una animación que no va a correr. |
| JavaScript deshabilitado | El HTML de cada isla ya sale renderizado desde el build (Astro las hidrata, no las crea): la cuenta atrás se ve con guiones (`--`) en vez de un hueco en blanco, y el resto del sitio —que no depende de React— funciona igual. |

---

## Estructura del proyecto

```
landing-spider-man/
├── .github/
│   └── workflows/
│       └── deploy.yml         Compila y publica en GitHub Pages en cada push a main
├── astro.config.mjs          Configuración de Astro (React, `base` de GitHub Pages, CSP)
├── package.json
├── public/                    Se copia tal cual a la raíz del sitio
│   ├── favicon.svg / favicon.ico / apple-touch-icon.png
│   ├── og.png                 Imagen de las tarjetas al compartir el enlace
│   └── robots.txt
├── src/
│   ├── data/
│   │   └── pelicula.js        ← FUENTE ÚNICA DE VERDAD (fecha, reparto, preguntas)
│   ├── fonts/                 Archivo, Manrope y Space Mono autoalojados (.woff2)
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
│   │   ├── Estreno.astro
│   │   ├── Compartir.astro    Botones de WhatsApp, X, Facebook y copiar enlace
│   │   ├── Preguntas.astro
│   │   ├── Pie.astro
│   │   └── react/             ← Las tres islas interactivas
│   │       ├── CuentaAtras.jsx
│   │       ├── Trailer.jsx
│   │       ├── BotonCalendario.jsx
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
de estreno o el ID del tráiler, se toca ese archivo y nada más:

```js
estrenoISO: '2026-07-29T00:00:00+02:00',   // mueve la cuenta atrás
trailerId: '3B1_P2h7v2k',                  // ID de YouTube del tráiler oficial
```

Si `trailerId` queda vacío (`''`), la sección del tráiler muestra un estado
«próximamente» en lugar de romper con un vídeo inexistente.

Los colores y tipografías están en un solo bloque de variables al principio de
**`src/styles/global.css`**.

---

## Qué comprueba `npm test`

Levanta un servidor con el sitio ya compilado, abre el Edge o Chrome que ya
tengas instalado (no descarga ningún navegador) y verifica:

**Candado de acceso** — que se muestre bloqueado por defecto, que una clave
incorrecta muestre el error sin desbloquear, y que la clave correcta revele
el contenido y oculte el candado.

**Estructura y SEO** — idioma declarado, título y descripción de longitud
razonable, Open Graph, la etiqueta `noindex` que evita que se indexe, un
único `<h1>`, enlace de salto al contenido.

**Cuenta atrás** — que se hidrate con cifras reales, que avance con el tiempo,
que esté oculta al lector de pantalla y que la fecha se anuncie en texto
accesible.

**Revelado al scroll** — que al cargar no esté todo revelado y que tras
recorrer la página se revele el 100% de los elementos.

**Navegación** — barra transparente sobre el hero, sólida al bajar, indicador
de sección activa funcionando.

**Calendario** — que el menú se abra, que anuncie `aria-expanded`, que ofrezca
tres destinos, que descargue un `.ics` con la fecha correcta, saltos CRLF y el
título bien escapado, y que `Escape` lo cierre.

**Tráiler** — que no exista ningún iframe de YouTube antes del click y que la
caja reserve su espacio.

**Preguntas** — que el acordeón empiece cerrado y abra al pulsar.

**Responsive** — sin scroll horizontal a 390 px, 820 px y 1440 px, con captura
de página completa en cada tamaño.

**Consola** — cero errores de JavaScript.

---

## Desplegar (GitHub Pages)

El sitio se publica en **GitHub Pages**, gratis, sin cuenta de hosting
aparte. A diferencia de Netlify o Vercel, GitHub Pages no compila nada por
su cuenta — sólo sabe servir archivos estáticos — así que el build lo hace
un workflow de GitHub Actions (`.github/workflows/deploy.yml`, ya incluido
en el repo) cada vez que se sube algo a `main`.

### Configuración inicial (una sola vez)

1. **Activar Pages en el repo.** En GitHub: `Settings` → `Pages` → en
   "Build and deployment", elegir **Source: GitHub Actions** (no "Deploy
   from a branch"). Con eso alcanza; el workflow ya está escrito.

2. **Actualizar `astro.config.mjs`** con tu usuario y el nombre real del repo:
     ```js
     site: 'https://tu-usuario.github.io',
     base: '/landing-spider-man/',   // el nombre de TU repo, con barras a los lados
     ```
   Si el repo se llamara distinto a `landing-spider-man`, `base` tiene que
   coincidir exactamente con ese nombre — es la subcarpeta bajo la que
   GitHub Pages sirve un repo que no se llama `tu-usuario.github.io`.

3. **Hacer push a `main`.** El workflow se dispara solo, compila con
   `npm run build` y publica `dist/`. Se puede seguir el progreso en la
   pestaña **Actions** del repo. Al terminar, el sitio queda en
   `https://tu-usuario.github.io/landing-spider-man/`.

### El detalle técnico que hace falta entender: `base`

GitHub Pages sirve un repo normal bajo una subcarpeta con su nombre, no en
la raíz del dominio (salvo que el repo se llame literalmente
`tu-usuario.github.io`, un caso especial de un solo repo por cuenta). Sin
el `base` en `astro.config.mjs`, cualquier ruta absoluta del sitio
(`/favicon.svg`, las fuentes, el propio JavaScript de las islas)
apuntaría a la raíz del dominio y daría 404 en producción aunque funcione
perfecto en local. Por eso:

- Todo lo que vive en `public/` (favicon, `og.png`) se referencia
  en `src/layouts/Base.astro` con un helper (`conBase`) que antepone
  `import.meta.env.BASE_URL` — la variable que Astro llena con el valor de
  `base` en tiempo de build.
- Las fuentes NO viven en `public/fonts/` sino en `src/fonts/`, con rutas
  relativas en `src/styles/fuentes.css` (`../fonts/...`): al estar dentro de
  `src/`, Vite las procesa como parte del build (les da un nombre con hash y
  las sirve desde `_astro/`), y así el `base` se aplica solo, sin tener que
  escribirlo a mano en un archivo CSS.

### Alternativa: dominio propio

Si en algún momento hay un dominio propio, el `base` se puede sacar por
completo (queda `base: '/'` o directamente sin la línea) y GitHub Pages
sirve desde la raíz igual que lo haría cualquier otro hosting estático —
sólo hay que agregar un archivo `public/CNAME` con el dominio y configurar
el DNS apuntando a GitHub.

---

## Stack

- **[Astro 7](https://astro.build)** — sitio estático con arquitectura de islas
- **[React 19](https://react.dev)** — sólo en las tres partes interactivas
- **CSS moderno** — variables, `grid`, `clamp()`, `aspect-ratio`,
  `animation-timeline`. Sin frameworks de estilos.
- **JavaScript** — sin TypeScript, sin dependencias de runtime más allá de React
- **[playwright-core](https://playwright.dev)** — sólo en desarrollo, para los tests
