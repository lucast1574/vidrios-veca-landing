"use client";
import { useRef, useState } from "react";
import { spaces } from "./content";
import { Action, Arrow } from "./Controls";
export function SolutionExplorer() {
  const [active, setActive] = useState(0);
  const item = spaces[active];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  function select(index: number) {
    setActive(index);
    tabs.current[index]?.focus();
  }
  return (
    <section
      className="ve-solutions ve-section"
      id="soluciones"
      aria-labelledby="ve-solutions-title"
    >
      <div className="ve-section-head">
        <div>
          <p className="ve-kicker">Diseñado para tu manera de vivir</p>
          <h2 id="ve-solutions-title">
            Un material.
            <br />
            Todas tus posibilidades.
          </h2>
        </div>
        <p>
          Encuentra el punto de partida para tu proyecto. Elige un espacio y
          descubre cómo podemos ayudarte.
        </p>
      </div>
      <div
        className="ve-tabs"
        role="tablist"
        aria-label="Soluciones por espacio"
      >
        {spaces.map((space, i) => (
          <button
            key={space.name}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`ve-tab-${i}`}
            role="tab"
            aria-selected={active === i}
            aria-controls="ve-solution-panel"
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (i + 1) % spaces.length
                  : e.key === "ArrowLeft"
                    ? (i + spaces.length - 1) % spaces.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? spaces.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                select(next);
              }
            }}
          >
            {space.name}
            <Arrow />
          </button>
        ))}
      </div>
      <div
        className="ve-explorer"
        id="ve-solution-panel"
        role="tabpanel"
        aria-labelledby={`ve-tab-${active}`}
        tabIndex={0}
      >
        <div className="ve-explorer-photo">
          <img
            key={item.image}
            src={`/assets/${item.image}`}
            alt={item.alt}
            width="1600"
            height="1067"
            loading="lazy"
          />
          <span className="ve-photo-note">Espacios para inspirar tu idea</span>
        </div>
        <div className="ve-explorer-copy" key={item.name}>
          <span className="ve-small-label">{item.name}</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <ul>
            {item.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <Action href={item.href}>Explorar esta solución</Action>
        </div>
      </div>
    </section>
  );
}
