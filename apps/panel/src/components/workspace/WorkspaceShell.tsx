import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Globe,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@veca/content";
import { Modal } from "../Modal";
import { UserAvatar } from "./UserAvatar";
import { WORKSPACE_ITEMS, VIEW_LABELS, type WorkspaceView } from "./navigation";
import "./workspace-shell.css";
function NavigationItem({
  label,
  Icon,
  active,
  collapsed,
  count,
  onClick,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  count?: number;
  onClick: () => void;
}) {
  const id = useId();
  const [tip, setTip] = useState<{ left: number; top: number } | null>(null);
  const clear = useCallback(() => setTip(null), []);
  useEffect(() => {
    if (!tip) return;
    window.addEventListener("resize", clear);
    window.addEventListener("scroll", clear, true);
    return () => {
      window.removeEventListener("resize", clear);
      window.removeEventListener("scroll", clear, true);
    };
  }, [tip, clear]);
  function show(target: HTMLElement) {
    if (!collapsed) return;
    const rect = target.getBoundingClientRect();
    setTip({ left: rect.right + 12, top: rect.top + rect.height / 2 });
  }
  return (
    <>
      <button
        type="button"
        className={`workspace-link${active ? " is-current" : ""}`}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        aria-describedby={tip ? id : undefined}
        onClick={() => {
          clear();
          onClick();
        }}
        onPointerEnter={(e) => show(e.currentTarget)}
        onPointerLeave={clear}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={clear}
        onKeyDown={(e) => {
          if (e.key === "Escape") clear();
        }}
      >
        <span className="workspace-link-icon">
          <Icon size={20} strokeWidth={1.7} />
        </span>
        <span className="workspace-link-label">{label}</span>
        {!!count && <span className="workspace-count">{count}</span>}
      </button>
      {tip &&
        collapsed &&
        createPortal(
          <span className="workspace-tip" role="tooltip" id={id} style={tip}>
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
export function WorkspaceShell({
  user,
  view,
  projectCount,
  detail,
  onNavigate,
  children,
}: {
  user: SessionUser;
  view: WorkspaceView;
  projectCount: number;
  detail?: string;
  onNavigate: (view: WorkspaceView) => boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("veca.sidebar.collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => {
    try {
      localStorage.setItem("veca.sidebar.collapsed", String(collapsed));
    } catch {
      /* Navigation still works when storage is unavailable. */
    }
  }, [collapsed]);
  useEffect(() => {
    const screen = window.matchMedia("(max-width: 760px)");
    const change = () => {
      if (!screen.matches) closeMobile();
    };
    screen.addEventListener("change", change);
    return () => screen.removeEventListener("change", change);
  }, [closeMobile]);
  const active = user.status === "active" && user.emailVerified;
  const items = WORKSPACE_ITEMS.filter(
    (item) => active && user.permissions.includes(item.id),
  );
  function go(next: WorkspaceView) {
    if (onNavigate(next)) closeMobile();
  }
  function contents(compact: boolean) {
    return (
      <>
        <div className="workspace-brand-row">
          <button
            className="workspace-brand"
            onClick={() => go(items[0]?.id || "profile")}
            aria-label="Inicio de VECA"
          >
            <img src="/assets/favicon.svg" alt="" width="40" height="40" />
            <span>
              <strong>
                VECA<span className="workspace-brand-dot">.</span>
              </strong>
              <small>Gestión de la empresa</small>
            </span>
          </button>
          <button
            className="workspace-collapse"
            aria-label={
              collapsed ? "Expandir navegación" : "Contraer navegación"
            }
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
        <nav className="workspace-navigation" aria-label="Navegación principal">
          {["Seguimiento", "Empresa"].map((group) => {
            const grouped = items.filter((item) => item.group === group);
            return grouped.length ? (
              <div className="workspace-nav-group" key={group}>
                <p>{group}</p>
                {grouped.map((item) => (
                  <NavigationItem
                    key={item.id}
                    label={item.label}
                    Icon={item.Icon}
                    active={view === item.id}
                    collapsed={compact}
                    count={item.id === "projects" ? projectCount : undefined}
                    onClick={() => go(item.id)}
                  />
                ))}
              </div>
            ) : null;
          })}
          {!items.length && (
            <p className="workspace-access-note">
              {active
                ? "Tu cuenta no tiene áreas habilitadas. Consulta al administrador."
                : "Tu perfil está disponible mientras se revisa tu acceso."}
            </p>
          )}
        </nav>
        <footer className="workspace-nav-footer">
          <a
            className="workspace-site"
            href="https://veca.com.pe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir sitio web de VECA"
          >
            <Globe size={18} />
            <span>Ver sitio web</span>
            <ArrowUpRight size={15} />
          </a>
          <button
            type="button"
            className={`workspace-profile-link${view === "profile" ? " is-current" : ""}`}
            onClick={() => go("profile")}
            aria-label="Mi perfil"
            aria-current={view === "profile" ? "page" : undefined}
          >
            <UserAvatar name={user.name} src={user.avatarUrl} />
            <span className="workspace-profile-copy">
              <strong>{user.name}</strong>
              <small>
                Mi perfil <span>{user.roleName || "Sin rol asignado"}</span>
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
        </footer>
      </>
    );
  }
  return (
    <div className={`workspace-shell${collapsed ? " is-collapsed" : ""}`}>
      <a
        className="workspace-skip"
        href="#workspace-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("workspace-content")?.focus();
        }}
      >
        Ir al contenido
      </a>
      <aside className="workspace-sidebar" aria-label="Espacio de trabajo">
        {contents(collapsed)}
        {collapsed && (
          <button
            className="workspace-expand"
            aria-label="Expandir navegación"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
      </aside>
      <div className="studio-body">
        <header className="workspace-header">
          <button
            className="workspace-menu"
            aria-label="Abrir navegación"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>
          <nav aria-label="Ubicación actual">
            <span>Tu espacio</span>
            <ChevronRight size={14} />
            <strong>{VIEW_LABELS[view]}</strong>
            {detail && (
              <>
                <ChevronRight size={14} />
                <span>{detail}</span>
              </>
            )}
          </nav>
          <button
            className="workspace-header-profile"
            aria-label="Abrir mi perfil"
            onClick={() => go("profile")}
          >
            <UserRound size={17} />
            <span>{user.roleName || "Mi cuenta"}</span>
          </button>
        </header>
        <div id="workspace-content" tabIndex={-1}>
          {children}
        </div>
      </div>
      {mobileOpen && (
        <Modal
          className="workspace-mobile-drawer"
          title="Tu espacio VECA"
          onClose={closeMobile}
        >
          <div className="workspace-drawer-content">{contents(false)}</div>
        </Modal>
      )}
    </div>
  );
}
