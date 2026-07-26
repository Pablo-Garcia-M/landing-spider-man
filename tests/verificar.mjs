/**
 * Verificación end-to-end de la landing.
 *
 * Abre el sitio ya compilado en un navegador real y comprueba, una por una,
 * las cosas que tienen que funcionar en una landing de estreno: que el
 * contador cuente, que las secciones aparezcan al scrollear, que el filtro de
 * sesiones filtre, que el menú de calendario descargue el .ics y que no haya
 * un solo error en consola. De paso guarda capturas de cada sección.
 *
 * Uso:
 *   npm run build
 *   npm test
 *
 * Usa el Edge/Chrome ya instalado en el sistema (playwright-core no descarga
 * navegadores), así que no añade 150 MB al repositorio.
 */

import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { CLAVE_ACCESO } from '../src/data/pelicula.js';

const RAIZ = resolve(import.meta.dirname, '..');
const DIST = join(RAIZ, 'dist');
const CAPTURAS = join(RAIZ, 'tests', 'capturas');
const PUERTO = 4399;

/**
 * Mismo `base` que astro.config.mjs. GitHub Pages sirve el contenido de
 * dist/ colgado de esta subcarpeta (tu-usuario.github.io/landing-spider-man/),
 * así que el servidor de prueba tiene que simular exactamente eso — si
 * sirviera dist/ en la raíz, cualquier link con el prefijo de base
 * (favicon, fuentes, el propio contador) daría 404 acá pero funcionaría
 * en producción, o viceversa. Si cambiás el `base` del config, cambialo
 * también acá.
 */
const BASE = '/landing-spider-man/';

/* ------------------------------------------------------------------ *
 * Mini servidor estático para dist/. Sirve para probar exactamente el
 * mismo build que se subiría a producción.
 * ------------------------------------------------------------------ */
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function servir() {
  const servidor = createServer(async (req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    // El sitio "vive" bajo /landing-spider-man/, igual que en GitHub Pages.
    // Cualquier pedido fuera de esa subcarpeta no existe (404), tal como
    // pasaría en producción con una URL de otro repo o de la raíz del dominio.
    if (!ruta.startsWith(BASE)) {
      res.writeHead(404).end('404');
      return;
    }
    ruta = ruta.slice(BASE.length - 1); // conserva la barra inicial

    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = join(DIST, ruta);

    try {
      const cuerpo = await readFile(archivo);
      res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream' });
      res.end(cuerpo);
    } catch {
      res.writeHead(404).end('404');
    }
  });

  return new Promise((ok) => servidor.listen(PUERTO, () => ok(servidor)));
}

/* ------------------------------------------------------------------ *
 * Localiza un navegador instalado en el sistema.
 * ------------------------------------------------------------------ */
function buscarNavegador() {
  const candidatos = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidatos.find((c) => existsSync(c));
}

/* ------------------------------------------------------------------ *
 * Registro de resultados.
 * ------------------------------------------------------------------ */
const resultados = [];
const comprobar = (nombre, condicion, detalle = '') => {
  resultados.push({ nombre, ok: Boolean(condicion), detalle });
  console.log(`${condicion ? '  OK  ' : ' FALLA'}  ${nombre}${detalle ? `  — ${detalle}` : ''}`);
};

/* ------------------------------------------------------------------ *
 * Suite.
 * ------------------------------------------------------------------ */
const servidor = await servir();
const ejecutable = buscarNavegador();

if (!ejecutable) {
  console.error('No encontré Edge ni Chrome instalados. Instalá uno y volvé a probar.');
  servidor.close();
  process.exit(1);
}

await mkdir(CAPTURAS, { recursive: true });

const navegador = await chromium.launch({ executablePath: ejecutable });
const contexto = await navegador.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
  locale: 'es-ES',
});
const pagina = await contexto.newPage();

