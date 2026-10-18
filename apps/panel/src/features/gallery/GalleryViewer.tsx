import { useCallback, useRef, useState } from "react";
import type { GalleryPhoto, PhotoMetadata } from "@veca/content";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Pencil,
  Presentation,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import { Modal } from "../../components/Modal";
import { Button, Notice } from "../../components/ui";
import { API_BASE, api } from "../../lib/api";
import { PhotoMetadataFields } from "./PhotoMetadataFields";
export function GalleryViewer({
  initial,
  photos,
  canOpenLead,
  onClose,
  onSaved,
}: {
  initial: GalleryPhoto;
  photos: GalleryPhoto[];
  canOpenLead: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selection, setSelection] = useState(photos);
  const [photo, setPhoto] = useState(initial),
    [editing, setEditing] = useState(false),
    [presenting, setPresenting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<PhotoMetadata>({
    caption: initial.caption,
    tags: initial.tags,
    sharing: initial.sharing,
  });
  const latest = useRef({ dirty: false, busy: false });
  latest.current = {
    dirty:
      editing &&
      JSON.stringify(draft) !==
        JSON.stringify({
          caption: photo.caption,
          tags: photo.tags,
          sharing: photo.sharing,
        }),
    busy,
  };
  const close = useCallback(() => {
    if (
      !latest.current.busy &&
      (!latest.current.dirty ||
        confirm("¿Cerrar sin guardar los cambios de esta foto?"))
    )
      onClose();
  }, [onClose]);
  const candidates = presenting
    ? selection.filter((p) => p.sharing === "clients")
    : selection;
  const index = candidates.findIndex((p) => p.id === photo.id);
  function move(delta: number) {
    const next = candidates[index + delta];
    if (next) {
      setPhoto(next);
      setError("");
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await api<GalleryPhoto>(
        `/admin/gallery/photos/${photo.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ ...draft, revision: photo.revision }),
        },
      );
      const updated = { ...photo, ...result, url: photo.url };
      setPhoto(updated);
      setSelection((old) =>
        old.map((p) => (p.id === updated.id ? updated : p)),
      );
      setEditing(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      size="wide"
      title={
        presenting
          ? "Una nueva perspectiva para tu espacio"
          : photo.caption || "Fotografía de obra"
      }
      description={
        presenting
          ? "Vidrios VECA"
          : "Galería privada · Esta imagen no está publicada en la web"
      }
      onClose={close}
      busy={busy}
    >
      <div
        className="gallery-viewer"
        onKeyDown={(e) => {
          if (
            editing ||
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target as HTMLElement).closest('[role="combobox"]')
          )
            return;
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            move(e.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div className="gallery-viewer-photo">
          <img
            src={API_BASE + photo.url}
            alt={photo.caption || "Fotografía de obra VECA"}
          />
        </div>
        {!editing && (
          <div className="gallery-viewer-navigation">
            <Button
              variant="ghost"
              disabled={index <= 0}
              onClick={() => move(-1)}
              aria-label="Foto anterior"
            >
              <ArrowLeft size={18} />
            </Button>
            <span>
              {index + 1} / {candidates.length} en esta selección
            </span>
            <Button
              variant="ghost"
              disabled={index < 0 || index >= candidates.length - 1}
              onClick={() => move(1)}
              aria-label="Foto siguiente"
            >
              <ArrowRight size={18} />
            </Button>
          </div>
        )}
        {presenting ? (
          <div className="gallery-presentation-caption">
            <p>{photo.caption}</p>
            <Button variant="ghost" onClick={() => setPresenting(false)}>
              Volver a la galería privada
            </Button>
          </div>
        ) : editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <fieldset disabled={busy} className="gallery-edit-fields">
              <PhotoMetadataFields value={draft} onChange={setDraft} />
            </fieldset>
            {error && <Notice error>{error}</Notice>}
            <div className="gallery-viewer-actions">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Guardar foto"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="gallery-detail-summary">
              <span className={`photo-use photo-use-${photo.sharing}`}>
                {photo.sharing === "clients" ? (
                  <ShieldCheck size={15} />
                ) : (
                  <LockKeyhole size={15} />
                )}{" "}
                {photo.sharing === "clients"
                  ? "Autorizada para mostrar a clientes"
                  : "Solo uso interno"}
              </span>
              <span>
                {photo.lead.name} · {photo.lead.district}
              </span>
            </div>
            <div className="gallery-photo-tags">
              {photo.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="gallery-viewer-actions">
              {canOpenLead && (
                <a href={`#leads/${photo.leadId}`} onClick={close}>
                  <ExternalLink size={15} /> Abrir ficha de origen
                </a>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft({
                    caption: photo.caption,
                    tags: photo.tags,
                    sharing: photo.sharing,
                  });
                  setEditing(true);
                }}
              >
                <Pencil size={15} /> Editar etiquetas y uso
              </Button>
              {photo.sharing === "clients" && (
                <Button onClick={() => setPresenting(true)}>
                  <Presentation size={16} /> Mostrar al cliente
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
