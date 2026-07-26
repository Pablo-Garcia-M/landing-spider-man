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
  trailerId: '3B1_P2h7v2k',
  /** Segundo en el que arranca el embed (del link original: &t=5s). */
  trailerInicioSegundos: 5,

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

export const FAQ = [
  {
    pregunta: '¿Cuándo se estrena?',
    respuesta:
      'El 29 de julio de 2026 en cines de toda Hispanoamérica y España. Los pases de medianoche se anunciarán en las próximas semanas.',
  },
  {
    pregunta: '¿Hay escenas post-créditos?',
    respuesta: 'Es Marvel. Quedate sentado hasta que se encienda la luz de la sala.',
  },
  {
    pregunta: '¿Cuándo salen las entradas a la venta?',
    respuesta:
      'La venta anticipada abre unas semanas antes del estreno, con fecha propia en cada país. Añadí el estreno a tu calendario desde esta página y no se te va a pasar.',
  },
  {
    pregunta: '¿Se puede ver en versión original?',
    respuesta:
      'Sí. La disponibilidad de copias subtituladas depende de cada cine — consultá la cartelera local más cerca del estreno.',
  },
  {
    pregunta: '¿Esta web es oficial?',
    respuesta:
      'No. Es una página hecha por fans. No está afiliada a Sony Pictures ni a Marvel; las marcas y personajes pertenecen a sus titulares.',
  },
];

/** Enlaces de la navegación. El id debe existir como ancla en la página. */
export const NAVEGACION = [
  { id: 'sinopsis', texto: 'Sinopsis' },
  { id: 'trailer', texto: 'Tráiler' },
  { id: 'reparto', texto: 'Reparto' },
  { id: 'faq', texto: 'Preguntas' },
];
