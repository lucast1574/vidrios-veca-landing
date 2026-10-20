import { Icon } from "@veca/ui/src/Icon";

export function TeamAccess({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <a
      className="ve-team-access"
      href="https://panel.veca.com.pe"
      onClick={onNavigate}
    >
      <span className="ve-team-access-label">
        <Icon name="user" size={16} />
        Acceso al equipo
      </span>
      <Icon name="arrow-up-right" size={16} />
    </a>
  );
}
