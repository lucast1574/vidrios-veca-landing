import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ImagePlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import type { Media } from "@veca/content";
import { api } from "../../lib/api";
import { Button, Field, Notice } from "../../components/ui";
export function ImageLibrary({
  images,
  coverId,
  onChange,
  onCover,
  onInsert,
  onBusyChange,
}: {
  onBusyChange?: (busy: boolean) => void;
  images: Media[];
  coverId: string | null;
  onChange: Dispatch<SetStateAction<Media[]>>;
  onCover: (id: string | null) => void;
  onInsert?: (image: Media, layout: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const update = (id: string, patch: Partial<Media>) =>
    onChange((current) =>
      current.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  async function upload(files: FileList | null) {
    if (!files) return;
    setError("");
    if (images.length + files.length > 24) {
      setError("Puedes añadir hasta 24 fotos por proyecto.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    const added: Media[] = [];
    try {
      for (const file of files) {
        if (file.size > 12 * 1024 * 1024)
          throw new Error(`${file.name}: la foto supera 12 MB.`);
        const form = new FormData();
        form.append("file", file);
        added.push(await api<Media>("/media", { method: "POST", body: form }));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (added.length) {
        onChange((current) => [...current, ...added]);
        setActive(added[0].id);
      }
      setBusy(false);
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  }
  const selected = images.find((i) => i.id === active);
  return (
    <section className="image-library">
      <div className="section-row">
        <div>
          <h3>Fotografías</h3>
          <p>
            Elige una imagen principal y describe tus fotos. La portada es
            obligatoria para publicar.
          </p>
        </div>
        <Button
          variant="ghost"
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={17} />
          {busy ? "Subiendo…" : "Añadir fotos"}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
      </div>
      {error && <Notice error>{error}</Notice>}
      {!images.length ? (
        <button
          type="button"
          className="upload-empty"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          <ImageIcon size={30} />
          <strong>
            {busy
              ? "Preparando tus fotos…"
              : "El proyecto empieza a verse aquí"}
          </strong>
          <span>
            Añade fotos reales del trabajo · JPG, PNG, WebP o AVIF · Hasta 12 MB
          </span>
        </button>
      ) : (
        <div className="photo-grid">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className={`photo-tile ${active === image.id ? "selected" : ""}`}
              onClick={() => setActive(image.id)}
              aria-label={`Editar foto ${index + 1}`}
            >
              <img
                src={image.url}
                alt={image.alt || `Foto ${index + 1}`}
                style={{
                  objectPosition: `${image.positionX}% ${image.positionY}%`,
                }}
              />
              {coverId === image.id && <span>Portada</span>}
              <small>{String(index + 1).padStart(2, "0")}</small>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="photo-settings">
          <div className="photo-focus">
            <img
              src={selected.url}
              alt={selected.alt || "Vista del encuadre"}
              style={{
                objectPosition: `${selected.positionX}% ${selected.positionY}%`,
              }}
            />
            <span>Vista del encuadre</span>
          </div>
          <div className="photo-fields">
            <Field
              label="Descripción de la foto"
              htmlFor="image-alt"
              hint="Describe lo que se ve. Ayuda a la accesibilidad y a los buscadores."
            >
              <input
                id="image-alt"
                maxLength={220}
                value={selected.alt}
                onChange={(e) => update(selected.id, { alt: e.target.value })}
                placeholder="Mampara de vidrio instalada en una sala…"
              />
            </Field>
            <Field label="Pie de foto" htmlFor="image-caption">
              <input
                id="image-caption"
                value={selected.caption}
                maxLength={400}
                onChange={(e) =>
                  update(selected.id, { caption: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field
                label={`Encuadre horizontal · ${selected.positionX}%`}
                htmlFor="focus-x"
              >
                <input
                  id="focus-x"
                  type="range"
                  min="0"
                  max="100"
                  value={selected.positionX}
                  onChange={(e) =>
                    update(selected.id, { positionX: Number(e.target.value) })
                  }
                />
              </Field>
              <Field
                label={`Encuadre vertical · ${selected.positionY}%`}
                htmlFor="focus-y"
              >
                <input
                  id="focus-y"
                  type="range"
                  min="0"
                  max="100"
                  value={selected.positionY}
                  onChange={(e) =>
                    update(selected.id, { positionY: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <div className="image-actions">
              <Button
                variant="ghost"
                type="button"
                onClick={() => onCover(selected.id)}
              >
                {coverId === selected.id
                  ? "Es la portada"
                  : "Usar como portada"}
              </Button>
              <Button
                variant="ghost"
                type="button"
                disabled={images[0].id === selected.id}
                aria-label="Mover foto antes"
                onClick={() => {
                  onChange((current) => {
                    const i = current.findIndex(
                      (image) => image.id === selected.id,
                    );
                    const target = i + -1;
                    if (i < 0 || target < 0 || target >= current.length)
                      return current;
                    const copy = [...current];
                    [copy[target], copy[i]] = [copy[i], copy[target]];
                    return copy;
                  });
                }}
              >
                <ArrowUp size={16} />
              </Button>
              <Button
                variant="ghost"
                type="button"
                disabled={images.at(-1)?.id === selected.id}
                aria-label="Mover foto después"
                onClick={() => {
                  onChange((current) => {
                    const i = current.findIndex(
                      (image) => image.id === selected.id,
                    );
                    const target = i + 1;
                    if (i < 0 || target < 0 || target >= current.length)
                      return current;
                    const copy = [...current];
                    [copy[target], copy[i]] = [copy[i], copy[target]];
                    return copy;
                  });
                }}
              >
                <ArrowDown size={16} />
              </Button>
              <Button
                variant="danger"
                type="button"
                aria-label="Quitar foto del proyecto"
                onClick={() => {
                  if (!confirm("¿Quitar esta foto del proyecto y del texto?"))
                    return;
                  onChange((current) =>
                    current.filter((i) => i.id !== selected.id),
                  );
                  setActive(null);
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
            {onInsert && (
              <div className="insert-options">
                <span>Insertar en el texto:</span>
                {[
                  ["left", "Izquierda"],
                  ["wide", "Ancho completo"],
                  ["right", "Derecha"],
                ].map(([layout, label]) => (
                  <button
                    type="button"
                    key={layout}
                    onClick={() => onInsert(selected, layout)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
