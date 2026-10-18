import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Monitor,
  Smartphone,
  Save,
  Send,
  Globe,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  CATEGORIES,
  TAGS,
  emptyProject,
  seoFor,
  slugify,
  type Project,
  type ProjectInput,
  type RichNode,
  type Media,
} from "@veca/content";
import { ProjectArticle } from "@veca/ui";
import { Select } from "@veca/ui/src/Select";
import { api, post } from "../../lib/api";
import { Button, Field, Notice, Status } from "../../components/ui";
import { RichEditor } from "./RichEditor";
import { ImageLibrary } from "./ImageLibrary";
const toInput = (project: Project): ProjectInput => {
  const {
    title,
    excerpt,
    category,
    tags,
    location,
    body,
    images,
    coverId,
    coverLayout,
    featured,
    featuredOrder,
    version,
  } = project;
  return {
    title,
    excerpt,
    category,
    tags,
    location,
    body,
    images,
    coverId,
    coverLayout,
    featured,
    featuredOrder,
    version,
  };
};
function removeMissingImages(node: RichNode, ids: Set<string>): RichNode {
  return {
    ...node,
    content: node.content
      ?.filter((n) => n.type !== "image" || ids.has(String(n.attrs?.mediaId)))
      .map((n) => removeMissingImages(n, ids)),
  };
}
export function ProjectEditor({
  initial,
  onBack,
  onSaved,
}: {
  initial: Project | null;
  onBack: () => void;
  onSaved: (p: Project) => void;
}) {
  const [draft, setDraft] = useState<ProjectInput>(
    initial ? toInput(initial) : emptyProject,
  );
  const [saved, setSaved] = useState<Project | null>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewSize, setPreviewSize] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const insert = useRef<(image: Media, layout: string) => void>(() => {});
  const patch = <K extends keyof ProjectInput>(
    key: K,
    value: ProjectInput[K],
  ) => {
    setDraft((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setNotice("");
  };
  const ready = useCallback((fn: (image: Media, layout: string) => void) => {
    insert.current = fn;
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", handler);
    return () => removeEventListener("beforeunload", handler);
  }, [dirty]);
  function accept(project: Project) {
    setSaved(project);
    setDraft(toInput(project));
    setDirty(false);
    onSaved(project);
  }
  async function save() {
    const result = await api<Project>(
      saved ? "/admin/projects/" + saved.id : "/admin/projects",
      {
        method: saved ? "PUT" : "POST",
        body: JSON.stringify({ ...draft, version: saved?.version }),
      },
    );
    accept(result);
    return result;
  }
  async function action(kind: "save" | "publish" | "unpublish") {
    if (
      kind === "unpublish" &&
      !confirm(
        "¿Retirar este proyecto de la web pública? El borrador se conservará.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let result: Project;
      if (kind === "unpublish" && saved) {
        result = await post<Project>(`/admin/projects/${saved.id}/unpublish`, {
          version: saved.version,
        });
        accept(result);
      } else {
        result = await save();
        if (kind === "publish") {
          result = await post<Project>(`/admin/projects/${result.id}/publish`, {
            version: result.version,
          });
          accept(result);
        }
      }
      setNotice(
        kind === "publish"
          ? "Proyecto publicado. Ya está disponible en la web."
          : kind === "unpublish"
            ? "El proyecto ahora es un borrador privado."
            : "Borrador guardado.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const seo = seoFor(
    draft,
    saved?.slug || slugify(draft.title) || "tu-proyecto",
  );
  return (
    <div className="editor-page">
      <header className="editor-header">
        <button
          className="back-button"
          onClick={() => {
            if (
              !dirty ||
              confirm("Tienes cambios sin guardar. ¿Salir del editor?")
            )
              onBack();
          }}
        >
          <ArrowLeft size={18} />
          Proyectos
        </button>
        <div className="save-state">
          <Status
            published={saved?.status === "published"}
            changed={
              !!saved?.hasUnpublishedChanges ||
              (dirty && saved?.status === "published")
            }
          />
          <span>
            {dirty ? "Sin guardar" : saved ? "Todo guardado" : "Nuevo proyecto"}
          </span>
        </div>
        <div className="editor-actions">
          <Button variant="ghost" onClick={() => setPreview(!preview)}>
            <Eye size={17} />
            {preview ? "Volver a editar" : "Vista previa"}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void action("save")}
          >
            <Save size={17} />
            {busy ? "Guardando…" : "Guardar"}
          </Button>
          <Button disabled={busy} onClick={() => void action("publish")}>
            <Send size={16} />
            {saved?.status === "published" ? "Publicar cambios" : "Publicar"}
          </Button>
        </div>
      </header>
      {error && <Notice error>{error}</Notice>}
      {notice && (
        <Notice>
          <Check size={16} />
          {notice}
        </Notice>
      )}
      {preview ? (
        <section className="preview-section">
          <div className="preview-toolbar">
            <div>
              <p className="overline">VISTA PREVIA</p>
              <h2>Así se verá tu proyecto</h2>
              <p>
                Incluye tus cambios actuales, aunque todavía no los hayas
                guardado.
              </p>
            </div>
            <div className="segment">
              <button
                aria-label="Vista de escritorio"
                aria-pressed={previewSize === "desktop"}
                onClick={() => setPreviewSize("desktop")}
              >
                <Monitor size={18} />
              </button>
              <button
                aria-label="Vista de móvil"
                aria-pressed={previewSize === "mobile"}
                onClick={() => setPreviewSize("mobile")}
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
          <div className={`preview-frame preview-${previewSize}`}>
            <div className="preview-brand">
              <img src="/assets/logo.svg" alt="Vidrios VECA" />
              <span>
                PROYECTOS /{" "}
                {CATEGORIES.find((c) => c.id === draft.category)?.name}
              </span>
            </div>
            <ProjectArticle project={draft} />
            <div className="preview-end">
              ¿Damos forma a tu próximo proyecto?{" "}
              <span>Vidrios VECA · Lima</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="editor-columns">
          <main className="editor-main">
            <section className="editor-intro">
              <p className="overline">
                ESTUDIO EDITORIAL /{" "}
                {saved ? "EDITAR PROYECTO" : "NUEVO PROYECTO"}
              </p>
              <h1>Una historia que merece verse.</h1>
              <p>
                Del primer detalle al resultado. Dale forma al próximo proyecto
                de VECA.
              </p>
            </section>
            <section className="editor-card">
              <Field label="Nombre del proyecto" htmlFor="title">
                <input
                  id="title"
                  className="title-input"
                  maxLength={140}
                  placeholder="Una nueva luz para un hogar en Lima"
                  value={draft.title}
                  onChange={(e) => patch("title", e.target.value)}
                />
              </Field>
              <Field
                label="Resumen"
                htmlFor="excerpt"
                hint={`${draft.excerpt.length}/320 · También se utiliza para la descripción en buscadores.`}
              >
                <textarea
                  id="excerpt"
                  rows={3}
                  maxLength={320}
                  placeholder="En pocas líneas, ¿qué transformamos y qué hizo especial a este proyecto?"
                  value={draft.excerpt}
                  onChange={(e) => patch("excerpt", e.target.value)}
                />
              </Field>
            </section>
            <section className="editor-card">
              <ImageLibrary
                images={draft.images}
                coverId={draft.coverId}
                onChange={(images) => {
                  setDraft((old) => {
                    const nextImages =
                      typeof images === "function"
                        ? images(old.images)
                        : images;
                    return {
                      ...old,
                      images: nextImages,
                      coverId: nextImages.some(
                        (image) => image.id === old.coverId,
                      )
                        ? old.coverId
                        : nextImages[0]?.id || null,
                      body: removeMissingImages(
                        old.body,
                        new Set(nextImages.map((i) => i.id)),
                      ),
                    };
                  });
                  setDirty(true);
                  setNotice("");
                }}
                onCover={(id) => patch("coverId", id)}
                onInsert={(image, layout) => insert.current(image, layout)}
              />
            </section>
            <section className="editor-card">
              <div className="section-row">
                <div>
                  <h3>La historia del proyecto</h3>
                  <p>Texto con formato y fotografías en el lugar que elijas.</p>
                </div>
              </div>
              <RichEditor
                value={draft.body}
                onChange={(node) => patch("body", node)}
                onReady={ready}
              />
            </section>
          </main>
          <aside className="editor-sidebar">
            <section className="editor-card">
              <h3>Organización</h3>
              <Field label="Categoría" htmlFor="category">
                <Select
                  id="category"
                  label="Categoría"
                  value={draft.category}
                  options={CATEGORIES.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  onChange={(value) => patch("category", value)}
                />
              </Field>
              <Field label="Ubicación del proyecto" htmlFor="location">
                <input
                  id="location"
                  value={draft.location}
                  maxLength={100}
                  onChange={(e) => patch("location", e.target.value)}
                />
              </Field>
              <Field
                label="Etiquetas"
                hint="Elige hasta 8 etiquetas de la lista."
              >
                <div className="tag-picker">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={draft.tags.includes(tag)}
                      disabled={
                        !draft.tags.includes(tag) && draft.tags.length >= 8
                      }
                      onClick={() =>
                        patch(
                          "tags",
                          draft.tags.includes(tag)
                            ? draft.tags.filter((t) => t !== tag)
                            : [...draft.tags, tag],
                        )
                      }
                    >
                      {draft.tags.includes(tag) && <Check size={12} />}
                      {tag}
                    </button>
                  ))}
                </div>
              </Field>
            </section>
            <section className="editor-card">
              <h3>Presentación</h3>
              <Field label="Posición de la portada" htmlFor="cover-layout">
                <Select
                  id="cover-layout"
                  label="Posición de la portada"
                  value={draft.coverLayout}
                  options={[
                    {
                      value: "top",
                      label: "Imagen debajo del título",
                      description: "Portada a todo el ancho",
                    },
                    {
                      value: "left",
                      label: "Imagen a la izquierda",
                      description: "Texto junto a la portada",
                    },
                    {
                      value: "right",
                      label: "Imagen a la derecha",
                      description: "Texto junto a la portada",
                    },
                  ]}
                  onChange={(value) =>
                    patch("coverLayout", value as ProjectInput["coverLayout"])
                  }
                />
              </Field>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patch("featured", e.target.checked)}
                />
                <span>
                  <strong>Destacar en la página principal</strong>
                  <small>
                    Se mostrará en la selección de proyectos de portada.
                  </small>
                </span>
              </label>
              {draft.featured && (
                <Field
                  label="Orden en portada"
                  htmlFor="featured-order"
                  hint="Los números más bajos aparecen primero."
                >
                  <input
                    id="featured-order"
                    type="number"
                    min="0"
                    max="999"
                    value={draft.featuredOrder}
                    onChange={(e) =>
                      patch("featuredOrder", Number(e.target.value))
                    }
                  />
                </Field>
              )}
            </section>
            <section className="editor-card seo-card">
              <h3>
                <Search size={17} />
                Vista en Google
              </h3>
              <p className="seo-url">
                veca.com.pe › proyectos ›{" "}
                {saved?.slug || slugify(draft.title) || "tu-proyecto"}
              </p>
              <p className="seo-title">{seo.title}</p>
              <p className="seo-description">{seo.description}</p>
              <p className="hint">
                Título, descripción, enlace y datos estructurados se generan
                automáticamente al publicar. La indexación depende de Google.
              </p>
            </section>
            {saved?.status === "published" && (
              <section className="editor-card">
                <a
                  className="external-link"
                  href={saved.seo.canonical}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={16} />
                  Ver publicación
                  <ChevronRight size={15} />
                </a>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => void action("unpublish")}
                >
                  Retirar de la web
                </Button>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
