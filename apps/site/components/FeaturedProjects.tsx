import type { Project } from "@veca/content";
import { CATEGORIES } from "@veca/content";
import { ProjectGrid } from "./ProjectGrid";
export function FeaturedProjects({ items }: { items: Project[] }) {
  return (
    <section className="project-showcase section-pad" id="proyectos">
      <div className="project-showcase-heading">
        <div>
          <p className="eyebrow">Proyectos VECA</p>
          <h2>
            Cada proyecto,
            <br />
            <span>otra perspectiva.</span>
          </h2>
        </div>
        <div>
          <p>
            Descubre cómo el vidrio puede dar forma a distintas maneras de
            construir, habitar y renovar.
          </p>
          <a className="showcase-action" href="/proyectos/">
            {items.length ? "Explorar proyectos" : "Entra a la galería"}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      {!!items.length && <ProjectGrid items={items.slice(0, 3)} />}
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
