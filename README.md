# Vidrios VECA

Sitio comercial estático de Vidrios VECA, con atención en toda Lima. Publicación principal: https://veca.com.pe/.

## Contenido y SEO

- Portada con marca, servicios, información de la empresa y preguntas frecuentes.
- Guías de ventanas, edificios y remodelaciones con URLs independientes.
- Canonical, metadatos sociales, datos estructurados Organization/WebSite/WebPage/Service y breadcrumbs.
- robots.txt y sitemap.xml con las cuatro páginas públicas.
- Redirección permanente de www y del hostname anterior al dominio principal.
- Sin direcciones, teléfonos, redes, reseñas ni certificaciones inventadas.

## Ejecución

Dockerfile de producción con Nginx en puerto 80 y endpoint /health. Configurar explícitamente el puerto 80 en Nexode. El contenedor sirve el contenido sin necesidad de JavaScript para leer los servicios.

## Pendiente interno

WhatsApp Business confirmado: +51 908 917 621, enlace https://wa.me/51908917621. El botón verde fijo abre el chat directamente, sin texto prellenado ni automatizaciones. El formulario prepara un resumen local y permite copiarlo; funciona de forma independiente de WhatsApp. No guarda leads en una base de datos; el backend se incorporará en una siguiente etapa. No mostrar confirmaciones de envío hasta que exista y responda la integración real.

Para seguimiento de indexación: verificar el dominio en Search Console, enviar sitemap.xml e inspeccionar las URLs. Un sitemap y metadatos correctos no garantizan indexación ni posiciones.
