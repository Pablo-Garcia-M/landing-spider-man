import { Component } from 'react';

/**
 * Red de seguridad por isla.
 *
 * Astro hidrata cada isla por separado, pero React no lo sabe: si
 * `CuentaAtras` tira una excepción de render, por defecto React desmonta todo
 * el árbol donde vive, y en el peor de los casos deja un hueco en blanco
 * donde debería estar el elemento firma del hero. Un error boundary limita el
 * daño a esa isla concreta — el resto de la página, incluidas las otras tres
 * islas, sigue funcionando.
 *
 * Sólo puede escribirse como componente de clase: es la única API de React
 * que expone `getDerivedStateFromError` / `componentDidCatch`.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    // Sin backend de analítica: dejamos rastro en la consola para quien
    // depure, sin pretender que hay telemetría que no existe.
    console.error('[landing-spider-man] isla caída:', error);
  }

  render() {
    if (this.state.fallo) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
