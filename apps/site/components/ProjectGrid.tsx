import { CATEGORIES, type Project } from "@veca/content";
export function ProjectGrid({ items }: { items: Project[] }) {
  return (
    <div className="public-project-grid">
      {items.map((project) => {
        const cover = project.images.find((i) => i.id === project.coverId);
        return (
          <article className="public-project-card" key={project.id}>
            <a
              href={`/proyectos/${project.slug}/`}
              className="public-project-photo"
              aria-label={`Ver proyecto: ${project.title}`}
            >
              {cover && (
                <img
                  src={cover.url}
                  alt={cover.alt}
                  width={cover.width}
                  height={cover.height}
                  loading="lazy"
                  style={{
                    objectPosition: `${cover.positionX}% ${cover.positionY}%`,
                  }}
                />
              )}
              <span aria-hidden="true">↗</span>
            </a>
            <div className="public-project-info">
              <p>
                {CATEGORIES.find((c) => c.id === project.category)?.name}{" "}
                <span> / {project.location}</span>
              </p>
              <h3>
                <a href={`/proyectos/${project.slug}/`}>{project.title}</a>
              </h3>
              <p className="public-project-excerpt">{project.excerpt}</p>
              <a
                className="project-read-link"
                href={`/proyectos/${project.slug}/`}
              >
                Conoce el proyecto <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
