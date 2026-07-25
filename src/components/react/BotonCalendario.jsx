import { useEffect, useId, useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';

/**
 * Botón "Añadir al calendario" con menú de destinos.
 *
 * Props:
 *   titulo      {string} Nombre del evento.
 *   inicio      {string} Día de inicio en formato ICS: YYYYMMDD.
 *   fin         {string} Día de fin, exclusivo (el día siguiente al del evento).
 *   descripcion {string} Texto largo del evento.
 *   variante    {'solido'|'borde'}
 *   alineacion  {'izquierda'|'derecha'} Ancla el menú al otro lado si el botón
 *                                       está pegado al borde de la pantalla.
 */

/**
 * Escapa los caracteres que el formato iCalendar (RFC 5545) trata como
 * sintaxis. Sin esto, un título con una coma parte el campo en dos y algunos
 * clientes de calendario descartan el evento entero sin avisar.
 */
const escaparICS = (texto) =>
  texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** 20260729 → 2026-07-29, que es lo que espera el deeplink de Outlook. */
const conGuiones = (fecha) =>
  `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`;

function BotonCalendarioBase({
  titulo,
  inicio,
  fin,
  descripcion = '',
  variante = 'borde',
  alineacion = 'izquierda',
}) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState('');
  const contenedor = useRef(null);
  const idMenu = useId();

  // Cerrar al hacer click fuera o al pulsar Escape: lo que espera cualquiera
  // que haya usado un menú antes. Los listeners sólo existen mientras el menú
  // está abierto, así que la página en reposo no escucha nada.
  useEffect(() => {
    if (!abierto) return;

    const alClickFuera = (e) => {
      if (!contenedor.current?.contains(e.target)) setAbierto(false);
    };
    const alTeclado = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alClickFuera);
    document.addEventListener('keydown', alTeclado);
    return () => {
      document.removeEventListener('mousedown', alClickFuera);
      document.removeEventListener('keydown', alTeclado);
    };
  }, [abierto]);

  /**
   * Genera el .ics en el propio navegador con un Blob: sin backend, sin
   * librería de 40 KB y sin mandar a nadie a Google si no quiere.
   *
   * Envuelto en try/catch porque `Blob`/`URL.createObjectURL` pueden fallar
   * en navegadores muy viejos o en modos de privacidad estrictos: si pasa,
   * el menú se queda abierto con los enlaces a Google/Outlook como plan B en
   * lugar de que el click no haga nada y parezca que la página está rota.
   */
  const descargarICS = () => {
    try {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//landing-spider-man//ES',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:estreno-${inicio}@landing-spider-man`,
        `DTSTAMP:${inicio}T000000Z`,
        `DTSTART;VALUE=DATE:${inicio}`,
        `DTEND;VALUE=DATE:${fin}`,
        `SUMMARY:${escaparICS(titulo)}`,
        `DESCRIPTION:${escaparICS(descripcion)}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Mañana se estrena',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n'); // El RFC exige CRLF. Con \n solo, Outlook rechaza el archivo.

      const url = URL.createObjectURL(
        new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      );
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'spider-man-brand-new-day.ics';
      enlace.click();
      URL.revokeObjectURL(url); // Liberamos el objeto: si no, vive hasta recargar.

      setAbierto(false);
      setAviso('Archivo descargado');
      window.setTimeout(() => setAviso(''), 3000);
    } catch {
      setAviso('No se pudo descargar. Probá con Google o Outlook.');
      window.setTimeout(() => setAviso(''), 4000);
    }
  };

  const urlGoogle = new URL('https://calendar.google.com/calendar/render');
  urlGoogle.searchParams.set('action', 'TEMPLATE');
  urlGoogle.searchParams.set('text', titulo);
  urlGoogle.searchParams.set('dates', `${inicio}/${fin}`);
  urlGoogle.searchParams.set('details', descripcion);

  const urlOutlook = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  urlOutlook.searchParams.set('path', '/calendar/action/compose');
  urlOutlook.searchParams.set('subject', titulo);
  urlOutlook.searchParams.set('allday', 'true');
  urlOutlook.searchParams.set('startdt', conGuiones(inicio));
  urlOutlook.searchParams.set('enddt', conGuiones(inicio));
  urlOutlook.searchParams.set('body', descripcion);

  return (
    <div
      className={`cal ${alineacion === 'derecha' ? 'cal--derecha' : ''}`}
      data-abierto={abierto}
      ref={contenedor}
    >
      <button
        type="button"
        className={`boton ${variante === 'solido' ? 'boton--solido' : ''}`}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-controls={idMenu}
        onClick={() => setAbierto((v) => !v)}
      >
        Añadir al calendario
        <svg className="cal__flecha" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      {abierto && (
        <ul className="cal__menu" id={idMenu} role="menu">
          <li role="none">
            <button type="button" role="menuitem" className="cal__opcion" onClick={descargarICS}>
              <IconoDescarga />
              Descargar .ics (Apple, Outlook…)
            </button>
          </li>
          <li role="none">
            <a
              role="menuitem"
              className="cal__opcion"
              href={urlGoogle.toString()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
            >
              <IconoEnlace />
              Google Calendar
            </a>
          </li>
          <li role="none">
            <a
              role="menuitem"
              className="cal__opcion"
              href={urlOutlook.toString()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
            >
              <IconoEnlace />
              Outlook.com
            </a>
          </li>
        </ul>
      )}

      {/* role=status: el lector de pantalla anuncia la confirmación sin robar el foco. */}
      {aviso && (
        <p className="cal__aviso" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}

export default function BotonCalendario(props) {
  return (
    <ErrorBoundary
      fallback={
        <p className="parrafo cal__fallback" role="status">
          No se pudo cargar el botón de calendario.
        </p>
      }
    >
      <BotonCalendarioBase {...props} />
    </ErrorBoundary>
  );
}

const IconoDescarga = () => (
  <svg className="cal__icono" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 3v10m0 0 4-4m-4 4-4-4M3 16h14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconoEnlace = () => (
  <svg className="cal__icono" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M11 3h6v6M17 3l-8 8M15 12v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
