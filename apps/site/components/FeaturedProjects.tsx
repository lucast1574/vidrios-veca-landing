import type { Project } from "@veca/content";
import { CATEGORIES } from "@veca/content";
import { ProjectGrid } from "./ProjectGrid";
export function FeaturedProjects({ items }: { items: Project[] }) {
  if (!items.length) return null;
  return (
    <section className="project-showcase section-pad" id="proyectos">
      <div className="project-showcase-heading">
        <div>
          <p className="eyebrow">
            <span className="section-number">01</span> PROYECTOS VECA
          </p>
          <h2>
            Del primer detalle.
            <br />
            <span>A una nueva perspectiva.</span>
          </h2>
        </div>
        <div>
          <p>
            Descubre cómo el vidrio puede dar forma a distintas maneras de
            construir, habitar y renovar.
          </p>
          <a className="text-link" href="/proyectos/">
            Explorar proyectos <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <ProjectGrid items={items.slice(0, 6)} />
      <div className="project-category-strip">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`/proyectos/categoria/${c.id}/`}>
            <span>{c.name}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
