# Vidrios VECA · Plataforma editorial

Sitio público, panel privado y API para publicar proyectos reales de Vidrios VECA. TypeScript, NestJS, Next.js, React/Tiptap, MongoDB y almacenamiento S3 compatible.

## Estructura

- `apps/api/src/auth`: administrador, activación de un solo uso y sesiones revocables.
- `apps/api/src/projects`: controladores separados públicos/privados, reglas editoriales y repositorio MongoDB.
- `apps/api/src/media`: validación/transformación de fotos y adaptador S3.
- `apps/api/src/database`: conexión e índices, incluido vencimiento de sesiones.
- `apps/api/src/common`: configuración y validación transversal.
- `apps/panel/src/features/editor`: editor, biblioteca de imágenes y vista previa.
- `apps/panel/src/components`: controles reutilizables.
- `apps/site`: páginas públicas renderizadas en servidor, búsqueda y SEO.
- `packages/content`: contrato validado, taxonomía, tipos y generación de SEO.
- `packages/ui`: artículo compartido entre vista previa y publicación; renderiza un documento estructurado sin HTML arbitrario.

Los HTML originales y sus activos quedan como fuente de la landing existente. El sitio Next conserva las secciones comerciales y las guías de servicios; los fragmentos confiables están en `apps/site/lib/legacy.ts` y `services.ts`. El contenido editable nunca utiliza ese mecanismo de HTML.

## Flujo editorial

1. Guardar crea un borrador privado con una URL estable derivada del título y un sufijo para evitar colisiones.
2. Añadir fotos a la biblioteca; elegir portada, descripción, pie y punto de encuadre. Se pueden insertar varias fotos en cualquier parte del texto, a izquierda/derecha/ancho completo.
3. Elegir categoría y hasta ocho etiquetas predefinidas; seleccionar posición de portada y prioridad de los destacados.
4. Vista previa muestra los cambios actuales con el mismo componente de la web, incluso antes de guardarlos.
5. Publicar exige portada, descripciones accesibles y una historia de al menos 60 caracteres. Crea una copia pública separada del borrador.
6. Guardar cambios posteriores mantiene la publicación anterior. Publicar cambios sustituye esa copia de forma atómica.
7. Retirar elimina su disponibilidad pública, del buscador y del sitemap; conserva el borrador.

El control optimista de versión impide que dos pestañas se sobrescriban silenciosamente. El panel no tiene enlace desde el sitio público; esta separación no sustituye la autenticación.

## Acceso

El registro admite cualquier correo. Email y contraseña se validan con un código de seis dígitos, válido durante diez minutos y hasta cinco intentos; cada reenvío exige un minuto. Los códigos se guardan como hashes Argon2 y son de un solo uso. Recuperar la contraseña invalida las sesiones anteriores. El acceso con Google verifica el ID token de Firebase en la API (proveedor, proyecto y correo verificado).

Los correos del dominio exacto `veca.com.pe`, una vez verificados, reciben Gerencia automáticamente. Los externos quedan pendientes hasta que un administrador los aprueba y asigna un rol desde Usuarios. Suspender o rechazar una cuenta no se revierte al entrar de nuevo con Google. Los permisos se comprueban en la API y se reflejan en el sidebar; cambiar de rol afecta también a sesiones abiertas.

| Rol | Módulos actuales |
|---|---|
| Administrador | Dashboard, proyectos, leads, inventario y usuarios |
| Gerencia | Dashboard, proyectos, leads e inventario |
| Comercial | Dashboard, proyectos y leads |
| Operaciones | Dashboard, leads e inventario |
| Almacén | Dashboard e inventario |
| Contabilidad / Consulta | Dashboard; preparados para futuros módulos específicos |

El dashboard muestra datos reales según los permisos, sin exponer contactos, obras ni materiales a roles que no pueden consultarlos. El modal reutilizable de acceso describe los roles y los módulos concedidos. Los cambios quedan auditados y usan control de revisión para evitar sobrescrituras; un administrador no puede modificar su propio acceso.

