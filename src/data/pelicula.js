/**
 * Fuente única de verdad de la landing.
 *
 * Todo dato que aparezca en pantalla vive acá: si mañana cambia la fecha de
 * estreno o llega el ID del tráiler, se toca un archivo y no doce componentes.
 * Los componentes importan de acá y nunca hardcodean texto de negocio.
 */

export const PELICULA = {
  titulo: 'Spider-Man',
  subtitulo: 'Brand New Day',
  tituloCompleto: 'Spider-Man: Brand New Day',

  /**
   * Zona horaria explícita (+02:00 = Madrid en horario de verano).
   * Sin ella, cada visitante calcularía el countdown contra su propio huso
   * y vería un número distinto: el estreno es a una hora concreta, no
   * "medianoche donde estés".
   */
  estrenoISO: '2026-07-29T00:00:00+02:00',
  estrenoDia: '29',
  estrenoMes: 'Julio',
  estrenoAnio: '2026',
  estrenoLargo: '29 de julio de 2026',

  /** Formato compacto para el archivo .ics (YYYYMMDD, evento de día completo). */
  estrenoICS: { inicio: '20260729', fin: '20260730' },

  director: 'Destin Daniel Cretton',
  estudios: 'Marvel Studios · Sony Pictures',
  clasificacion: 'Pendiente de calificación',
  idiomas: 'Castellano · V.O.S.E.',

  /**
   * ID de YouTube del tráiler oficial. Mientras esté vacío, el componente
   * <Trailer /> muestra el estado "próximamente" en lugar de romper con un
   * embed a un vídeo inexistente. Cargá el ID y el reproductor se activa solo.
   */
  trailerId: '',

  descripcion:
    'Cuenta atrás para el estreno de SPIDER-MAN: Brand New Day. 29 de julio de 2026, solo en cines.',
};

/**
 * Candado de acceso — NO es seguridad real.
 *
 * El sitio va con `noindex` y sin sitemap para no aparecer en buscadores
 * (pelicula.js no participa de eso), pero mientras el proyecto espera la
 * aprobación de Midudev, también hace falta que quien tenga el link no
 * vea el contenido sin más. Esta clave es esa traba simbólica: vive en un
 * archivo que se manda entero al navegador, así que cualquiera que abra
 * las herramientas de desarrollador puede leerla en dos segundos. Frena a
 * un visitante casual, no a alguien que la busque a propósito.
 *
 * Para cambiarla, editar sólo esta línea.
 */
export const CLAVE_ACCESO = 'telarana2026';

/**
 * Reparto anunciado públicamente. Es una landing de fan/portfolio: los datos
 * provienen de anuncios de prensa y pueden cambiar hasta el estreno.
 */
export const REPARTO = [
  { actor: 'Tom Holland', personaje: 'Peter Parker / Spider-Man' },
  { actor: 'Zendaya', personaje: 'MJ' },
  { actor: 'Jacob Batalon', personaje: 'Ned Leeds' },
  { actor: 'Jon Bernthal', personaje: 'Frank Castle / The Punisher' },
  { actor: 'Mark Ruffalo', personaje: 'Bruce Banner / Hulk' },
  { actor: 'Sadie Sink', personaje: 'Personaje sin anunciar' },
  { actor: 'Michael Mando', personaje: 'Mac Gargan / Scorpion' },
  { actor: 'Liza Colón-Zayas', personaje: 'Personaje sin anunciar' },
];

/**
 * DATOS DE DEMOSTRACIÓN. En producción esto lo devuelve la API de la
 * distribuidora; el componente <Entradas /> ya está escrito contra esta forma,
 * así que sustituir el objeto por un `fetch` no cambia una línea de la vista.
 *
 * Forma de cada sesión:
 *   { cine: string, sala: string, horas: string[], formato: string }
 */
export const CINES = {
  Madrid: [
    { cine: 'Kinépolis Ciudad de la Imagen', sala: 'Sala 25', horas: ['16:30', '19:45', '22:50'], formato: 'IMAX' },
    { cine: 'Cines Callao', sala: 'Sala 1', horas: ['17:00', '20:10', '23:15'], formato: 'Digital' },
    { cine: 'Yelmo Ideal', sala: 'Sala 4', horas: ['18:20', '21:30'], formato: 'V.O.S.E.' },
  ],
  Barcelona: [
    { cine: 'Cinesa Diagonal Mar', sala: 'Sala 12', horas: ['16:00', '19:20', '22:30'], formato: 'IMAX' },
    { cine: 'Aribau Multicines', sala: 'Sala 2', horas: ['17:45', '20:50'], formato: 'V.O.S.E.' },
    { cine: 'Yelmo Icaria', sala: 'Sala 9', horas: ['18:00', '21:10', '00:05'], formato: '4DX' },
  ],
  Valencia: [
    { cine: 'Kinépolis Valencia', sala: 'Sala 18', horas: ['16:15', '19:30', '22:40'], formato: 'IMAX' },
    { cine: 'Cines Lys', sala: 'Sala 3', horas: ['17:30', '20:40'], formato: 'V.O.S.E.' },
  ],
  Sevilla: [
    { cine: 'Nervión Plaza', sala: 'Sala 7', horas: ['16:45', '20:00', '23:00'], formato: 'Digital' },
    { cine: 'Cinesur Los Arcos', sala: 'Sala 5', horas: ['18:10', '21:20'], formato: 'Digital' },
  ],
  Bilbao: [
    { cine: 'Yelmo Megapark', sala: 'Sala 14', horas: ['17:15', '20:25', '23:10'], formato: '4DX' },
    { cine: 'Golem Alhóndiga', sala: 'Sala 1', horas: ['18:40', '21:45'], formato: 'V.O.S.E.' },
  ],
};

export const CIUDADES = Object.keys(CINES);

export const FAQ = [
  {
    pregunta: '¿Cuándo se estrena?',
    respuesta:
      'El 29 de julio de 2026 en cines de toda España. Los pases de medianoche del día 28 se anunciarán en las próximas semanas.',
  },
  {
    pregunta: '¿Hay escenas post-créditos?',
    respuesta: 'Es Marvel. Quedate sentado hasta que se encienda la luz de la sala.',
  },
  {
    pregunta: '¿Cuándo salen las entradas a la venta?',
    respuesta:
      'La venta anticipada abre unas semanas antes del estreno. Añadí el estreno a tu calendario desde esta página y no se te va a pasar.',
  },
  {
    pregunta: '¿Se puede ver en versión original?',
    respuesta:
      'Sí. Filtrá por tu ciudad en la sección de sesiones: las copias en V.O.S.E. están marcadas con su etiqueta.',
  },
  {
    pregunta: '¿Esta web es oficial?',
    respuesta:
      'No. Es un proyecto de portfolio construido con Astro y React. No está afiliado a Sony Pictures ni a Marvel; las marcas y personajes pertenecen a sus titulares.',
  },
];

/** Enlaces de la navegación. El id debe existir como ancla en la página. */
export const NAVEGACION = [
  { id: 'sinopsis', texto: 'Sinopsis' },
  { id: 'trailer', texto: 'Tráiler' },
  { id: 'reparto', texto: 'Reparto' },
  { id: 'sesiones', texto: 'Sesiones' },
  { id: 'faq', texto: 'FAQ' },
];
