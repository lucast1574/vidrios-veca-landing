import type { ButtonHTMLAttributes, ReactNode } from "react";
export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`notice ${error ? "notice-error" : ""}`}
    >
      {children}
    </p>
  );
}
export function Status({
  published,
  changed = false,
}: {
  published: boolean;
  changed?: boolean;
}) {
  return (
    <span className={`status ${published ? "status-live" : ""}`}>
      {published
        ? changed
          ? "Cambios sin publicar"
          : "Publicado"
        : "Borrador"}
    </span>
  );
}