La cuenta heredada `admin` sigue funcionando. El bootstrap de un solo uso con `ADMIN_BOOTSTRAP_KEY` se conserva para instalaciones nuevas. Para invitar un administrador corporativo puede ejecutarse `scripts/provision-user.mjs` en el entorno privado de la API con `PROVISION_EMAIL`, `PROVISION_NAME` y `PROVISION_ROLE`: genera una contraseña que imprime una sola vez, no sobrescribe cuentas existentes y exige verificar la titularidad con código o Google antes de activar el acceso. Ninguna contraseña/token se guarda en el repositorio o archivos de entrega.

Contraseñas Argon2, sesión opaca en cookie HttpOnly/Secure/SameSite, token CSRF y comprobación de Origin en escrituras. No hay tokens de sesión en localStorage. Sesiones con expiración en MongoDB y cierre revocable.

### Firebase y correo transaccional

Crear una aplicación web Firebase y habilitar únicamente el proveedor Google. Autorizar el host exacto del panel. Configurar en la API `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN` y `FIREBASE_APP_ID`. Son valores públicos del SDK; no se necesita distribuir una cuenta de servicio. La contraseña y los códigos de la aplicación se gestionan en MongoDB, no en Firebase Email/Password.

Resend: verificar el dominio mediante sus registros DNS sin alterar los MX/SPF/DKIM de Google Workspace. Crear una clave con **Sending access** limitada al dominio VECA y guardarla solo en `RESEND_API_KEY` del backend. `MAIL_FROM` define el remitente corporativo y `MAIL_NOTIFY_TO` el destinatario interno. El plan gratuito consultado ofrece 3.000 mensajes/mes y 100/día; el proveedor puede modificar esos límites. SMTP es una alternativa mediante `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.

Los componentes React Email comparten logo, colores y estructura. Se envían códigos de acceso/recuperación, solicitudes y cambios de acceso, confirmaciones de consulta web, cambios de etapa comunicables y avisos internos de publicación. Las notificaciones usan una cola MongoDB con reintentos y claves de idempotencia; los códigos se entregan directamente y nunca se guardan en texto plano en esa cola. `EMAIL_TEST_ENDPOINT` solo se utiliza con `NODE_ENV=test` para capturar mensajes localmente. No configurar ese destino en producción.

## Imágenes y datos

Solo la API tiene credenciales S3. Se aceptan JPG/PNG/WebP/AVIF de hasta 12 MB y 40 MP, se decodifican, se elimina metadata y se normalizan a WebP de hasta 2400px. Se rechazan SVG y documentos activos. Los originales locales no se conservan. Las fotos de borradores requieren una cuenta activa con permiso de proyectos; las fotos vinculadas a una publicación son legibles públicamente. No hay credenciales, ACL públicas ni enlaces directos a objetos privados en el frontend.

No se crean proyectos, testimonios, clientes, certificaciones ni antigüedades ficticias. La galería comercial mantiene sus fotos de arquitectura y créditos en `ASSETS.md`; no se presenta como un portafolio de trabajos ejecutados. Las pruebas usan una base local aislada y no se siembran en producción.

## SEO

Cada publicación tiene HTML renderizado en servidor, título, descripción derivada de resumen/contenido, canonical estable, Open Graph, Twitter y BlogPosting con fechas reales y fotografías. Proyectos y categorías cuentan con URLs navegables; las búsquedas tienen noindex y no entran al sitemap. El sitemap consulta solo publicaciones vigentes. El panel declara noindex en HTML, cabeceras HTTP y robots. Indexación y posiciones finales dependen de los buscadores.

## Construcción y publicación

`npm ci`, `npm run typecheck`, `npm test`, `npm run build`.

El Dockerfile raíz construye los tres servicios y selecciona el proceso con `APP_ROLE`. Cada compute ejecuta un único servidor; comparten contrato y componentes desde el mismo commit.

| Servicio | APP_ROLE | Puerto interno | Host |
|---|---|---|---|
| API | api | 4000 | api.veca.com.pe |
| Panel | panel | 3000 | panel.veca.com.pe |
| Sitio | site (predeterminado) | 80 | veca.com.pe |

API: `MONGODB_URI` (enlazar con Nexode), `MONGODB_DATABASE` opcional (si se omite usa la base de la URI), `PANEL_ORIGIN`, `SITE_ORIGIN`, `PUBLIC_API_URL`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PORT=4000`. Enlazar almacenamiento desde Nexode; no copiar credenciales a código.