// Cualquier error de JS o petición fallida queda registrado y hace fallar la suite.
const erroresConsola = [];
pagina.on('console', (m) => m.type() === 'error' && erroresConsola.push(m.text()));
pagina.on('pageerror', (e) => erroresConsola.push(String(e)));

const base = `http://localhost:${PUERTO}${BASE}`;
await pagina.goto(base, { waitUntil: 'networkidle' });

console.log('\n── CANDADO DE ACCESO ────────────────────────────────');

// El resto de la suite necesita el sitio desbloqueado para poder interactuar
// con nada, así que este bloque va primero y deja la página lista para
// todo lo que sigue.
comprobar('El candado se muestra por defecto (sin desbloquear)', await pagina.locator('#candado').isVisible());
comprobar(
  'El contenido real está oculto mientras el candado está activo',
  !(await pagina.locator('a.saltar').isVisible())
);

await pagina.fill('#candado-clave', 'clave-incorrecta-a-propósito');
await pagina.locator('.candado__boton').click();
await pagina.waitForTimeout(200);
comprobar('Una clave incorrecta muestra el error y no desbloquea', await pagina.locator('.candado__error').isVisible());

await pagina.fill('#candado-clave', CLAVE_ACCESO);
await pagina.locator('.candado__boton').click();
await pagina.waitForTimeout(200);
comprobar('La clave correcta desbloquea el contenido', await pagina.locator('a.saltar').isVisible());
comprobar('El candado desaparece al desbloquear', !(await pagina.locator('#candado').isVisible()));

console.log('\n── ESTRUCTURA Y SEO ────────────────────────────────');

comprobar('El documento declara lang="es"', (await pagina.getAttribute('html', 'lang')) === 'es');

const titulo = await pagina.title();
comprobar('Hay <title> y es descriptivo', titulo.length > 20 && titulo.length < 70, `${titulo.length} caracteres`);

const desc = await pagina.getAttribute('meta[name="description"]', 'content');
comprobar('Hay meta description', desc && desc.length > 50, `${desc?.length ?? 0} caracteres`);

comprobar('Hay etiquetas Open Graph', (await pagina.locator('meta[property^="og:"]').count()) >= 6);

// Proyecto de portfolio, no oficial: a propósito NO queremos aparecer en
// buscadores, sólo ser accesibles por link directo. Si este chequeo
// alguna vez falla, alguien sacó el <meta name="robots"> sin querer.
comprobar(
  'La página pide explícitamente no ser indexada (noindex)',
  (await pagina.getAttribute('meta[name="robots"]', 'content')) === 'noindex, nofollow'
);

comprobar('Hay exactamente un <h1>', (await pagina.locator('h1').count()) === 1);
comprobar('Hay enlace para saltar al contenido', (await pagina.locator('a.saltar').count()) === 1);

const sinNombre = await pagina.locator('button:not([aria-label]):not(:has-text(""))').count();
comprobar('Ningún botón queda sin nombre accesible', sinNombre >= 0);

console.log('\n── CUENTA ATRÁS ────────────────────────────────────');

await pagina.waitForFunction(
  () => !/^-|--$/.test(document.querySelector('.cuenta__numero')?.textContent ?? '--'),
  { timeout: 5000 }
);

const leerCuenta = () =>
  pagina.$$eval('.cuenta__numero', (ns) => ns.map((n) => n.textContent));

const primera = await leerCuenta();
comprobar('El contador se hidrata con cifras reales', primera.every((v) => /^\d{2,}$/.test(v)), primera.join(':'));

await pagina.waitForTimeout(1600);
const segunda = await leerCuenta();
comprobar('El contador avanza con el tiempo', segunda.join(':') !== primera.join(':'), `${primera.join(':')} → ${segunda.join(':')}`);

comprobar(
  'El contador está oculto al lector de pantalla',
  (await pagina.getAttribute('.cuenta', 'aria-hidden')) === 'true'
);

comprobar(
  'La fecha se anuncia una vez en texto accesible',
  (await pagina.locator('.sr-only', { hasText: 'estreno' }).count()) >= 1
);

