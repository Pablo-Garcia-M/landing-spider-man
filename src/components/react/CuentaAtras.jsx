import { Fragment, useEffect, useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Cuenta atrás hasta el estreno.
 *
 * Props:
 *   objetivoISO  {string}  Fecha en ISO 8601 **con offset explícito** (ej. +02:00).
 *   mensajeFinal {string}  Texto que reemplaza al contador una vez pasada la fecha.
 */

const dosDigitos = (n) => String(n).padStart(2, '0');

/**
 * Calcula el tiempo que falta leyendo el reloj real en cada tick.
 *
 * No restamos "un segundo" al valor anterior a propósito: cuando la pestaña
 * pasa a segundo plano el navegador estrangula los timers, y un contador que
 * resta acumularía todo ese retraso como error permanente. Recalcular contra
 * Date.now() hace que volver a la pestaña muestre siempre la cifra correcta.
 *
 * Devuelve null cuando la fecha ya pasó.
 */
function calcular(objetivo) {
  const restante = objetivo - Date.now();
  if (restante <= 0) return null;

  const total = Math.floor(restante / 1000);
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor(total / 3600) % 24,
    minutos: Math.floor(total / 60) % 60,
    segundos: total % 60,
  };
}

function CuentaAtrasBase({ objetivoISO, mensajeFinal = 'Ya en cines' }) {
  const objetivo = new Date(objetivoISO).getTime();

  // Si `pelicula.js` trae una fecha mal formada, `objetivo` es NaN y todas las
  // cuentas de abajo se propagan como NaN: el contador mostraría "NaN:NaN"
  // para siempre en lugar de fallar con un mensaje entendible.
  if (Number.isNaN(objetivo)) {
    return (
      <p className="cuenta cuenta--estreno" role="status">
        Fecha de estreno no disponible
      </p>
    );
  }

  /**
   * Arranca en `undefined`, no en el valor calculado. El HTML se genera en el
   * build, así que si calculáramos aquí el servidor pintaría la cifra de
   * entonces y React encontraría otra al hidratar: error de hidratación y un
   * parpadeo visible. Con `undefined` el marcado del build y el del cliente
   * coinciden, y el número real entra en el primer efecto.
   */
  const [restante, setRestante] = useState(undefined);

  useEffect(() => {
    setRestante(calcular(objetivo));

    const reloj = window.setInterval(() => {
      const siguiente = calcular(objetivo);
      setRestante(siguiente);
      // Se acabó: paramos el intervalo en lugar de latir para siempre.
      if (siguiente === null) window.clearInterval(reloj);
    }, 1000);

    return () => window.clearInterval(reloj);
  }, [objetivo]);

  if (restante === null) {
    return (
      <p className="cuenta cuenta--estreno" role="status">
        {mensajeFinal}
      </p>
    );
  }

  const unidades = [
    { valor: restante ? dosDigitos(restante.dias) : '--', label: 'días' },
    { valor: restante ? dosDigitos(restante.horas) : '--', label: 'horas' },
    { valor: restante ? dosDigitos(restante.minutos) : '--', label: 'min' },
    { valor: restante ? dosDigitos(restante.segundos) : '--', label: 'seg' },
  ];

  return (
    /*
     * aria-hidden a propósito: un lector de pantalla anunciando
     * "42 segundos... 41 segundos..." sin parar vuelve la página inusable.
     * La misma información se da una sola vez en el .sr-only del Hero.
     */
    <div className="cuenta" aria-hidden="true">
      {unidades.map((unidad, i) => (
        <Fragment key={unidad.label}>
          {i > 0 && <div className="cuenta__sep" />}
          <div className="cuenta__unidad">
            <span className="cuenta__numero">{unidad.valor}</span>
            <span className="cuenta__label">{unidad.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * El límite de error vive acá, no en el .astro que la usa: así Astro sigue
 * importando `CuentaAtras` igual que siempre y no hace falta anidar
 * componentes de dos frameworks en el marcado.
 */
export default function CuentaAtras(props) {
  const fecha = new Date(props.objetivoISO);
  const fechaLegible = Number.isNaN(fecha.getTime())
    ? 'Fecha de estreno no disponible'
    : `Estreno: ${fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <ErrorBoundary
      fallback={
        <p className="cuenta cuenta--estreno" role="status">
          {fechaLegible}
        </p>
      }
    >
      <CuentaAtrasBase {...props} />
    </ErrorBoundary>
  );
}
