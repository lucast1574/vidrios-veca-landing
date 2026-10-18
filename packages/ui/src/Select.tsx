"use client";
import { useEffect, useId, useRef, useState, type Ref } from "react";
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};
/** A single keyboard-accessible select shared by the public site and editor. */
export function Select({
  id,
  name,
  label,
  value,
  options,
  onChange,
  placeholder = "Selecciona una opción",
  error,
  triggerRef,
}: {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const uid = useId();
  const listId = `${uid}-options`;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const search = useRef({ text: "", at: 0 });
  const selected = options.findIndex((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    const dismiss = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => {
    if (open)
      root.current
        ?.querySelector(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  function choose(index: number) {
    if (!options[index]) return;
    onChange(options[index].value);
    setOpen(false);
    button.current?.focus();
  }
  return (
    <div
      className={`veca-select${open ? " is-open" : ""}${error ? " has-error" : ""}`}
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={(el) => {
          button.current = el;
          if (typeof triggerRef === "function") triggerRef(el);
          else if (triggerRef) triggerRef.current = el;
        }}
        id={id}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${uid}-${active}` : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${uid}-error` : undefined}
        className="veca-select-trigger"
        onClick={() => {
          setActive(Math.max(selected, 0));
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            const start = open ? active : Math.max(selected, 0);
            setActive(
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? options.length - 1
                  : !open
                    ? start
                    : (start +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        options.length) %
                      options.length,
            );
            setOpen(true);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          } else if (e.key === "Tab") setOpen(false);
          else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open) choose(active);
            else {
              setActive(Math.max(selected, 0));
              setOpen(true);
            }
          } else if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            e.preventDefault();
            const now = Date.now();
            search.current = {
              text:
                (now - search.current.at > 700 ? "" : search.current.text) +
                e.key.toLocaleLowerCase(),
              at: now,
            };
            const index = options.findIndex((o) =>
              o.label.toLocaleLowerCase().startsWith(search.current.text),
            );
            if (index >= 0) {
              setActive(index);
              setOpen(true);
            }
          }
        }}
      >
        <span className={selected < 0 ? "veca-select-placeholder" : ""}>
          {options[selected]?.label || placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="veca-select-menu"
          id={listId}
          role="listbox"
          aria-label={label || "Opciones"}
        >
          {options.map((option, i) => (
            <div
              key={option.value}
              id={`${uid}-${i}`}
              role="option"
              aria-selected={value === option.value}
              data-option-index={i}
              className={`veca-select-option${active === i ? " is-active" : ""}`}
              onPointerMove={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              <span>
                <strong>{option.label}</strong>
                {option.description && <small>{option.description}</small>}
              </span>
              {value === option.value ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : (
                <span className="veca-select-option-mark" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="veca-select-error" id={`${uid}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