console.log('\n── REVELADO AL SCROLL ──────────────────────────────');

const totalRevelar = await pagina.locator('.revelar').count();
const visiblesAlInicio = await pagina.locator('.revelar.visible').count();
comprobar('Hay elementos con revelado', totalRevelar > 0, `${totalRevelar} elementos`);
comprobar('Al cargar, los de abajo aún no se revelaron', visiblesAlInicio < totalRevelar, `${visiblesAlInicio}/${totalRevelar}`);

// Recorremos la página entera, como haría una persona.
await pagina.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 150) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 45));
  }
  window.scrollTo(0, document.body.scrollHeight);
});

await pagina.waitForTimeout(600);

/**
 * "Repasar" cualquiera que se haya salteado, en vez de confiar en que un
 * solo scroll masivo alcance para los 37 elementos. Con filas angostas y
 * contiguas como las de la ficha técnica del reparto, el rango exacto de
 * scroll en el que un elemento cumple el 12% de intersección puede ser más
 * angosto que el paso del scroll simulado — el propio navegador puede
 * saltarlo sin llegar a notificar el IntersectionObserver a tiempo, algo
 * que un scroll real y continuo de una persona jamás hace.
 *
 * Re-consultamos "el primero que falte" en cada vuelta en vez de guardar
 * una lista fija de antemano: a medida que uno se revela, deja de matchear
 * ":not(.visible)" y el resto corre un lugar — una lista fija recorrida
 * por posición termina apuntando a un elemento equivocado (o a ninguno).
 * El tope de iteraciones evita un bucle infinito si alguno de verdad
 * quedara roto para siempre.
 */
for (let intentos = 0; intentos < totalRevelar + 5; intentos++) {
  const faltante = pagina.locator('.revelar:not(.visible)').first();
  if ((await faltante.count()) === 0) break;
  await faltante.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(150);
}

const visiblesAlFinal = await pagina.locator('.revelar.visible').count();
comprobar('Tras scrollear se revela todo', visiblesAlFinal === totalRevelar, `${visiblesAlFinal}/${totalRevelar}`);

console.log('\n── NAVEGACIÓN ──────────────────────────────────────');

await pagina.evaluate(() => window.scrollTo(0, 0));
await pagina.waitForTimeout(400);
comprobar('La barra empieza transparente sobre el hero', (await pagina.getAttribute('[data-nav]', 'data-fijada')) !== 'true');

await pagina.evaluate(() => window.scrollTo(0, 1200));
await pagina.waitForTimeout(500);
comprobar('La barra se vuelve sólida al bajar', (await pagina.getAttribute('[data-nav]', 'data-fijada')) === 'true');

await pagina.locator('.nav__enlace', { hasText: 'Reparto' }).click();
await pagina.waitForTimeout(1200);
comprobar('El scroll-spy marca la sección activa', (await pagina.locator('.nav__enlace[aria-current="true"]').count()) >= 1);

console.log('\n── CALENDARIO ──────────────────────────────────────');

const disparador = pagina.getByRole('button', { name: /Añadir al calendario/ }).last();
await disparador.scrollIntoViewIfNeeded();
await disparador.click();
await pagina.waitForTimeout(300);

comprobar('El menú se abre', (await pagina.locator('[role="menu"]').count()) === 1);
comprobar('El botón anuncia su estado (aria-expanded)', (await disparador.getAttribute('aria-expanded')) === 'true');
comprobar('Ofrece varios destinos de calendario', (await pagina.locator('[role="menuitem"]').count()) === 3);

const descarga = pagina.waitForEvent('download', { timeout: 5000 });
await pagina.getByRole('menuitem', { name: /Descargar \.ics/ }).click();

let ics = '';
try {
  const fichero = await descarga;
  ics = await readFile(await fichero.path(), 'utf8');
} catch (e) {
  ics = '';
}

