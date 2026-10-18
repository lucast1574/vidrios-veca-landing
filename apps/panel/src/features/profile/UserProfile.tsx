import { useState, type ReactNode } from "react";
import {
  Check,
  ShieldCheck,
  Mail,
  LogOut,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import type { SessionUser } from "@veca/content";
import { Button, Notice } from "../../components/ui";
import { PhotoSettings } from "./PhotoSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import {
  WORKSPACE_ITEMS,
  type WorkspaceView,
} from "../../components/workspace/navigation";
import "./profile.css";
const accountStatus = {
  active: "Acceso activo",
  pending: "Aprobación pendiente",
  rejected: "Acceso no aprobado",
  suspended: "Acceso suspendido",
};
function ProfileField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="profile-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
export function UserProfile({
  user,
  onLogout,
  onNavigate,
  onUpdate,
}: {
  user: SessionUser;
  onUpdate: (user: SessionUser) => void;
  onLogout: () => Promise<void>;
  onNavigate: (view: WorkspaceView) => unknown;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const available = WORKSPACE_ITEMS.filter((item) =>
    user.permissions.includes(item.id),
  );
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await onLogout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="profile-page">
      <header className="profile-page-heading">
        <p>Mi perfil</p>
        <h1>Tu lugar en VECA.</h1>
        <span>Tu información, tu acceso y tu cuenta, en un solo espacio.</span>
      </header>
      <div className="profile-layout">
        <div className="profile-account">
          <section className="profile-identity" aria-labelledby="profile-name">
            <PhotoSettings user={user} onUpdate={onUpdate} />
            <h2 id="profile-name">{user.name}</h2>
            <p className="profile-email">{user.email || user.username}</p>
            <span className={`profile-account-state state-${user.status}`}>
              <span />
              {accountStatus[user.status]}
            </span>
            <dl className="profile-identity-details">
              <ProfileField label="Rol en la empresa">
                {user.roleName || "Por asignar"}
              </ProfileField>
              <ProfileField label="Verificación del correo">
                {user.emailVerified ? (
                  <>
                    <Check size={15} />
                    Correo verificado
                  </>
                ) : (
                  "Pendiente de verificación"
                )}
              </ProfileField>
            </dl>
            <div className="profile-identity-note">
              <ShieldCheck size={18} />
              <p>
                Tu rol y tus permisos los administra el equipo autorizado de
                VECA.
              </p>
            </div>
          </section>
          <div className="profile-session">
            <Button
              variant="ghost"
              onClick={() => void logout()}
              disabled={busy}
            >
              <LogOut size={16} />
              {busy ? "Cerrando sesión…" : "Cerrar sesión"}
            </Button>
          </div>
          {error && <Notice error>{error}</Notice>}
        </div>
        <div className="profile-main">
          <section
            className="profile-section"
            aria-labelledby="profile-info-heading"
          >
            <div className="profile-section-heading">
              <Mail size={20} />
              <div>
                <h2 id="profile-info-heading">Información de tu cuenta</h2>
                <p>Los datos con los que te reconoce tu equipo.</p>
              </div>
            </div>
            <dl className="profile-data-grid">
              <ProfileField label="Nombre completo">{user.name}</ProfileField>
              <ProfileField label="Correo electrónico">
                {user.email || "No registrado"}
              </ProfileField>
              <ProfileField label="Usuario">{user.username}</ProfileField>
              <ProfileField label="Método de acceso">
                {(user.authMethods || [])
                  .map((method) =>
                    method === "google" ? "Google" : "Correo y contraseña",
                  )
                  .join(" / ") || "Por configurar"}
              </ProfileField>
              {user.accountCreatedAt && (
                <ProfileField label="En VECA desde">
                  <CalendarDays size={15} />
                  {new Intl.DateTimeFormat("es-PE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "America/Lima",
                  }).format(new Date(user.accountCreatedAt))}
                </ProfileField>
              )}
            </dl>
          </section>
          <section
            className="profile-section"
            aria-labelledby="profile-access-heading"
          >
            <div className="profile-section-heading">
              <ShieldCheck size={20} />
              <div>
                <h2 id="profile-access-heading">Tu espacio de trabajo</h2>
                <p>
                  {available.length
                    ? "Estas son las áreas disponibles para tu rol."
                    : "Tus áreas aparecerán cuando se apruebe y configure tu acceso."}
                </p>
              </div>
            </div>
            {!!available.length && (
              <div className="profile-area-list">
                {available.map(({ id, label, description, Icon }) => (
                  <button key={id} onClick={() => onNavigate(id)}>
                    <Icon size={19} />
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
            )}
          </section>
          <AppearanceSettings />
          <p className="profile-privacy">
            Tu información permanece en el espacio privado de VECA.{" "}
            <a
              href="https://veca.com.pe/privacidad/"
              target="_blank"
              rel="noreferrer"
            >
              Política de privacidad
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
