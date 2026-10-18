import { useState } from "react";
export function UserAvatar({
  name,
  src,
  large = false,
}: {
  name: string;
  src?: string | null;
  large?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "V";
  return (
    <span
      className={`workspace-avatar${large ? " workspace-avatar-large" : ""}`}
      aria-hidden="true"
    >
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
