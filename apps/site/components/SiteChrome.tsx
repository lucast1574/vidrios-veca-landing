"use client";
import { useState } from "react";
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Vidrios VECA, inicio">
        <img
          src="/assets/logo.svg"
          alt="Vidrios VECA"
          width="128"
          height="83"
        />
      </a>
      <nav className="desktop-nav" aria-label="Navegación principal">
        <a href="/proyectos/">Proyectos</a>
        <a href="/#soluciones">Soluciones</a>
        <a href="/#nosotros">Nosotros</a>
      </nav>
      <a
        className="nav-cta"
        href="https://wa.me/51908917621"
        target="_blank"
        rel="noopener noreferrer"
      >
        Hablemos de tu proyecto <span>↗</span>
      </a>
      <button
        className="menu-toggle"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="site-mobile"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
      </button>
      <nav
        id="site-mobile"
        className="mobile-nav"
        hidden={!open}
        aria-label="Navegación móvil"
      >
        <a href="/proyectos/">Proyectos</a>
        <a href="/#soluciones">Soluciones</a>
        <a href="/#nosotros">Nosotros</a>
        <a href="/#contacto">Tu proyecto</a>
      </nav>
    </header>
  );
}
export function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href="https://wa.me/51908917621"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir chat de WhatsApp con Vidrios VECA"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.25-1.64a11.94 11.94 0 0 0 5.8 1.48h.01C18.65 23.84 24 18.49 24 11.91c0-3.19-1.24-6.18-3.48-8.43ZM12.06 21.82a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.88 9.88 0 0 1-1.51-5.28c0-5.46 4.44-9.9 9.89-9.9a9.82 9.82 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.89-9.91 9.89Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.48-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61l.45-.52c.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"
        />
      </svg>
    </a>
  );
}
export function SiteFooter() {
  return (
    <footer>
      <a className="brand" href="/" aria-label="Vidrios VECA, inicio">
        <img
          src="/assets/logo.svg"
          alt="Vidrios VECA"
          width="128"
          height="83"
        />
      </a>
      <p>Una nueva forma de ver tu espacio.</p>
      <a
        className="footer-whatsapp"
        href="https://wa.me/51908917621"
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp · +51 908 917 621
      </a>
      <span>VIDRIOS VECA · LIMA, PERÚ · 2026</span>
    </footer>
  );
}
