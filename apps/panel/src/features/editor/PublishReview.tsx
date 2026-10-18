import {
  ArrowUpRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Globe,
  Send,
} from "lucide-react";
import {
  CATEGORIES,
  PAGE_LAYOUTS,
  publicationIssues,
  seoFor,
  type Project,
  type ProjectInput,
} from "@veca/content";
import { Button } from "../../components/ui";
export function PublishReview({
  draft,
  slug,
  busy,
  onPublish,
  onEdit,
  updating,
}: {
  draft: ProjectInput;
  slug: string;
  busy: boolean;
  onPublish: () => void;
  onEdit: () => void;
  updating: boolean;
}) {
  const issues = publicationIssues(draft),
    cover = draft.images.find((image) => image.id === draft.coverId),
    seo = seoFor(draft, slug);
  return (
    <section className="publish-review">
      <header className="editor-step-heading">
        <p>03 / PUBLICAR</p>
        <h1>El siguiente paso es compartirlo.</h1>
        <span>
          Revisa los últimos detalles. Al publicar, este proyecto estará
          disponible para quienes visitan la web de VECA.
        </span>
      </header>
      <div className="publish-review-grid">
        <div className="publication-card">
          {cover ? (
            <img
              className="publication-cover"
              src={cover.url}
              alt={cover.alt || "Portada del proyecto"}
              style={{
                objectPosition: `${cover.positionX}% ${cover.positionY}%`,
              }}
            />
          ) : (
            <div className="publication-cover cover-placeholder">
              <Globe size={40} />
              <span>Tu portada aparecerá aquí</span>
            </div>
          )}
          <div className="publication-copy">
            <p>
              {CATEGORIES.find((c) => c.id === draft.category)?.name} ·{" "}
              {draft.location || "Lima"}
            </p>
            <h2>{draft.title || "Tu próximo proyecto"}</h2>
            <span>
              {draft.excerpt || "Un trabajo que cuenta lo que hacemos en VECA."}
            </span>
            <div>
              <span>{draft.images.length} fotos</span>
              <span>
                {draft.pageLayout === "legacy"
                  ? "Diseño original"
                  : `${draft.sections.length} secciones`}
              </span>
            </div>
          </div>
        </div>
        <div className="publication-checklist">
          <div className="publish-intention">
            <Globe size={24} />
            <h2>
              {issues.length
                ? "Casi listo para salir al mundo."
                : "Todo listo para darlo a conocer."}
            </h2>
            <p>
              {PAGE_LAYOUTS.find((layout) => layout.id === draft.pageLayout)
                ?.name || "Diseño original"}
              . El título, las imágenes y el contenido se publicarán juntos.
            </p>
          </div>
          {issues.length ? (
            <>
              <ul
                className="publish-issues"
                aria-label="Pendientes para publicar"
              >
                {issues.map((issue) => (
                  <li key={issue}>
                    <span>•</span>
                    {issue}
                  </li>
                ))}
              </ul>
              <Button variant="ghost" onClick={onEdit} disabled={busy}>
                <ArrowLeft size={16} />
                Completar contenido
              </Button>
            </>
          ) : (
            <ul className="publish-checks">
              <li>
                <Check size={17} />
                Título y contenido preparados
              </li>
              <li>
                <Check size={17} />
                Portada y fotos con descripción
              </li>
              <li>
                <Check size={17} />
                Diseño elegido y SEO automático
              </li>
            </ul>
          )}
          <div className="publish-final-action">
            <Button disabled={busy || !!issues.length} onClick={onPublish}>
              <Send size={18} />
              {busy
                ? "Publicando tu proyecto…"
                : updating
                  ? "Publicar cambios"
                  : "Publicar en VECA"}
            </Button>
            <small>
              Guardar un borrador lo mantiene privado. Solo este botón lo
              publica en la web.
            </small>
          </div>
          <div className="publication-seo">
            <span>ASÍ APARECERÁ EN BUSCADORES</span>
            <strong>{seo.title}</strong>
            <p>{seo.description}</p>
            <small>La indexación depende de los buscadores.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
export function PublishSuccess({
  project,
  onEdit,
  onBack,
}: {
  project: Project;
  onEdit: () => void;
  onBack: () => void;
}) {
  return (
    <section className="publication-success" role="status">
      <div className="publication-success-mark">
        <CheckCircle2 size={42} />
      </div>
      <p>YA ES PARTE DE VECA</p>
      <h1>Tu proyecto está publicado.</h1>
      <h2>{project.title}</h2>
      <span>
        La historia ya tiene su lugar en la web. Puedes compartirla o volver
        cuando quieras para seguir editando.
      </span>
      <div className="publication-success-actions">
        <a
          className="btn btn-primary"
          href={project.seo.canonical}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver proyecto en la web <ArrowUpRight size={17} />
        </a>
        <Button variant="ghost" onClick={onBack}>
          Volver a proyectos
        </Button>
      </div>
      <button type="button" className="publication-edit-link" onClick={onEdit}>
        Seguir editando este proyecto
      </button>
    </section>
  );
}
