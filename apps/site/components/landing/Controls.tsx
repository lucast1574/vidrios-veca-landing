import type { ReactNode } from "react";
export function Arrow({ direction = "up" }: { direction?: "up" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d={
          direction === "up" ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"
        }
      />
    </svg>
  );
}
export function Action({
  children,
  href,
  light = false,
}: {
  children: ReactNode;
  href: string;
  light?: boolean;
}) {
  return (
    <a className={`ve-action${light ? " ve-action-light" : ""}`} href={href}>
      {children}
      <Arrow />
    </a>
  );
}