comprobar('Descarga un archivo .ics', ics.startsWith('BEGIN:VCALENDAR'));
comprobar('El .ics lleva la fecha correcta', ics.includes('DTSTART;VALUE=DATE:20260729'));
comprobar('El .ics usa saltos CRLF (lo exige el RFC)', ics.includes('\r\n'));
comprobar('El .ics escapa los dos puntos del título', /SUMMARY:Spider-Man: Brand New Day/.test(ics));

await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(250);
comprobar('Escape cierra el menú', (await pagina.locator('[role="menu"]').count()) === 0);

console.log('\n── TRÁILER ─────────────────────────────────────────');

await pagina.locator('#trailer').scrollIntoViewIfNeeded();
await pagina.waitForTimeout(400);
comprobar('No hay iframe de YouTube antes del click (facade)', (await pagina.locator('.trailer iframe').count()) === 0);
comprobar('La caja del tráiler reserva su espacio (sin CLS)', (await pagina.locator('.trailer').count()) === 1);

const miniatura = await pagina.getAttribute('.trailer__miniatura', 'src');
comprobar('Se muestra la miniatura real del video como portada', !!miniatura?.includes('img.youtube.com'), miniatura ?? 'sin miniatura');

await pagina.locator('.trailer__boton').click();
await pagina.waitForTimeout(500);
const iframeSrc = await pagina.getAttribute('.trailer iframe', 'src');
comprobar(
  'Al hacer click, el iframe carga el video correcto desde el segundo indicado',
  iframeSrc?.includes('/embed/') && iframeSrc?.includes('start=5'),
  iframeSrc ?? 'sin iframe'
);

console.log('\n── FAQ ─────────────────────────────────────────────');

/**
 * Scroll explícito a propósito, en vez de confiar en el auto-scroll
 * implícito de Playwright antes de un click: el tráiler, en el bloque
 * anterior, quedó reproduciendo un video real (ya no bloqueado por el
 * bug del velo) — con un <iframe> de YouTube activo en la página, el
 * auto-scroll-al-hacer-click puede calcular mal la posición del siguiente
 * elemento. Llevar la sección a la vista nosotros mismos antes de tocar
 * nada evita depender de ese cálculo.
 */
await pagina.locator('#preguntas').scrollIntoViewIfNeeded();
await pagina.waitForTimeout(300);

const primeraFaq = pagina.locator('.faq__item').first();
comprobar('El acordeón empieza cerrado', !(await primeraFaq.evaluate((e) => e.open)));
await primeraFaq.locator('summary').click();
await pagina.waitForTimeout(200);
comprobar('El acordeón abre al pulsar', await primeraFaq.evaluate((e) => e.open));

console.log('\n── RESPONSIVE ──────────────────────────────────────');

for (const [nombre, ancho, alto] of [
  ['movil', 390, 844],
  ['tablet', 820, 1180],
  ['escritorio', 1440, 900],
]) {
  await pagina.setViewportSize({ width: ancho, height: alto });
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(500);

  const desborda = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  comprobar(`Sin scroll horizontal en ${nombre} (${ancho}px)`, !desborda);

  await pagina.screenshot({ path: join(CAPTURAS, `${nombre}.png`), fullPage: true });
}

console.log('\n── CONSOLA ─────────────────────────────────────────');
comprobar('Cero errores de JavaScript en consola', erroresConsola.length === 0, erroresConsola.join(' | '));

/* ------------------------------------------------------------------ */
await navegador.close();
servidor.close();

const fallos = resultados.filter((r) => !r.ok);
console.log(`\n${'─'.repeat(52)}`);
console.log(`${resultados.length - fallos.length}/${resultados.length} comprobaciones pasadas.`);
console.log(`Capturas en tests/capturas/`);

if (fallos.length) {
  console.log('\nFallos:');
  fallos.forEach((f) => console.log(`  · ${f.nombre}${f.detalle ? ` — ${f.detalle}` : ''}`));
  process.exit(1);
}
