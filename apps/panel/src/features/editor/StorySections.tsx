import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Plus,
  Trash2,
  Images,
} from "lucide-react";
import { plainText, type Media, type ProjectSection } from "@veca/content";
import { Button, Field } from "../../components/ui";
import { Modal } from "../../components/Modal";
import { RichEditor } from "./RichEditor";
import { moveSection, newSection } from "./sections";
export function StorySections({
  sections,
  images,
  onChange,
  disabled = false,
}: {
  sections: ProjectSection[];
  images: Media[];
  onChange: (sections: ProjectSection[]) => void;
  disabled?: boolean;
}) {
  const [active, setActive] = useState(sections[0]?.id || "");
  const [removing, setRemoving] = useState<string | null>(null);
  const patch = (id: string, change: Partial<ProjectSection>) =>
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, ...change } : section,
      ),
    );
  function add() {
    const section = newSection();
    onChange([...sections, section]);
    setActive(section.id);
  }
  function reorderPhoto(
    section: ProjectSection,
    index: number,
    direction: number,
  ) {
    const ids = [...section.imageIds],
      target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    patch(section.id, { imageIds: ids });
  }
  return (
    <section className="story-builder" aria-label="Secciones del proyecto">
      <div className="section-row">
        <div>
          <h3>Cuenta el proyecto por secciones</h3>
          <p>
            Una idea por sección. Combina texto y fotos; el diseño lo eliges en
            el siguiente paso.
          </p>
        </div>
      </div>
      {sections.map((section, index) => (
        <div key={section.id} className="story-section-card">
          <div className="story-section-header">
            <button
              type="button"
              className="story-section-toggle"
              onClick={() => setActive(active === section.id ? "" : section.id)}
              aria-expanded={active === section.id}
              aria-controls={`section-${section.id}`}
            >
              <span className="story-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{section.title || `Sección ${index + 1}`}</strong>
                <small>
                  {section.imageIds.length} fotos ·{" "}
                  {plainText(section.body).length} caracteres
                </small>
              </span>
              <ChevronDown size={16} />
            </button>
            <div className="story-section-actions">
              <button
                type="button"
                aria-label={`Subir sección ${index + 1}`}
                disabled={disabled || index === 0}
                onClick={() => onChange(moveSection(sections, section.id, -1))}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label={`Bajar sección ${index + 1}`}
                disabled={disabled || index === sections.length - 1}
                onClick={() => onChange(moveSection(sections, section.id, 1))}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                aria-label={`Quitar sección ${index + 1}`}
                disabled={disabled}
                onClick={() => setRemoving(section.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {active === section.id && (
            <div id={`section-${section.id}`} className="story-section-fields">
              <Field
                label="Título de la sección"
                hint="Opcional. Por ejemplo: El reto, La instalación o El resultado."
              >
                <input
                  value={section.title}
                  maxLength={160}
                  disabled={disabled}
                  onChange={(e) => patch(section.id, { title: e.target.value })}
                />
              </Field>
              <RichEditor
                value={section.body}
                onChange={(body) => patch(section.id, { body })}
                label={`Texto de la sección ${index + 1}`}
                disabled={disabled}
              />
              <div className="story-photos-heading">
                <Images size={17} />
                <strong>Fotos de esta sección</strong>
                <span>{section.imageIds.length} elegidas</span>
              </div>
              {!images.length ? (
                <p className="story-hint">
                  Añade fotos en la biblioteca de arriba y aparecerán aquí para
                  elegirlas.
                </p>
              ) : (
                <>
                  <p className="story-hint">
                    Elige una foto o varias para crear un collage. Puedes usar
                    una foto en más de una sección.
                  </p>
                  <div className="section-photo-options">
                    {images.map((image, photoIndex) => (
                      <button
                        type="button"
                        key={image.id}
                        disabled={disabled}
                        aria-label={`Foto ${photoIndex + 1} para sección ${index + 1}`}
                        aria-pressed={section.imageIds.includes(image.id)}
                        onClick={() =>
                          patch(section.id, {
                            imageIds: section.imageIds.includes(image.id)
                              ? section.imageIds.filter((id) => id !== image.id)
                              : [...section.imageIds, image.id],
                          })
                        }
                      >
                        <img
                          src={image.url}
                          alt={image.alt || `Foto ${photoIndex + 1}`}
                          style={{
                            objectPosition: `${image.positionX}% ${image.positionY}%`,
                          }}
                        />
                        <span>
                          {section.imageIds.includes(image.id)
                            ? `✓ ${section.imageIds.indexOf(image.id) + 1}`
                            : `Foto ${photoIndex + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                  {section.imageIds.length > 1 && (
                    <div
                      className="section-photo-order"
                      aria-label={`Orden de fotos de sección ${index + 1}`}
                    >
                      {section.imageIds.map((id, photoIndex) => (
                        <div key={id}>
                          <span>
                            {photoIndex + 1}. Foto{" "}
                            {images.findIndex((image) => image.id === id) + 1}
                          </span>
                          <button
                            type="button"
                            disabled={disabled || photoIndex === 0}
                            aria-label={`Adelantar foto ${photoIndex + 1} de sección ${index + 1}`}
                            onClick={() =>
                              reorderPhoto(section, photoIndex, -1)
                            }
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={
                              disabled ||
                              photoIndex === section.imageIds.length - 1
                            }
                            aria-label={`Atrasar foto ${photoIndex + 1} de sección ${index + 1}`}
                            onClick={() => reorderPhoto(section, photoIndex, 1)}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || sections.length >= 24}
        onClick={add}
      >
        <Plus size={17} />
        Añadir sección
      </Button>
      {removing && (
        <Modal
          title="¿Quitar esta sección?"
          description="Se quitarán su texto y su selección de fotos. Las fotos seguirán en la biblioteca del proyecto."
          onClose={() => setRemoving(null)}
          footer={
            <footer className="ve-modal-actions">
              <Button variant="ghost" onClick={() => setRemoving(null)}>
                Conservar sección
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  onChange(
                    sections.filter((section) => section.id !== removing),
                  );
                  setRemoving(null);
                }}
              >
                Quitar sección
              </Button>
            </footer>
          }
        >
          <p>Este cambio se guardará cuando guardes el proyecto.</p>
        </Modal>
      )}
    </section>
  );
}
