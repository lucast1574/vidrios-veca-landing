import { Icon } from "@veca/ui/src/Icon";
import type { ReactNode } from "react";
export function Arrow({ direction = "up" }: { direction?: "up" | "right" }) {
  return (
    <Icon
      name={direction === "up" ? "arrow-up-right" : "arrow-right"}
      size={24}
    />
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
