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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        <path d="M8 8c0 4 4 8 8 8l1-2-3-1-1 1-3-3 1-1-1-3-2 1Z" />
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
