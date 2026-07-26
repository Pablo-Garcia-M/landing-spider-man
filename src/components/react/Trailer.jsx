import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Reproductor con patrón *facade*.
 *
 * Un iframe de YouTube arrastra varios cientos de KB de JS y abre conexiones a
 * tres dominios en cuanto aparece en el DOM — lo dé play alguien o no. Acá la
 * página no le pide absolutamente nada a YouTube hasta el click: mostramos la
 * miniatura oficial del video (una sola imagen liviana, servida por
 * img.youtube.com, sin nada del peso del reproductor) y recién al hacer click
 * se crea el iframe con autoplay. En una landing que espera un pico de
 * tráfico, es la diferencia entre un LCP sano y uno arrastrado por un vídeo
 * que nadie miró.
 *
 * La caja del tráiler ocupa todo el ancho del bloque (bastante más que
 * 480px en cualquier pantalla que no sea un celular), así que probamos
 * primero la miniatura de alta resolución (1280×720, nítida a ese tamaño)
 * y sólo si no existiera para ese video en particular —YouTube no la genera
 * para todos— vamos bajando de calidad en cascada hasta una que sabemos
 * que existe siempre. Mostrar una miniatura de 480×360 estirada a lo ancho
 * de toda la sección se ve borrosa/pixelada; probar en cascada evita eso
 * sin perder la garantía de que siempre haya alguna imagen.
 */
const RESOLUCIONES = ['maxresdefault', 'sddefault', 'hqdefault'];

/**
 * Props:
 *   videoId        {string}  ID de YouTube. Vacío = el tráiler todavía no salió.
 *   titulo         {string}  Nombre de la película, para los textos accesibles.
 *   inicioSegundos {number}  Segundo en el que arranca el video (del "&t=" del link original).
 */
function TrailerBase({ videoId = '', titulo, inicioSegundos = 0 }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [indiceResolucion, setIndiceResolucion] = useState(0);
  const [miniaturaRota, setMiniaturaRota] = useState(false);
  const disponible = videoId.trim().length > 0;

  if (reproduciendo) {
    return (
      <div className="trailer">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=${inicioSegundos}`}
          title={`Tráiler de ${titulo}`}
          // "compute-pressure" incluido a propósito: el reproductor de YouTube
          // lo pide internamente (lo usa para ajustar la calidad del video
          // según la carga de la CPU) y, sin concedérselo acá, el navegador
          // registra una violación de permisos en la consola por cada carga.
          allow="accelerometer; autoplay; clipboard-write; compute-pressure; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    // "trailer--portada" a propósito, distinto del div de arriba (el que
    // envuelve el <iframe> cuando ya está reproduciendo): el velo oscuro
    // que oscurece la miniatura (ver global.css) está pegado a esta clase
    // puntual, no a ".trailer" en general — si estuviera en ".trailer" a
    // secas, ese velo se dibujaría TAMBIÉN arriba del iframe real, tapando
    // los controles nativos de YouTube (play/pausa/barra de progreso) e
    // impidiendo cualquier click sobre el video ya en reproducción.
    <div className="trailer trailer--portada">
      {disponible && !miniaturaRota && (
        <img
          className="trailer__miniatura"
          src={`https://img.youtube.com/vi/${videoId}/${RESOLUCIONES[indiceResolucion]}.jpg`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => {
            if (indiceResolucion < RESOLUCIONES.length - 1) {
              setIndiceResolucion((i) => i + 1);
            } else {
              setMiniaturaRota(true);
            }
          }}
        />
      )}

      <button
        type="button"
        className="trailer__boton"
        disabled={!disponible}
        onClick={() => setReproduciendo(true)}
        aria-label={
          disponible
            ? `Reproducir el tráiler de ${titulo}`
            : 'El tráiler todavía no está disponible'
        }
      >
        <span
          className={`trailer__icono ${disponible ? 'trailer__icono--play' : ''}`}
          aria-hidden="true"
        >
          {disponible ? (
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 7v5l3 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>

        <span>{disponible ? 'Reproducir tráiler' : 'Tráiler próximamente'}</span>

        {!disponible && (
          <span className="trailer__nota">
            El primer avance oficial aterriza en las próximas semanas.
          </span>
        )}
      </button>
    </div>
  );
}

export default function Trailer(props) {
  return (
    <ErrorBoundary
      fallback={
        <div className="trailer trailer--fallback">
          <p className="trailer__nota" role="status">
            El tráiler no se pudo cargar. Volvé a intentarlo en unos minutos.
          </p>
        </div>
      }
    >
      <TrailerBase {...props} />
    </ErrorBoundary>
  );
}
