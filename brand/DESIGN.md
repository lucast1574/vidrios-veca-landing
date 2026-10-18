# VECA · Identidad visual

Actualizado: 2026-10-18. Leer junto con `VOICE.md` antes de modificar interfaces de VECA.

## Identidad y fuentes

Vidrios VECA: empresa de vidrio y construcción, sede en San Luis y atención en Lima. El panel debe sentirse claro, profesional y útil para el trabajo diario. No modificar el símbolo ni inventar antigüedad, certificaciones o proyectos.

- Naranja original: **#e74927**, extraído de `apps/panel/public/assets/logo.svg`.
- Azul de la marca: **#242641**, presente en el favicon y las tarjetas del perfil.
- Tipografía del panel: **Manrope**, archivo local `apps/panel/public/assets/manrope.ttf`, pesos 200–800; respaldo Arial, sans-serif.
- Implementación de colores del panel: `apps/panel/src/theme/theme.css`. Los colores de marca se referencian con variables, no se duplican en componentes.

## Paleta del panel

| Función / token                              | Claro   | Oscuro  |
| -------------------------------------------- | ------- | ------- |
| Naranja de marca `--panel-brand`             | #e74927 | #e74927 |
| Naranja para texto `--panel-accent`          | #c34427 | #ff9678 |
| Acento suave `--panel-accent-soft`           | #f9e9e2 | #402d2b |
| Superficie destacada `--panel-brand-surface` | #fff1e9 | #342723 |
| Borde destacado `--panel-brand-edge`         | #e8b1a0 | #80503d |
| Fondo `--panel-canvas`                       | #f5f4f0 | #151722 |
| Tarjeta `--panel-surface`                    | #ffffff | #202331 |
| Fondo suave `--panel-soft`                   | #faf9f6 | #1a1d29 |
| Superficie elevada `--panel-raised`          | #eeede8 | #2a2e3e |
| Texto principal `--panel-ink`                | #242641 | #eeeef5 |
| Texto secundario `--panel-secondary`         | #646879 | #b5b9ca |
| Texto tenue `--panel-muted`                  | #858894 | #9499af |
| Separación `--panel-edge`                    | #e6e4de | #35394b |

El naranja del logo se conserva en ambos temas. Las variantes de texto existen para mantener contraste; no reemplazan el logo. Comprobar pares reales de texto/fondo al cambiar la paleta. El texto secundario debe seguir siendo legible.

## Aplicación

- Naranja visible en la navegación activa, iconos de indicadores, enlaces de acción y encabezados de sección. El bloque de avance comercial usa un borde superior naranja.
- La tarjeta de proyectos publicados usa una superficie naranja suave en ambos temas. Identificarla por su función, no por su posición en la grilla: las tarjetas dependen de permisos.
- El resto de las superficies conserva fondos neutros; no convertir todo el panel en naranja.
- Las etapas conservan sus colores informativos existentes: #a4afa7, #cbb481, #7b9baf, #e77b51 y #7a9a76. Los estados de éxito, alerta o error no se convierten todos en naranja.
- El tema oscuro debe cubrir fondo, borde, etiquetas, cifras, hover, foco y estados vacíos. No combinar textos claros con tarjetas blancas.

## Patrones existentes

- Sidebar: 264 px, contraída 88 px; drawer en móvil. Acceso a Mi perfil al pie.
- Dashboard: indicadores en cuatro columnas, dos a 1150 px y una a 400 px. Avance en cinco columnas, dos a 760 px.
- Separaciones habituales: 8, 12, 16, 20, 24, 28, 32 y 40 px. Conservar los componentes existentes y el orden de lectura.
- Tarjetas: radios de 12–18 px, bordes discretos. Iconos Lucide coherentes.
- Títulos del dashboard: `clamp(36px, 4vw, 58px)`; títulos de tarjeta 18 px; cuerpo 12–14 px. Conservar la jerarquía existente.
- Animación funcional breve, con respeto a movimiento reducido.

## Reglas obligatorias de Lucas

Sin focus outlines, focus rings ni sombras que simulen anillos. Mantener teclado y foco mediante fondo, color o subrayado. Selectores y dropdowns personalizados y reutilizables. Cerrar sesión únicamente en la página de perfil, nunca en la sidebar.

## Verificación

Revisar ambos temas en el dashboard real, con ancho de escritorio y móvil. Verificar el resultado publicado además del build. Una skill de branding no sustituye la validación de CSS calculado y contraste.

Sin emojis ni flechas Unicode decorativas en móvil o escritorio. Usar `packages/ui/src/Icon.tsx` o SVG del mismo sistema visual, también en tarjetas públicas y formularios.
