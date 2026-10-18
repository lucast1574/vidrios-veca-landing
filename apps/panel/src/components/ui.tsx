import {
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
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
  const generatedId = useId();
  const native =
    isValidElement(children) &&
    ["input", "textarea"].includes(String(children.type));
  const child = children as ReactElement<{ id?: string }>;
  const controlId =
    htmlFor || (native ? child.props.id || generatedId : undefined);
  return (
    <div className="field">
      <label htmlFor={controlId}>{label}</label>
      {native ? cloneElement(child, { id: controlId }) : children}
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
