export function UserAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
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
      {initials}
    </span>
  );
}
