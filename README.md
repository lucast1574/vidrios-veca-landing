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

Usuario inicial: `admin`. No existe contraseña universal ni registro público. Provisionar con `POST /auth/bootstrap` usando `ADMIN_BOOTSTRAP_KEY` de entropía alta desde un entorno de confianza. Devuelve un enlace de activación de un solo uso con vigencia de 24 horas. El cliente establece su propia contraseña (mínimo 12 caracteres); el token se consume. Si ya existe administrador no permite reemplazarlo. Alternativa operativa: `node scripts/bootstrap-admin.mjs` en el entorno privado de la API (enlace de 24 horas). Ningún token/contraseña debe guardarse en el repositorio, archivos de entrega ni registros de despliegue.

Contraseñas Argon2, sesión opaca en cookie HttpOnly/Secure/SameSite, token CSRF y comprobación de Origin en escrituras autenticadas. No hay tokens de sesión en localStorage. Sesiones con expiración en MongoDB y cierre de sesión revocable.

## Imágenes y datos

Solo la API tiene credenciales S3. Se aceptan JPG/PNG/WebP/AVIF de hasta 12 MB y 40 MP, se decodifican, se elimina metadata y se normalizan a WebP de hasta 2400px. Se rechazan SVG y documentos activos. Los originales locales no se conservan. Las fotos de borradores requieren sesión; las fotos vinculadas a una publicación son legibles públicamente. No hay credenciales, ACL públicas ni enlaces directos a objetos privados en el frontend.

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
