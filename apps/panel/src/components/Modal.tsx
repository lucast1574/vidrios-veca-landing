import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const id = useId(),
    dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      [
        ...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        ) || []),
      ].filter((el) => el.getClientRects().length);
    (focusables()[0] || dialog.current)?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const items = focusables(),
          first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [busy, onClose]);
  return (
    <div
      className="ve-modal-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="ve-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        aria-describedby={description ? id + "-description" : undefined}
        ref={dialog}
        tabIndex={-1}
      >
        <header>
          <div>
            <h2 id={id}>{title}</h2>
            {description && <p id={id + "-description"}>{description}</p>}
          </div>
          <button
            type="button"
            className="ops-icon-button"
            aria-label="Cerrar ventana"
            onClick={onClose}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <div className="ve-modal-body">{children}</div>
        {footer}
      </div>
    </div>
  );
}
