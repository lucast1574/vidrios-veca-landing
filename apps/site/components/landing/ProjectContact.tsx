"use client";
import { useRef, useState, type FormEvent } from "react";
import { spaces, WHATSAPP } from "./content";
import { Arrow } from "./Controls";
import { Select } from "@veca/ui/src/Select";
export function ProjectContact() {
  const [space, setSpace] = useState("");
  const [spaceError, setSpaceError] = useState("");
  const spaceTrigger = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [link, setLink] = useState(WHATSAPP);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!space) {
      setSpaceError("Selecciona el espacio de tu proyecto.");
      spaceTrigger.current?.focus();
      return;
    }
    const data = new FormData(event.currentTarget);
    const message = `Hola, Vidrios VECA. Soy ${String(data.get("name")).trim()}.\nQuiero consultar por: ${data.get("space")}.\nDistrito: ${String(data.get("district")).trim()}.\n\n${String(data.get("idea")).trim()}`;
    setLink(`${WHATSAPP}?text=${encodeURIComponent(message)}`);
    setReady(true);
  }
  return (
    <section
      className="ve-contact ve-section"
      id="contacto"
      aria-labelledby="ve-contact-title"
    >
      <div>
        <p className="ve-kicker">Hagamos espacio para tu idea</p>
        <h2 id="ve-contact-title">
          La próxima
          <br />
          vista es tuya.
        </h2>
        <p>
          Un ambiente, una casa, un edificio.
          <br />
          Todo empieza con una conversación.
        </p>
        <a
          className="ve-contact-phone"
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
        >
          +51 908 917 621 <Arrow />
        </a>
        <span className="ve-contact-note">
          WhatsApp Business · Atención en toda Lima
        </span>
      </div>
      <form
        className="ve-contact-form"
        onSubmit={prepare}
        onChange={() => setReady(false)}
      >
        <h3>Cuéntanos qué imaginas</h3>
        <div className="ve-field-row">
          <label>
            Tu nombre
            <input
              name="name"
              autoComplete="name"
              placeholder="¿Cómo te llamas?"
              required
              maxLength={100}
            />
          </label>
          <label>
            Distrito
            <input
              name="district"
              autoComplete="address-level2"
              placeholder="¿Dónde es el proyecto?"
              required
              maxLength={100}
            />
          </label>
        </div>
        <div className="ve-space-field">
          <label htmlFor="project-space">Tu espacio</label>
          <Select
            id="project-space"
            name="space"
            label="Tu espacio"
            value={space}
            triggerRef={spaceTrigger}
            error={spaceError}
            options={spaces.map((s) => ({
              value: s.name,
              label: s.name,
              description: s.details.join(" · "),
            }))}
            onChange={(value) => {
              setSpace(value);
              setSpaceError("");
              setReady(false);
            }}
          />
        </div>
        <label>
          La idea
          <textarea
            name="idea"
            placeholder="Qué quieres transformar, medidas aproximadas o detalles que tengas en mente…"
            rows={3}
            required
            maxLength={2000}
          />
        </label>
        <button className="ve-action" type="submit">
          Preparar mensaje <Arrow />
        </button>
        <p className="ve-form-note">
          Prepara tu consulta y compártela con nosotros por WhatsApp.
        </p>
        {ready && (
          <div className="ve-message-ready" role="status">
            <p>Tu mensaje está listo. Puedes añadir fotos al abrir el chat.</p>
            <a
              className="ve-action ve-action-light"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir WhatsApp <Arrow />
            </a>
          </div>
        )}
      </form>
    </section>
  );
}
