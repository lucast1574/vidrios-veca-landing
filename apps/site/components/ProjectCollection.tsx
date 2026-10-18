import { Icon } from "@veca/ui/src/Icon";
import { CATEGORIES, TAGS } from "@veca/content";
import { projects } from "../lib/api";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { ProjectGrid } from "./ProjectGrid";
export async function ProjectCollection({
  category = "",
  q = "",
  tag = "",
  page = "1",
}: {
  category?: string;
  q?: string;
  tag?: string;
  page?: string;
}) {
  q = typeof q === "string" ? q.slice(0, 120) : "";
  tag = TAGS.some((value) => value === tag) ? tag : "";
  const taxonomy = CATEGORIES.find((c) => c.id === category),
    base = category ? `/proyectos/categoria/${category}/` : "/proyectos/";
  const href = (path: string, values: Record<string, string>) => {
    const query = new URLSearchParams(
      Object.entries(values).filter(([, value]) => !!value),
    );
    return path + (query.size ? "?" + query.toString() : "");
  };
  const result = await projects({
    category,
    q,
    tag,
    page: /^[1-9]\d{0,3}$/.test(page) ? page : "1",
  }).catch(() => null);
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="project-collection">
        <header className="collection-heading section-pad">
          <a
            className="collection-brand"
            href="/"
            aria-label="Vidrios VECA, inicio"
          >
            <img src="/assets/favicon.svg" alt="" width="42" height="42" />
            <span>VIDRIOS VECA</span>
          </a>
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <a href="/">Inicio</a>
            <span>/</span>
            <a href="/proyectos/">Proyectos</a>
            {taxonomy && (
              <>
                <span>/</span>
                <span>{taxonomy.name}</span>
              </>
            )}
          </nav>
          <p className="eyebrow">NUESTRO TRABAJO EN VIDRIO</p>
          <h1>
            {taxonomy ? (
              taxonomy.name
            ) : (
              <>
                Espacios que cuentan <span>lo que hacemos.</span>
              </>
            )}
          </h1>
          <p>
            {taxonomy
              ? taxonomy.description
              : "Explora los proyectos de VECA. Encuentra una idea por su nombre, el espacio o el material que transforma."}
          </p>
        </header>
        <section
          className="project-browser section-pad"
          aria-label="Galería de proyectos"
        >
          <div className="collection-tools">
            <form className="project-search" action={base}>
              <label htmlFor="project-search">Encuentra tu inspiración</label>
              <div>
                <input
                  type="search"
                  id="project-search"
                  name="q"
                  maxLength={120}
                  defaultValue={q}
                  placeholder="Busca por nombre, material o distrito…"
                />
                <button type="submit" aria-label="Buscar proyectos">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                  </svg>
                  <span>Buscar</span>
                </button>
              </div>
              {tag && <input type="hidden" name="tag" value={tag} />}
            </form>
            <nav
              className="category-filters"
              aria-label="Categorías de proyectos"
            >
              <a
                href={href("/proyectos/", { q, tag })}
                aria-current={!category ? "page" : undefined}
              >
                Todos los proyectos
              </a>
              {CATEGORIES.map((c) => (
                <a
                  key={c.id}
                  href={href(`/proyectos/categoria/${c.id}/`, { q, tag })}
                  aria-current={category === c.id ? "page" : undefined}
                >
                  {c.name}
                </a>
              ))}
            </nav>
            <nav
              className="project-tag-filters"
              aria-label="Filtrar proyectos por etiqueta"
            >
              <span>Por material o solución</span>
              <a
                href={href(base, { q })}
                aria-current={!tag ? "page" : undefined}
              >
                Todas
              </a>
              {TAGS.map((value) => (
                <a
                  key={value}
                  href={href(base, { q, tag: value })}
                  aria-current={tag === value ? "page" : undefined}
                >
                  {value}
                </a>
              ))}
            </nav>
          </div>
          <div className="collection-results-head">
            <p className="collection-count">
              {result
                ? `${result.total} ${result.total === 1 ? "proyecto" : "proyectos"}`
                : "Proyectos VECA"}
              {q && ` para «${q}»`}
              {tag && ` · ${tag}`}
            </p>
            {(q || tag || category) && (
              <a href="/proyectos/">
                Limpiar filtros <Icon name="arrow-up-right" />
              </a>
            )}
          </div>
          {result?.items.length ? (
            <>
              <ProjectGrid items={result.items} />
              <nav className="pagination" aria-label="Páginas de proyectos">
                {result.page > 1 && (
                  <a
                    href={href(base, { q, tag, page: String(result.page - 1) })}
                  >
                    ← Anterior
                  </a>
                )}
                {result.page * result.pageSize < result.total && (
                  <a
                    href={href(base, { q, tag, page: String(result.page + 1) })}
                  >
                    Más proyectos →
                  </a>
                )}
              </nav>
            </>
          ) : (
            <div className="collection-empty">
              <p className="eyebrow">UNA NUEVA PERSPECTIVA</p>
              <h2>
                {q || tag
                  ? "Probemos otra mirada."
                  : "Imagina lo que podemos transformar."}
              </h2>
              <p>
                {q || tag
                  ? "No encontramos proyectos con esos filtros. Cambia el nombre, el material o la categoría para seguir explorando."
                  : "Una ventana, un nuevo ambiente o una fachada. Conversemos sobre lo que tu espacio necesita."}
              </p>
              <a
                className="button button-orange"
                href={q || tag ? "/proyectos/" : "https://wa.me/51908917621"}
              >
                {q || tag ? "Ver todos los proyectos" : "Cuéntanos tu idea"}
                <span>
                  <Icon name="arrow-up-right" />
                </span>
              </a>
            </div>
          )}
        </section>
        <section className="project-next section-pad">
          <p className="eyebrow">LA SIGUIENTE HISTORIA PUEDE SER LA TUYA</p>
          <h2>
            Hagamos espacio
            <br />
            para tu idea.
          </h2>
          <a href="https://wa.me/51908917621" className="button button-orange">
            Hablemos de tu proyecto{" "}
            <span>
              <Icon name="arrow-up-right" />
            </span>
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
