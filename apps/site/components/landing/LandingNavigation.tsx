"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Arrow } from "./Controls";
const destinations = [
  {
    name: "Soluciones",
    detail: "Encuentra lo que necesita tu espacio",
    href: "#soluciones",
  },
  { name: "Proyectos", detail: "Conoce nuestro trabajo", href: "/proyectos/" },
  { name: "Nosotros", detail: "La mirada detrás de VECA", href: "#nosotros" },
  {
    name: "Tu proyecto",
    detail: "Empecemos una conversación",
    href: "#contacto",
  },
];
export function LandingNavigation() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    navigation.current?.querySelector("a")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }
    };
    const focusOutside = (event: FocusEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", focusOutside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", focusOutside);
    };
  }, [open]);
  function move(event: KeyboardEvent<HTMLElement>) {
    const links = [...(navigation.current?.querySelectorAll("a") || [])];
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % links.length;
    else if (event.key === "ArrowUp")
      next = (index - 1 + links.length) % links.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = links.length - 1;
    else return;
    event.preventDefault();
    links[next]?.focus();
  }
  return (
    <div className="ve-navigation" ref={container}>
      {open && (
        <nav
          className="ve-navigation-panel"
          id="ve-navigation"
          aria-label="Navegación principal"
          ref={navigation}
          onKeyDown={move}
        >
          <p>Una nueva perspectiva</p>
          {destinations.map(({ name, detail, href }) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              <span>
                <strong>{name}</strong>
                <small>{detail}</small>
              </span>
              <Arrow />
            </a>
          ))}
          <span className="ve-navigation-signature">
            Vidrios VECA · Lima, Perú
          </span>
        </nav>
      )}
      <button
        className="ve-navigation-trigger"
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? "ve-navigation" : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="ve-navigation-symbol" aria-hidden="true">
          <span />
          <span />
        </span>
        {open ? "Cerrar" : "Explorar"}
      </button>
    </div>
  );
}
