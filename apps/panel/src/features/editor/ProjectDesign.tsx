import { Monitor, Smartphone, Check } from "lucide-react";
import {
  PAGE_LAYOUTS,
  type ProjectInput,
  type PageLayout,
} from "@veca/content";
import { ProjectArticle, ProjectSolutionCard } from "@veca/ui";
export function ProjectDesign({
  draft,
  size,
  onSize,
  onLayout,
}: {
  draft: ProjectInput;
  size: "desktop" | "mobile";
  onSize: (size: "desktop" | "mobile") => void;
  onLayout: (layout: PageLayout) => void;
}) {
  return (
    <section className="project-design">
      <header className="editor-step-heading">
        <p>02 / DISEÑO Y VISTA PREVIA</p>
        <h1>Dale forma a la historia.</h1>
        <span>
          Elige un diseño para toda la página. Tus secciones mantienen su orden
          y las fotos se combinan automáticamente.
        </span>
      </header>
      <div
        className="layout-options"
        role="group"
        aria-label="Diseño de la página"
      >
        {PAGE_LAYOUTS.map((layout) => (
          <button
            type="button"
            key={layout.id}
            aria-pressed={draft.pageLayout === layout.id}
            onClick={() => onLayout(layout.id)}
          >
            <div className={`layout-mini mini-${layout.id}`} aria-hidden="true">
              {[0, 1].map((i) => (
                <div key={i}>
                  <span className="mini-picture" />
                  <span className="mini-copy">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              ))}
            </div>
            <strong>
              {layout.name}
              {draft.pageLayout === layout.id && <Check size={16} />}
            </strong>
            <small>{layout.description}</small>
          </button>
        ))}
      </div>
      {draft.pageLayout === "legacy" && (
        <p className="story-hint">
          Este proyecto conserva su diseño original. Al elegir un diseño nuevo,
          organizaremos el contenido actual en una sección para que puedas
          seguir editándolo.
        </p>
      )}
      <div className="preview-toolbar">
        <div>
          <h2>Así se verá en la web de VECA</h2>
          <p>La vista previa incluye los cambios sin guardar.</p>
        </div>
        <div
          className="segment"
          role="group"
          aria-label="Tamaño de la vista previa"
        >
          <button
            type="button"
            aria-label="Vista de escritorio"
            aria-pressed={size === "desktop"}
            onClick={() => onSize("desktop")}
          >
            <Monitor size={18} />
          </button>
          <button
            type="button"
            aria-label="Vista de móvil"
            aria-pressed={size === "mobile"}
            onClick={() => onSize("mobile")}
          >
            <Smartphone size={18} />
          </button>
        </div>
      </div>
      {draft.solutionSlot && (
        <section className={`solution-home-preview preview-${size}`}>
          <h2>También en la página principal</h2>
          <p>Así se verá en la pestaña de soluciones que elegiste.</p>
          <ProjectSolutionCard project={draft} />
        </section>
      )}
      <div className={`preview-frame preview-${size}`}>
        <div className="preview-brand">
          <img src="/assets/logo.svg" alt="Vidrios VECA" />
          <span>PROYECTOS / VIDRIOS VECA</span>
        </div>
        <ProjectArticle project={draft} />
        <div className="preview-end">
          ¿Damos forma a tu próximo proyecto?<span>Vidrios VECA · Lima</span>
        </div>
      </div>
    </section>
  );
}
