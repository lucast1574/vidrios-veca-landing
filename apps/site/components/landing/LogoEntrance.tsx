"use client";
import { Icon } from "@veca/ui/src/Icon";

import { useEffect, useState } from "react";
/** An introduction, not a loader: content is ready and CSS always dismisses it. */
export function LogoEntrance() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (
      location.hash ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem("veca-entrance-v2")) {
        setVisible(false);
        return;
      }
      sessionStorage.setItem("veca-entrance-v2", "seen");
    } catch {
      /* The entrance works without browser storage. */
    }
    const timer = setTimeout(() => setVisible(false), 1900);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="ve-logo-entrance"
      onAnimationEnd={(e) => {
        if (e.animationName === "ve-entrance-exit") setVisible(false);
      }}
    >
      <div className="ve-entrance-composition" aria-hidden="true">
        <span className="ve-entrance-pane ve-entrance-pane-one" />
        <span className="ve-entrance-pane ve-entrance-pane-two" />
        <img src="/assets/logo.svg" alt="" width="184" height="120" />
        <p>Una nueva forma de mirar.</p>
        <span className="ve-entrance-line" />
      </div>
      <button type="button" onClick={() => setVisible(false)}>
        Entrar al sitio{" "}
        <span aria-hidden="true">
          <Icon name="arrow-up-right" />
        </span>
      </button>
    </div>
  );
}
