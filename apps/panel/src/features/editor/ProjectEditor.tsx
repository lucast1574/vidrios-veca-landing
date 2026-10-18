import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Save,
  ChevronLeft,
  Globe,
  Search,
  ChevronRight,
} from "lucide-react";
import {
  CATEGORIES,
  SOLUTION_SLOTS,
  TAGS,
  emptyProject,
  seoFor,
  slugify,
  type Project,
  type ProjectInput,
  type RichNode,
  type Media,
  type PageLayout,
} from "@veca/content";
import { Select } from "@veca/ui/src/Select";
import { api, post } from "../../lib/api";
import { Button, Field, Notice, Status } from "../../components/ui";
import { RichEditor } from "./RichEditor";
import { ImageLibrary } from "./ImageLibrary";
import { StorySections } from "./StorySections";
import { ProjectDesign } from "./ProjectDesign";
import { PublishReview, PublishSuccess } from "./PublishReview";
import { legacySections, newSection, pruneSections } from "./sections";
import "./editor-workflow.css";
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
    pageLayout,
    sections,
    solutionSlot,
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
    pageLayout: pageLayout || "legacy",
    sections: sections || [],
    solutionSlot: solutionSlot || null,
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
  const [draft, setDraft] = useState<ProjectInput>(() =>
    initial
      ? toInput(initial)
      : { ...emptyProject(), pageLayout: "stacked", sections: [newSection()] },
  );
  const [saved, setSaved] = useState<Project | null>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [publishedResult, setPublishedResult] = useState<Project | null>(null);
  function goToStep(next: 0 | 1 | 2) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function chooseLayout(layout: PageLayout) {
    setDraft((old) => ({
      ...old,
      pageLayout: layout,
      sections: layout !== "legacy" ? legacySections(old) : old.sections,
    }));
    setDirty(true);
    setNotice("");
  }
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
  useEffect(() => {
    const preventWhileBusy = (event: Event) => {
      if (busy) event.preventDefault();
    };
    window.addEventListener("veca-before-navigate", preventWhileBusy);
    return () =>
      window.removeEventListener("veca-before-navigate", preventWhileBusy);
  }, [busy]);
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
    setSaving(true);
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
          setPublishedResult(result);
          window.scrollTo({ top: 0, behavior: "instant" });
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
      setSaving(false);
    }
  }
  const seo = seoFor(
    draft,
    saved?.slug || slugify(draft.title) || "tu-proyecto",
  );
  if (publishedResult)
    return (
      <PublishSuccess
        project={publishedResult}
        onBack={onBack}
        onEdit={() => {
          setPublishedResult(null);
          goToStep(0);
        }}
      />
    );
  return (
    <div className="editor-page">
      <header className="editor-header">
        <button
          className="back-button"
          disabled={busy}
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
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void action("save")}
          >
            <Save size={17} />
            {saving ? "Guardando…" : uploading ? "Subiendo fotos…" : "Guardar"}
          </Button>
          {step < 2 && (
            <Button
              disabled={busy}
              onClick={() => goToStep(step === 0 ? 1 : 2)}
            >
              {step === 0 ? "Elegir diseño" : "Revisar publicación"}
              <ChevronRight size={17} />
            </Button>
          )}
        </div>
      </header>
      {error && <Notice error>{error}</Notice>}
      {notice && (
        <Notice>
          <Check size={16} />
          {notice}
        </Notice>
      )}
      <nav className="editor-steps" aria-label="Pasos de publicación">
        {["Contenido", "Diseño y vista previa", "Publicar"].map(
          (label, index) => (
            <button
              key={label}
              type="button"
              disabled={busy}
              aria-current={step === index ? "step" : undefined}
              onClick={() => goToStep(index as 0 | 1 | 2)}
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </button>
          ),
        )}
      </nav>
      <fieldset className="editor-workspace" disabled={busy}>
        {step === 1 ? (
          <ProjectDesign
            draft={draft}
            size={previewSize}
            onSize={setPreviewSize}
            onLayout={chooseLayout}
          />
        ) : step === 2 ? (
          <PublishReview
            draft={draft}
            slug={saved?.slug || slugify(draft.title) || "tu-proyecto"}
            busy={busy}
            updating={saved?.status === "published"}
            onEdit={() => goToStep(0)}
            onPublish={() => void action("publish")}
          />
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
                  Del primer detalle al resultado. Dale forma al próximo
                  proyecto de VECA.
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
                  onBusyChange={setUploading}
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
                        sections:
                          !old.images.length &&
                          old.sections.length === 1 &&
                          !old.sections[0].imageIds.length
                            ? [
                                {
                                  ...old.sections[0],
                                  imageIds: nextImages.map((image) => image.id),
                                },
                              ]
                            : pruneSections(old.sections, nextImages),
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
                  onInsert={
                    draft.pageLayout === "legacy"
                      ? (image, layout) => insert.current(image, layout)
                      : undefined
                  }
                />
              </section>
              <section className="editor-card">
                {draft.pageLayout === "legacy" ? (
                  <>
                    <div className="section-row">
                      <div>
                        <h3>La historia del proyecto</h3>
                        <p>Este proyecto conserva su editor original.</p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => chooseLayout("stacked")}
                      >
                        Organizar en secciones
                      </Button>
                    </div>
                    <RichEditor
                      value={draft.body}
                      onChange={(node) => patch("body", node)}
                      onReady={ready}
                      disabled={busy}
                    />
                  </>
                ) : (
                  <StorySections
                    sections={draft.sections}
                    images={draft.images}
                    disabled={busy}
                    onChange={(sections) => patch("sections", sections)}
                  />
                )}
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
                <h3>En la página principal</h3>
                <Field
                  label="Pestaña de soluciones"
                  hint="Al publicar, se mostrará con su imagen principal. Si eliges una pestaña que ya tiene proyecto, el último publicado será el que aparezca."
                >
                  <Select
                    label="Pestaña de soluciones"
                    value={draft.solutionSlot || "none"}
                    options={[
                      { value: "none", label: "No mostrar en soluciones" },
                      ...SOLUTION_SLOTS.map((slot) => ({
                        value: slot.id,
                        label: slot.name,
                      })),
                    ]}
                    onChange={(value) =>
                      patch(
                        "solutionSlot",
                        value === "none"
                          ? null
                          : (value as ProjectInput["solutionSlot"]),
                      )
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
                    <strong>Destacar entre los 3 proyectos de portada</strong>
                    <small>
                      Elige qué trabajos poner en el foco de la página
                      principal.
                    </small>
                  </span>
                </label>
                {draft.featured && (
                  <Field
                    label="Orden en portada"
                    htmlFor="featured-order"
                    hint="Solo se muestran los tres primeros. Los números más bajos tienen prioridad."
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
      </fieldset>
      <div className="editor-step-footer">
        {step > 0 && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => goToStep(step === 2 ? 1 : 0)}
          >
            <ChevronLeft size={17} />
            {step === 2 ? "Volver al diseño" : "Volver al contenido"}
          </Button>
        )}
        {step < 2 && (
          <Button disabled={busy} onClick={() => goToStep(step === 0 ? 1 : 2)}>
            {step === 0 ? "Continuar al diseño" : "Continuar a publicar"}
            <ChevronRight size={17} />
          </Button>
        )}
      </div>
    </div>
  );
}
