export const services: Record<
  string,
  { title: string; description: string; schema: unknown; body: string }
> = {
  "ventanas-vidrio-lima": {
    title: "Ventanas de vidrio en Lima | Vidrios VECA",
    description:
      "Soluciones en ventanas de vidrio para casas y departamentos en Lima. Conoce qué evaluar antes de renovar tus ventanas con Vidrios VECA.",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://veca.com.pe/#organization",
          name: "Vidrios VECA",
          alternateName: "VECA",
          url: "https://veca.com.pe/",
          logo: {
            "@type": "ImageObject",
            url: "https://veca.com.pe/assets/logo.svg",
          },
          description:
            "Vidrios y ventanas para edificios, casas, departamentos y remodelaciones. Atención de proyectos en toda Lima.",
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
          telephone: "+51908917621",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+51908917621",
            contactType: "customer service",
            availableLanguage: "Spanish",
            url: "https://wa.me/51908917621",
            areaServed: "Lima, Perú",
          },
        },
        {
          "@type": "WebSite",
          "@id": "https://veca.com.pe/#website",
          url: "https://veca.com.pe/",
          name: "Vidrios VECA",
          alternateName: "VECA",
          inLanguage: "es-PE",
          publisher: { "@id": "https://veca.com.pe/#organization" },
        },
        {
          "@type": "WebPage",
          "@id": "https://veca.com.pe/ventanas-vidrio-lima/#webpage",
          url: "https://veca.com.pe/ventanas-vidrio-lima/",
          name: "Ventanas de vidrio en Lima | Vidrios VECA",
          isPartOf: { "@id": "https://veca.com.pe/#website" },
          inLanguage: "es-PE",
          about: { "@id": "https://veca.com.pe/ventanas-vidrio-lima/#service" },
        },
        {
          "@type": "Service",
          "@id": "https://veca.com.pe/ventanas-vidrio-lima/#service",
          name: "Ventanas de vidrio en Lima",
          url: "https://veca.com.pe/ventanas-vidrio-lima/",
          description:
            "Soluciones en ventanas de vidrio para casas y departamentos en Lima. Conoce qué evaluar antes de renovar tus ventanas con Vidrios VECA.",
          provider: { "@id": "https://veca.com.pe/#organization" },
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Vidrios VECA",
              item: "https://veca.com.pe/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Ventanas de vidrio en Lima",
              item: "https://veca.com.pe/ventanas-vidrio-lima/",
            },
          ],
        },
      ],
    },
    body: '<section class="service-hero section-pad"><nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="/">Vidrios VECA</a><span aria-hidden="true">/</span><span>Ventanas de vidrio en Lima</span></nav><p class="eyebrow">SOLUCIONES EN VIDRIO · LIMA, PERÚ</p><h1>Ventanas de vidrio en Lima</h1><p class="service-intro">Más luz, una nueva vista y espacios que se sienten tuyos. En Vidrios VECA conversamos sobre las ventanas que necesita tu casa o departamento y cómo integrarlas a tu proyecto.</p><a class="button button-orange" href="/#contacto">Prepara tu proyecto <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a class="text-link service-whatsapp" href="https://wa.me/51908917621" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 8c0 4 4 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3-2 1Z"/></svg></a></section><figure class="service-cover"><img src="/assets/vivienda.webp" alt="Ambiente interior luminoso con amplias ventanas de vidrio" width="1600" height="1067" fetchpriority="high"></figure><section class="service-editorial section-pad"><p class="eyebrow dark">VIDRIOS VECA · ATENCIÓN EN TODA LIMA</p><h2>Ventanas para vivir tus espacios</h2><p>Una ventana influye en la entrada de luz, la ventilación y la relación de tu hogar con el exterior. Elegirla requiere mirar el ambiente completo: cómo lo usas, qué orientación tiene y qué deseas mejorar. Una sala, un dormitorio y una cocina pueden necesitar soluciones distintas.</p><div class="service-content-grid"><article><span class="eyebrow dark">01</span><h2>Antes de cambiar tus ventanas</h2><p>Empieza por identificar qué te gustaría resolver: una distribución que ya no funciona, un ambiente oscuro, un sistema de apertura incómodo o la renovación de un espacio. En una vivienda existente también conviene revisar el estado del vano, las superficies de encuentro y las restricciones del edificio. Conocer estas condiciones permite conversar sobre una solución adecuada desde el inicio.</p></article><article><span class="eyebrow dark">02</span><h2>Apertura, luz y uso cotidiano</h2><p>El espacio disponible y la forma de circular por el ambiente ayudan a decidir cómo debe abrir una ventana. Considera si hay muebles cerca, cómo realizarás la limpieza y qué zonas necesitan ventilación. La elección del vidrio y del sistema debe responder a esas necesidades y a las condiciones de seguridad de cada proyecto; no existe una misma especificación para todos los ambientes.</p></article><article><span class="eyebrow dark">03</span><h2>Cómo preparar tu consulta</h2><p>Reúne una foto general del ambiente, una imagen cercana de la ventana actual y sus medidas aproximadas de ancho y alto. Explica qué deseas cambiar y si se trata de una casa o un departamento. Las medidas iniciales orientan la conversación: la solución definitiva necesita revisar las condiciones reales del proyecto.</p></article><article><span class="eyebrow dark">04</span><h2>Una propuesta que tenga sentido para tu hogar</h2><p>Para evaluar una alternativa interesa conocer el uso del ambiente, el tamaño del vano, la accesibilidad y el estado de las superficies existentes. Estos factores influyen en el alcance del trabajo. Si estás remodelando, comparte también los planos o referencias que tengas para coordinar el resultado con el resto del espacio.</p></article></div><aside class="service-answer"><h2>¿Atienden proyectos de ventanas en toda Lima?</h2><p>Sí. Vidrios VECA atiende proyectos en toda Lima, incluyendo casas, departamentos y espacios en remodelación.</p></aside></section><section class="service-next section-pad"><p class="eyebrow">SIGUE EXPLORANDO</p><h2>Una solución para<br>cada espacio.</h2><div class="related-services"><a href="/vidrios-edificios-lima/">Vidrios para edificios y proyectos en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a href="/vidrios-remodelaciones-lima/">Vidrios para remodelaciones en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></div><a class="button button-orange" href="/#contacto">Cuéntanos tu idea <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></section>',
  },
  "vidrios-edificios-lima": {
    title: "Vidrios para edificios y proyectos en Lima | Vidrios VECA",
    description:
      "Vidrios y ventanas para edificios, proyectos inmobiliarios y espacios de trabajo en Lima. Prepara tu proyecto con Vidrios VECA.",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://veca.com.pe/#organization",
          name: "Vidrios VECA",
          alternateName: "VECA",
          url: "https://veca.com.pe/",
          logo: {
            "@type": "ImageObject",
            url: "https://veca.com.pe/assets/logo.svg",
          },
          description:
            "Vidrios y ventanas para edificios, casas, departamentos y remodelaciones. Atención de proyectos en toda Lima.",
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
          telephone: "+51908917621",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+51908917621",
            contactType: "customer service",
            availableLanguage: "Spanish",
            url: "https://wa.me/51908917621",
            areaServed: "Lima, Perú",
          },
        },
        {
          "@type": "WebSite",
          "@id": "https://veca.com.pe/#website",
          url: "https://veca.com.pe/",
          name: "Vidrios VECA",
          alternateName: "VECA",
          inLanguage: "es-PE",
          publisher: { "@id": "https://veca.com.pe/#organization" },
        },
        {
          "@type": "WebPage",
          "@id": "https://veca.com.pe/vidrios-edificios-lima/#webpage",
          url: "https://veca.com.pe/vidrios-edificios-lima/",
          name: "Vidrios para edificios y proyectos en Lima | Vidrios VECA",
          isPartOf: { "@id": "https://veca.com.pe/#website" },
          inLanguage: "es-PE",
          about: {
            "@id": "https://veca.com.pe/vidrios-edificios-lima/#service",
          },
        },
        {
          "@type": "Service",
          "@id": "https://veca.com.pe/vidrios-edificios-lima/#service",
          name: "Vidrios para edificios y proyectos en Lima",
          url: "https://veca.com.pe/vidrios-edificios-lima/",
          description:
            "Vidrios y ventanas para edificios, proyectos inmobiliarios y espacios de trabajo en Lima. Prepara tu proyecto con Vidrios VECA.",
          provider: { "@id": "https://veca.com.pe/#organization" },
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Vidrios VECA",
              item: "https://veca.com.pe/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Vidrios para edificios y proyectos en Lima",
              item: "https://veca.com.pe/vidrios-edificios-lima/",
            },
          ],
        },
      ],
    },
    body: '<section class="service-hero section-pad"><nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="/">Vidrios VECA</a><span aria-hidden="true">/</span><span>Vidrios para edificios y proyectos en Lima</span></nav><p class="eyebrow">SOLUCIONES EN VIDRIO · LIMA, PERÚ</p><h1>Vidrios para edificios y proyectos en Lima</h1><p class="service-intro">Una visión arquitectónica necesita soluciones en vidrio pensadas desde el proyecto. Vidrios VECA acompaña la conversación sobre ventanas y elementos de vidrio para edificios, constructoras, inmobiliarias y arquitectos en Lima.</p><a class="button button-orange" href="/#contacto">Prepara tu proyecto <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a class="text-link service-whatsapp" href="https://wa.me/51908917621" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 8c0 4 4 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3-2 1Z"/></svg></a></section><figure class="service-cover"><img src="/assets/facade.webp" alt="Fachada arquitectónica de vidrio reflejando el cielo" width="1600" height="1067" fetchpriority="high"></figure><section class="service-editorial section-pad"><p class="eyebrow dark">VIDRIOS VECA · ATENCIÓN EN TODA LIMA</p><h2>El vidrio como parte de la arquitectura</h2><p>En un edificio, el vidrio participa en la iluminación, la relación con el entorno y la expresión de la fachada. La escala del proyecto hace importante ordenar la información desde el inicio. Planos, ubicación de los elementos y condiciones de uso permiten conversar sobre el alcance sin perder de vista las necesidades de cada ambiente.</p><div class="service-content-grid"><article><span class="eyebrow dark">01</span><h2>Qué compartir al iniciar un proyecto</h2><p>Los planos de arquitectura, el cuadro de vanos y las referencias del diseño son un buen punto de partida. Indica la ubicación de la obra, su etapa actual y qué elementos deseas evaluar. Si todavía no tienes todos los documentos, comparte la información disponible para identificar qué aspectos necesitan definición antes de avanzar.</p></article><article><span class="eyebrow dark">02</span><h2>Cada elemento tiene una función</h2><p>Una ventana de vivienda, una división interior y un elemento de fachada no se evalúan de la misma forma. Sus dimensiones, exposición, apoyos y uso determinan qué debe revisarse. La especificación del vidrio y del sistema requiere considerar el proyecto completo y sus exigencias técnicas, en coordinación con los profesionales responsables.</p></article><article><span class="eyebrow dark">03</span><h2>Coordinar con la obra</h2><p>El trabajo en un edificio requiere contemplar accesos, secuencia de instalación, encuentros con otros materiales y condiciones de los vanos. Definir estas dependencias ayuda a ordenar las decisiones. Es útil que el equipo del proyecto identifique qué superficies estarán listas y qué actividades de otras especialidades deben completarse antes.</p></article><article><span class="eyebrow dark">04</span><h2>De los planos a una conversación concreta</h2><p>Para preparar una consulta, reúne los planos vigentes, las medidas disponibles, la cantidad aproximada de elementos y una descripción de las zonas a intervenir. Comenta también las condiciones de acceso y la etapa de obra. Con ese contexto se puede definir qué información adicional hace falta y qué alternativas conviene estudiar.</p></article></div><aside class="service-answer"><h2>¿Con qué tipos de proyectos trabaja Vidrios VECA?</h2><p>Trabajamos con consultas para edificios, proyectos inmobiliarios y espacios de trabajo en Lima, además de casas, departamentos y remodelaciones.</p></aside></section><section class="service-next section-pad"><p class="eyebrow">SIGUE EXPLORANDO</p><h2>Una solución para<br>cada espacio.</h2><div class="related-services"><a href="/ventanas-vidrio-lima/">Ventanas de vidrio en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a href="/vidrios-remodelaciones-lima/">Vidrios para remodelaciones en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></div><a class="button button-orange" href="/#contacto">Cuéntanos tu idea <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></section>',
  },
  "vidrios-remodelaciones-lima": {
    title: "Vidrios para remodelaciones en Lima | Vidrios VECA",
    description:
      "Renueva ventanas y elementos de vidrio en casas, departamentos y ambientes existentes en Lima. Explora tu remodelación con Vidrios VECA.",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://veca.com.pe/#organization",
          name: "Vidrios VECA",
          alternateName: "VECA",
          url: "https://veca.com.pe/",
          logo: {
            "@type": "ImageObject",
            url: "https://veca.com.pe/assets/logo.svg",
          },
          description:
            "Vidrios y ventanas para edificios, casas, departamentos y remodelaciones. Atención de proyectos en toda Lima.",
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
          telephone: "+51908917621",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+51908917621",
            contactType: "customer service",
            availableLanguage: "Spanish",
            url: "https://wa.me/51908917621",
            areaServed: "Lima, Perú",
          },
        },
        {
          "@type": "WebSite",
          "@id": "https://veca.com.pe/#website",
          url: "https://veca.com.pe/",
          name: "Vidrios VECA",
          alternateName: "VECA",
          inLanguage: "es-PE",
          publisher: { "@id": "https://veca.com.pe/#organization" },
        },
        {
          "@type": "WebPage",
          "@id": "https://veca.com.pe/vidrios-remodelaciones-lima/#webpage",
          url: "https://veca.com.pe/vidrios-remodelaciones-lima/",
          name: "Vidrios para remodelaciones en Lima | Vidrios VECA",
          isPartOf: { "@id": "https://veca.com.pe/#website" },
          inLanguage: "es-PE",
          about: {
            "@id": "https://veca.com.pe/vidrios-remodelaciones-lima/#service",
          },
        },
        {
          "@type": "Service",
          "@id": "https://veca.com.pe/vidrios-remodelaciones-lima/#service",
          name: "Vidrios para remodelaciones en Lima",
          url: "https://veca.com.pe/vidrios-remodelaciones-lima/",
          description:
            "Renueva ventanas y elementos de vidrio en casas, departamentos y ambientes existentes en Lima. Explora tu remodelación con Vidrios VECA.",
          provider: { "@id": "https://veca.com.pe/#organization" },
          areaServed: { "@type": "AdministrativeArea", name: "Lima, Perú" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Vidrios VECA",
              item: "https://veca.com.pe/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Vidrios para remodelaciones en Lima",
              item: "https://veca.com.pe/vidrios-remodelaciones-lima/",
            },
          ],
        },
      ],
    },
    body: '<section class="service-hero section-pad"><nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="/">Vidrios VECA</a><span aria-hidden="true">/</span><span>Vidrios para remodelaciones en Lima</span></nav><p class="eyebrow">SOLUCIONES EN VIDRIO · LIMA, PERÚ</p><h1>Vidrios para remodelaciones en Lima</h1><p class="service-intro">Renovar un ambiente también puede cambiar la forma en que entra la luz. En Vidrios VECA exploramos soluciones en vidrio para transformar espacios existentes en Lima, considerando lo que ya está construido y lo que quieres mejorar.</p><a class="button button-orange" href="/#contacto">Prepara tu proyecto <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a class="text-link service-whatsapp" href="https://wa.me/51908917621" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 8c0 4 4 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3-2 1Z"/></svg></a></section><figure class="service-cover"><img src="/assets/detail.webp" alt="Detalle de vidrio en una fachada arquitectónica" width="1600" height="1067" fetchpriority="high"></figure><section class="service-editorial section-pad"><p class="eyebrow dark">VIDRIOS VECA · ATENCIÓN EN TODA LIMA</p><h2>Una nueva perspectiva para lo que ya construiste</h2><p>Una remodelación empieza por entender el espacio actual. Antes de elegir una solución, conviene revisar qué funciona, qué deseas conservar y qué cambios necesitas. Reemplazar una ventana o incorporar un elemento de vidrio puede formar parte de una renovación mayor o de una intervención puntual.</p><div class="service-content-grid"><article><span class="eyebrow dark">01</span><h2>Revisar el ambiente existente</h2><p>Observa el estado de las ventanas, los marcos y las superficies cercanas. Una foto general ayuda a entender cómo se relaciona el elemento con el resto del espacio. Indica si hay humedad visible, acabados que se deben preservar o limitaciones de acceso. Esta información orienta las preguntas iniciales y evita elegir una alternativa sin conocer el contexto.</p></article><article><span class="eyebrow dark">02</span><h2>Definir qué quieres mejorar</h2><p>Piensa en el uso diario del ambiente: iluminación, ventilación, distribución y relación con el exterior. Separar las necesidades de las referencias estéticas permite explicar mejor tu idea. Las imágenes de inspiración pueden servir como guía, pero la solución se debe adaptar a las dimensiones y condiciones reales de tu vivienda o espacio de trabajo.</p></article><article><span class="eyebrow dark">03</span><h2>Coordinar la renovación</h2><p>Cuando intervienen pintura, albañilería u otros acabados, importa definir el orden de trabajo. También conviene considerar cómo se accederá al ambiente y qué elementos necesitan protección. Si se trata de un departamento, revisa las condiciones de la administración del edificio antes de plantear cambios que afecten su exterior.</p></article><article><span class="eyebrow dark">04</span><h2>Qué información preparar</h2><p>Comparte fotos del ambiente, medidas aproximadas, ubicación del proyecto en Lima y una descripción del cambio que buscas. Indica si se reemplazará un elemento existente o si se está creando un nuevo espacio. Un resumen claro permite iniciar la conversación y determinar qué aspectos requieren una evaluación más detallada.</p></article></div><aside class="service-answer"><h2>¿Puedo consultar por una remodelación pequeña?</h2><p>Sí. Puedes preparar tu consulta para un cambio puntual de ventanas o elementos de vidrio, o para una remodelación de mayor alcance en Lima.</p></aside></section><section class="service-next section-pad"><p class="eyebrow">SIGUE EXPLORANDO</p><h2>Una solución para<br>cada espacio.</h2><div class="related-services"><a href="/ventanas-vidrio-lima/">Ventanas de vidrio en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a href="/vidrios-edificios-lima/">Vidrios para edificios y proyectos en Lima <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></div><a class="button button-orange" href="/#contacto">Cuéntanos tu idea <span aria-hidden="true"><svg class="icon icon-arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a></section>',
  },
};
