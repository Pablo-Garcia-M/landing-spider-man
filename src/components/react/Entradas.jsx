import { useMemo, useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

const FORMATOS = ['Todos', 'IMAX', '4DX', 'V.O.S.E.', 'Digital'];

/**
 * Selector de sesiones por ciudad y formato.
 *
 * Todo el filtrado ocurre en memoria sobre datos que ya viajaron con el HTML:
 * cambiar de ciudad no dispara una petición ni un repintado de la página. Es
 * el tipo de interacción que justifica traer React a una landing por lo demás
 * estática — y la isla pesa unos pocos KB, no el sitio entero.
 *
 * Los datos son de demostración. Cuando exista el endpoint real basta con
 * reemplazar la prop `cines` por la respuesta de la API: la vista no cambia.
 *
 * Props:
 *   ciudades {string[]}  Nombres de ciudad, en orden.
 *   cines    {object}    { [ciudad]: [{ cine, sala, horas, formato }] }
 */
function EntradasBase({ ciudades = [], cines = {} }) {
  const [ciudad, setCiudad] = useState(ciudades[0] ?? '');
  const [formato, setFormato] = useState('Todos');

  const sesiones = useMemo(() => {
    const todas = cines[ciudad] ?? [];
    return formato === 'Todos' ? todas : todas.filter((s) => s.formato === formato);
  }, [ciudad, formato, cines]);

  // Sin datos de ciudades no hay nada que filtrar: en vez de una lista de
  // pestañas vacía y un mensaje confuso ("sesiones para "), avisamos directo.
  if (ciudades.length === 0) {
    return (
      <p className="parrafo" role="status">
        Todavía no hay sesiones publicadas. Volvé más cerca del estreno.
      </p>
    );
  }

  return (
    <div>
      {/* role=tablist para que el lector de pantalla lea "pestaña 2 de 5". */}
      <div className="sesiones__ciudades" role="tablist" aria-label="Elegí tu ciudad">
        {ciudades.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === ciudad}
            className="sesiones__ciudad"
            onClick={() => setCiudad(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="sesiones__ciudades" role="group" aria-label="Filtrar por formato">
        {FORMATOS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === formato}
            className="sesiones__ciudad"
            data-activo={f === formato}
            onClick={() => setFormato(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {sesiones.length === 0 ? (
        <p className="parrafo" role="status">
          Todavía no hay sesiones en {formato} para {ciudad}. Probá con otro formato
          o volvé cuando abra la venta anticipada.
        </p>
      ) : (
        <ul className="sesiones__lista">
          {sesiones.map((s) => (
            <li className="sesion" key={`${s.cine}-${s.sala}`}>
              <div>
                <p className="sesion__cine">{s.cine}</p>
                <p className="sesion__meta">
                  <span className="sesion__formato">{s.formato}</span>
                  <span>{s.sala}</span>
                  <span>{ciudad}</span>
                </p>
              </div>

              <div className="sesion__horas">
                {s.horas.map((hora) => (
                  <button
                    key={hora}
                    type="button"
                    className="sesion__hora"
                    aria-label={`Sesión de las ${hora} en ${s.cine}, ${s.formato}`}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="sesiones__aviso">
        Horarios de demostración. La venta anticipada todavía no está abierta.
      </p>
    </div>
  );
}

export default function Entradas(props) {
  return (
    <ErrorBoundary
      fallback={
        <p className="parrafo" role="status">
          No se pudieron cargar las sesiones. Recargá la página para
          reintentarlo.
        </p>
      }
    >
      <EntradasBase {...props} />
    </ErrorBoundary>
  );
}