Panel: `APP_ROLE=panel`, `PORT=3000`, `PUBLIC_API_URL=https://api.veca.com.pe`. Su configuración pública se sirve por `/config.js` con no-store. No necesita secretos.

Sitio: `APP_ROLE=site`, `PORT=80`, `API_INTERNAL_URL` o `API_URL` con la URL de la API. Sin secretos de base de datos o S3. Mantener las redirecciones de www y del hostname anterior al dominio canónico en el proxy.

La landing antigua debe permanecer en producción hasta validar API, panel y el nuevo sitio. Conservar sus verificaciones DNS y de Search Console. Los subdominios requieren asociación a su compute y certificado HTTPS además del DNS wildcard existente.

## Pruebas

`npm test`: validación de documentos/URLs, taxonomía, metadatos y render seguro.

`node scripts/local-qa.mjs`: MongoDB 8 efímero y S3rver local, API 4400, panel 3300 y sitio 3380. Crea únicamente la cuenta de prueba local definida en ese script. No usar sus datos en producción.

`node tests/api-flow.mjs`: prueba la composición real HTTP/MongoDB/S3 compatible: sesión, CSRF, rechazo de archivos activos, privacidad de borradores/fotos, publicación, guardado concurrente, edición sin alterar lo público, búsqueda, SEO HTML, sitemap y retirada. Después validar la UI en navegador a 320, 390, tablet y escritorio.

Si el proveedor pausa las nuevas activaciones S3, la API y el panel siguen permitiendo autenticación y borradores de texto. El panel indica el estado interno y la publicación exige fotos válidas: no se simula almacenamiento ni se usa otro bucket. `/health/ready` verifica MongoDB y S3; `/health` comprueba el proceso y MongoDB. Tras enlazar S3 desde Nexode se debe redeplegar la API.

## Almacenamiento temporal compartido

Si se utiliza temporalmente un bucket existente de otra cuenta autorizada, la API debe recibir una credencial independiente limitada a `veca/*`. Los objetos del proyecto se guardan bajo `veca/projects/`. La comprobación de disponibilidad usa `GetBucketLocation`, que permite verificar el bucket sin conceder acceso a listar archivos ajenos. La credencial principal y las de otras aplicaciones no se modifican. Al migrar al bucket propio se deben copiar y verificar los objetos antes de cambiar las variables y revocar la credencial temporal.

### Architectural landing

The homepage uses `VecaLanding` and the components in `apps/site/components/landing/`.
Solution content, categories of space and contact copy live in `landing/content.ts`;
`SolutionExplorer` supports touch, keyboard arrows, Home and End. Styling is scoped
under `.ve-home` in `app/landing.css` so article/service pages retain their layout.
The opening, image changes and glass treatment use CSS transforms/opacity and honor
`prefers-reduced-motion`. Native scrolling is preserved. No animation library is added.
Featured publications still come from the existing public API and shared project grid;
when there are no published features, that section stays hidden. Inspiration images
are not presented as completed VECA projects. The contact form saves a real consultation through the public API, captures name,
email and phone, and assigns predefined opportunity tags on the server. WhatsApp
remains an additional direct contact channel.

The landing and editorial panel share the custom `packages/ui/src/Select.tsx`
combobox and `select.css`. Theme it through `--select-*` variables; it supports
arrow keys, Home/End, typeahead, Escape, Tab and outside-click dismissal. Contact
validation checks the selected space before preparing the WhatsApp link. Focus
feedback uses color/background/contrast changes; focus outlines and rings are
intentionally excluded from the public site and panel.

`node tests/access-flow.mjs`: verifica códigos y correo de prueba, aprobación externa, dominio corporativo exacto, límites de roles en sesiones abiertas, privacidad de fotos, recuperación, suspensión y control de concurrencia de códigos. Ejecutar después del arranque limpio de QA; los límites de intentos están activos también durante estas pruebas.
