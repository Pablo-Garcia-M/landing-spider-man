import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Reproductor con patrón *facade*.
 *
 * Un iframe de YouTube arrastra varios cientos de KB de JS y abre conexiones a
 * tres dominios en cuanto aparece en el DOM — lo dé play alguien o no. Acá la
 * página no le pide absolutamente nada a YouTube hasta el click: mostramos una
 * portada propia (un degradado, cero bytes de red) y recién entonces creamos
 * el iframe con autoplay. En una landing que espera un pico de tráfico, es la
 * diferencia entre un LCP sano y uno arrastrado por un vídeo que nadie miró.
 *
 * Props:
 *   videoId        {string}  ID de YouTube. Vacío = el tráiler todavía no salió.
 *   titulo         {string}  Nombre de la película, para los textos accesibles.
 *   inicioSegundos {number}  Segundo en el que arranca el video (del "&t=" del link original).
 */
function TrailerBase({ videoId = '', titulo, inicioSegundos = 0 }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const disponible = videoId.trim().length > 0;

  if (reproduciendo) {
    return (
      <div className="trailer">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=${inicioSegundos}`}
          title={`Tráiler de ${titulo}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="trailer">
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
