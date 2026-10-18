"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WHATSAPP, questions } from "./landing/content";
import { Arrow, Action } from "./landing/Controls";
import { SolutionExplorer } from "./landing/SolutionExplorer";
import { ProjectContact } from "./landing/ProjectContact";
export function VecaLanding({ featured }: { featured: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      node.dataset.motion = preference.matches ? "reduced" : "full";
    };
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("ve-in-view");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    node.querySelectorAll(".ve-observe").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);
  return (
    <div className="ve-home" ref={root}>
      <header className="ve-header">
        <a
          className="ve-brand"
          href="#inicio"
          aria-label="Vidrios VECA, inicio"
        >
          <img
            src="/assets/logo.svg"
            alt="Vidrios VECA"
            width="128"
            height="83"
          />
        </a>
        <nav className="ve-desktop-nav" aria-label="Navegación principal">
          <a href="#soluciones">Soluciones</a>
          <a href="/proyectos/">Proyectos</a>
          <a href="#nosotros">Nosotros</a>
        </nav>
        <a className="ve-header-cta" href="#contacto">
          Hablemos de tu proyecto <Arrow />
        </a>
        <button
          ref={menuButton}
          className="ve-menu-button"
          aria-expanded={menuOpen}
          aria-controls="ve-menu"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
        <nav
          className="ve-mobile-nav"
          id="ve-menu"
          aria-label="Navegación móvil"
          hidden={!menuOpen}
        >
          {[
            ["Soluciones", "#soluciones"],
            ["Proyectos", "/proyectos/"],
            ["Nosotros", "#nosotros"],
            ["Tu proyecto", "#contacto"],
          ].map(([name, href]) => (
            <a key={name} href={href} onClick={() => setMenuOpen(false)}>
              {name}
              <Arrow />
            </a>
          ))}
        </nav>
      </header>
      <main id="contenido">
        <section className="ve-hero" id="inicio" aria-labelledby="ve-title">
          <div className="ve-hero-image">
            <img
              key={view}
              src={`/assets/${view === 0 ? "facade.webp" : "vivienda.webp"}`}
              alt={
                view === 0
                  ? "Perspectiva de una fachada acristalada hacia el cielo"
                  : "Vivienda abierta a la luz natural con ventanas amplias"
              }
              width="1600"
              height="1067"
              fetchPriority="high"
            />
            <div className="ve-hero-shade" />
          </div>
          <div className="ve-hero-content">
            <p className="ve-hero-location">
              <span />
              Vidrios VECA · Lima, Perú
            </p>
            <h1 id="ve-title">
              Tu espacio.
              <br />
              Otra perspectiva.
            </h1>
            <div className="ve-hero-bottom">
              <p>
                Transformamos ideas en espacios
                <br />
                que se abren a la luz.
              </p>
              <Action href="#soluciones">Descubre las posibilidades</Action>
            </div>
          </div>
          <div className="ve-glass-pane" aria-hidden="true">
            <span>
              La luz
              <br />
              lo cambia todo.
            </span>
            <svg viewBox="0 0 100 100" fill="none">
              <path
                d="M10 70 65 15h25L35 70H10Zm25 15 55-55v25L60 85H35Z"
                stroke="currentColor"
                strokeWidth=".7"
              />
            </svg>
          </div>
          <div
            className="ve-hero-controls"
            aria-label="Cambiar vista de inspiración"
          >
            <span>Una nueva forma de mirar</span>
            <div>
              {["Arquitectura", "Hogar"].map((name, i) => (
                <button
                  key={name}
                  aria-pressed={view === i}
                  onClick={() => setView(i)}
                >
                  {name}
                </button>
              ))}
            </div>
            <a href="#soluciones" aria-label="Bajar a soluciones">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M12 3v18m-7-7 7 7 7-7" />
              </svg>
            </a>
          </div>
        </section>
        <div className="ve-intro-band">
          <p>
            Vidrio que conecta.
            <br />
            <span>Espacios que se sienten.</span>
          </p>
          <div>
            <span>Viviendas</span>
            <span>Edificios</span>
            <span>Interiores</span>
            <span>Remodelaciones</span>
          </div>
        </div>
        {featured}
        <SolutionExplorer />
        <section
          className="ve-statement ve-observe"
          aria-labelledby="ve-statement-title"
        >
          <img
            src="/assets/detail.webp"
            alt="Detalle de ventanas y reflejos en una fachada de vidrio"
            width="1600"
            height="2398"
            loading="lazy"
          />
          <div className="ve-statement-overlay" />
          <div>
            <p className="ve-kicker">Más allá de una ventana</p>
            <h2 id="ve-statement-title">
              Hay espacios que
              <br />
              cambian cómo
              <br />
              te sientes.
            </h2>
            <p>
              La luz que entra. La vista que se abre.
              <br />
              El ambiente que vuelve a conectar.
            </p>
            <Action href="#contacto" light>
              Imaginemos el tuyo
            </Action>
          </div>
          <span className="ve-statement-mark" aria-hidden="true">
            VECA
          </span>
        </section>
        <section
          className="ve-about ve-section"
          id="nosotros"
          aria-labelledby="ve-about-title"
        >
          <div className="ve-about-copy">
            <p className="ve-kicker">Somos Vidrios VECA</p>
            <h2 id="ve-about-title">
              El detalle hace
              <br />
              la diferencia.
            </h2>
            <p>
              Somos una empresa de vidrios en Lima. Acompañamos proyectos de
              vivienda, edificios y remodelaciones con una idea clara: cada
              espacio merece una solución pensada para él.
            </p>
            <p>
              Desde nuestra sede en San Luis, atendemos toda Lima. Queremos
              conocer lo que imaginas y ayudarte a encontrar una manera de
              hacerlo posible.
            </p>
            <a className="ve-inline-link" href="#contacto">
              Conversemos sobre tu espacio <Arrow />
            </a>
          </div>
          <div className="ve-about-photo ve-observe">
            <img
              src="/assets/oficina.webp"
              alt="Oficina con ventanas amplias y divisiones de vidrio"
              width="1200"
              height="1600"
              loading="lazy"
            />
            <div>
              <span>Una idea compartida.</span>
              <strong>Una solución a tu medida.</strong>
            </div>
          </div>
        </section>
        <section
          className="ve-process ve-section"
          aria-labelledby="ve-process-title"
        >
          <div className="ve-section-head">
            <div>
              <p className="ve-kicker">De tu idea al siguiente paso</p>
              <h2 id="ve-process-title">
                Empecemos
                <br />
                con claridad.
              </h2>
            </div>
            <p>
              No necesitas tenerlo todo resuelto. Estos tres pasos nos ayudan a
              conocer tu proyecto.
            </p>
          </div>
          <ol>
            {[
              {
                title: "Muéstranos tu espacio",
                text: "Envíanos fotos, medidas aproximadas y la ubicación del proyecto.",
              },
              {
                title: "Cuéntanos tu idea",
                text: "Qué quieres cambiar, cómo usas el ambiente y qué resultado imaginas.",
              },
              {
                title: "Exploremos la solución",
                text: "Revisamos contigo las posibilidades y los detalles que necesita tu proyecto.",
              },
            ].map((step, i) => (
              <li key={step.title}>
                <span className="ve-step-number">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="ve-faq ve-section" aria-labelledby="ve-faq-title">
          <div>
            <p className="ve-kicker">Antes de empezar</p>
            <h2 id="ve-faq-title">
              Resolvamos
              <br />
              tus dudas.
            </h2>
            <a
              className="ve-inline-link"
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tengo otra consulta <Arrow />
            </a>
          </div>
          <div className="ve-questions">
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <ProjectContact />
      </main>
      <footer className="ve-footer">
        <div>
          <a
            className="ve-brand"
            href="#inicio"
            aria-label="Vidrios VECA, volver al inicio"
          >
            <img
              src="/assets/logo.svg"
              alt="Vidrios VECA"
              width="128"
              height="83"
            />
          </a>
          <p>
            Una nueva forma
            <br />
            de ver tu espacio.
          </p>
        </div>
        <nav aria-label="Navegación de pie de página">
          <a href="#soluciones">Soluciones</a>
          <a href="/proyectos/">Proyectos</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="ve-footer-bottom">
          <span>© {new Date().getFullYear()} Vidrios VECA</span>
          <span>San Luis, Lima · Atención en toda Lima</span>
          <a href="#inicio">
            Volver arriba <Arrow />
          </a>
        </div>
      </footer>
    </div>
  );
}
