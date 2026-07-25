import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Cambiá "tu-usuario" por tu usuario real de GitHub antes de desplegar:
  // alimenta las URLs canónicas, el sitemap y las etiquetas Open Graph.
  site: 'https://tu-usuario.github.io',

  // GitHub Pages sirve un repo normal (no un repo "tu-usuario.github.io")
  // bajo una subcarpeta con el nombre del repo, no en la raíz del dominio.
  // Sin este `base`, todos los enlaces del sitio (fuentes, favicon, CSS)
  // apuntarían a la raíz del dominio y romperían en producción aunque
  // funcionen perfecto en local. Si el repo se llama distinto, cambiá esto.
  base: '/landing-spider-man/',

  integrations: [react(), sitemap()],

  // Salida 100% estática. Sin servidor que mantener, sin cold starts:
  // la landing se sirve desde CDN y aguanta un pico de tráfico masivo
  // sin escalar nada — que es exactamente lo que pide el brief.
  output: 'static',

  build: {
    // Astro decide por hoja: las chicas van inline (menos requests en el
    // camino crítico), las grandes quedan como archivo cacheable.
    inlineStylesheets: 'auto',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  vite: {
    build: {
      // Menos ruido en el bundle: los assets chicos se vuelven data URI.
      assetsInlineLimit: 2048,
    },
  },

  security: {
    // CSP con hashes automáticos: Astro calcula el hash de cada script y
    // estilo que genera y arma la política él solo. No hace falta 'unsafe-
    // inline' (que anularía la protección) ni un servidor que emita un nonce
    // distinto por request, imposible en un sitio 100% estático.
    //
    // Se llamaba `experimental.csp` hasta Astro 6; se estabilizó como
    // `security.csp` en Astro 7.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        // El tráiler se embebe desde youtube-nocookie recién al hacer click
        // (patrón facade); sin este permiso el iframe quedaría bloqueado.
        "frame-src https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
