import { CATEGORIES } from "@veca/content";
import { projects } from "../lib/api";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { ProjectGrid } from "./ProjectGrid";
export async function ProjectCollection({
  category = "",
  q = "",
  page = "1",
}: {
  category?: string;
  q?: string;
  page?: string;
}) {
  const taxonomy = CATEGORIES.find((c) => c.id === category);
  const result = await projects({
    category,
    q: q.slice(0, 120),
    page: /^[1-9]\d{0,3}$/.test(page) ? page : "1",
  }).catch(() => null);
  const base = category ? `/proyectos/categoria/${category}/` : "/proyectos/";
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="project-collection">
        <header className="collection-heading section-pad">
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <a href="/">Vidrios VECA</a>
            <span>/</span>
            <a href="/proyectos/">Proyectos</a>
            {taxonomy && (
              <>
                <span>/</span>
                <span>{taxonomy.name}</span>
              </>
            )}
          </nav>
          <p className="eyebrow">PROYECTOS DE VIDRIOS VECA</p>
          <h1>
            {taxonomy ? (
              taxonomy.name
            ) : (
              <>
                Cada espacio.
                <br />
                <span>Una nueva posibilidad.</span>
              </>
            )}
          </h1>
          <p>
            {taxonomy
              ? taxonomy.description
              : "Una mirada a las soluciones en vidrio para edificios, hogares y espacios que se transforman."}
          </p>
        </header>
        <section className="project-browser section-pad">
          <div className="collection-tools">
            <nav
              className="category-filters"
              aria-label="Categorías de proyectos"
            >
              <a
                href="/proyectos/"
                aria-current={!category ? "page" : undefined}
              >
                Todos los proyectos
              </a>
              {CATEGORIES.map((c) => (
                <a
                  key={c.id}
                  href={`/proyectos/categoria/${c.id}/`}
                  aria-current={category === c.id ? "page" : undefined}
                >
                  {c.name}
                </a>
              ))}
            </nav>
            <form className="project-search" action={base}>
              <label htmlFor="project-search">
                Busca una idea, un material o un proyecto
              </label>
              <div>
                <input
                  type="search"
                  id="project-search"
                  name="q"
                  maxLength={120}
                  defaultValue={q}
                  placeholder="Ventanas, mamparas, Lima…"
                />
                <button type="submit" aria-label="Buscar proyectos">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 5 5" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
          {!result ? (
            <div className="collection-empty">
              <h2>Sigamos explorando tu proyecto.</h2>
              <p>
                Conversa con nuestro equipo para conocer las soluciones que
                necesita tu espacio.
              </p>
              <a
                className="button button-orange"
                href="https://wa.me/51908917621"
              >
                Conversemos por WhatsApp <span>↗</span>
              </a>
            </div>
          ) : result.items.length ? (
            <>
              <p className="collection-count">
                {result.total} {result.total === 1 ? "proyecto" : "proyectos"}
                {q && ` para «${q}»`}
              </p>
              <ProjectGrid items={result.items} />
              <nav className="pagination" aria-label="Páginas de proyectos">
                {result.page > 1 && (
                  <a
                    href={`${base}?${new URLSearchParams({ q, page: String(result.page - 1) })}`}
                  >
                    ← Anterior
                  </a>
                )}
                {result.page * result.pageSize < result.total && (
                  <a
                    href={`${base}?${new URLSearchParams({ q, page: String(result.page + 1) })}`}
                  >
                    Más proyectos →
                  </a>
                )}
              </nav>
            </>
          ) : (
            <div className="collection-empty">
              <p className="eyebrow">TU PRÓXIMO PROYECTO</p>
              <h2>
                {q
                  ? "Exploremos otra posibilidad."
                  : "Imagina lo que podemos transformar."}
              </h2>
              <p>
                {q
                  ? "Prueba otra búsqueda o explora las categorías de proyectos."
                  : "Una ventana, un nuevo ambiente o una fachada. Hablemos de lo que tu espacio necesita."}
              </p>
              <a
                className="button button-orange"
                href={q ? base : "https://wa.me/51908917621"}
              >
                {q ? "Ver todos los proyectos" : "Cuéntanos tu idea"}{" "}
                <span>↗</span>
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
            Hablemos de tu proyecto <span>↗</span>
          </a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
