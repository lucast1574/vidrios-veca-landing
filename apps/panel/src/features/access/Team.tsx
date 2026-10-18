import { useCallback, useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Search,
  Check,
  UserRoundCheck,
  Pause,
} from "lucide-react";
import {
  type RoleDefinition,
  type UserSummary,
  type Role,
} from "@veca/content";
import { UserAvatar } from "../../components/workspace/UserAvatar";
import { Select } from "@veca/ui/src/Select";
import { api } from "../../lib/api";
import { Button, Notice } from "../../components/ui";
import { Modal } from "../../components/Modal";
type List = {
  roles: RoleDefinition[];
  items: UserSummary[];
  pending: number;
  total: number;
  page: number;
};
const statuses: Record<string, string> = {
  active: "Acceso activo",
  pending: "Pendiente",
  rejected: "No aprobado",
  suspended: "Suspendido",
};
export function Team({ currentId }: { currentId: string }) {
  const [data, setData] = useState<List | null>(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<UserSummary | null>(null),
    [role, setRole] = useState<Role>(""),
    [status, setStatus] = useState("active"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const close = useCallback(() => {
    setSelected(null);
    setError("");
  }, []);
  const refresh = useCallback(() => {
    void api<List>(`/admin/users?search=${encodeURIComponent(search)}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [search]);
  useEffect(() => {
    const timer = setTimeout(refresh, 250);
    return () => clearTimeout(timer);
  }, [refresh]);
  async function more() {
    if (!data) return;
    try {
      const next = await api<List>(
        `/admin/users?search=${encodeURIComponent(search)}&page=${data.page + 1}`,
      );
      setData({ ...next, items: [...data.items, ...next.items] });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function edit(user: UserSummary) {
    setSelected(user);
    setRole(
      user.role && data?.roles.some((r) => r.id === user.role) ? user.role : "",
    );
    setStatus(
      user.status === "active"
        ? "active"
        : user.status === "pending"
          ? "active"
          : user.status,
    );
    setError("");
  }
  async function save() {
    if (!selected || !role) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/users/${selected.id}`, {
        method: "PUT",
        body: JSON.stringify({ role, status, revision: selected.revision }),
      });
      setSelected(null);
      setNotice(
        "Acceso actualizado. El cambio de permisos se aplica también a las sesiones abiertas.",
      );
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = (data?.items || []).filter(
    (u) => filter === "all" || u.status === filter,
  );
  return (
    <main className="ops-page team-page">
      <div className="ops-heading">
        <div>
          <p>Personas y permisos</p>
          <h1>
            El equipo detrás
            <br />
            de cada obra.
          </h1>
          <span>
            Aprueba solicitudes y asigna el espacio que necesita cada persona.
          </span>
        </div>
        <div className="team-counter">
          <UserRoundCheck size={22} />
          <strong>{data?.pending || 0}</strong>
          <span>solicitudes verificadas</span>
        </div>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {error && !selected && <Notice error>{error}</Notice>}
      <div className="ops-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar personas"
            placeholder="Nombre o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Select
          label="Filtrar estado de acceso"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todo el equipo" },
            { value: "pending", label: "Pendientes de aprobación" },
            { value: "active", label: "Accesos activos" },
            { value: "suspended", label: "Suspendidos" },
            { value: "rejected", label: "No aprobados" },
          ]}
        />
      </div>
      <div className="team-grid">
        {filtered.map((user) => (
          <article className="team-card" key={user.id}>
            <div className="team-card-top">
              <UserAvatar name={user.name} src={user.avatarUrl} />
              <span className={`team-state state-${user.status}`}>
                {statuses[user.status]}
              </span>
            </div>
            <h2>{user.name}</h2>
            <p>{user.email || user.username}</p>
            <span className="team-role">
              <ShieldCheck size={14} />
              {user.roleName || "Sin rol asignado"}
            </span>
            <div className="team-card-meta">
              <span>
                {user.emailVerified
                  ? "Correo verificado"
                  : "Debe verificar su correo"}
              </span>
              <span>
                {user.provider === "google" ? "Google" : "Correo y contraseña"}
              </span>
            </div>
            <Button
              variant={user.status === "pending" ? "primary" : "ghost"}
              disabled={user.id === currentId || !user.emailVerified}
              onClick={() => edit(user)}
            >
              {user.id === currentId
                ? "Tu cuenta"
                : user.status === "pending"
                  ? "Revisar solicitud"
                  : "Editar acceso"}
            </Button>
          </article>
        ))}
      </div>
      {data && !filtered.length && (
        <div className="workspace-empty">
          <Users size={30} />
          <h2>Todo al día por aquí.</h2>
          <p>No hay personas que coincidan con este filtro.</p>
        </div>
      )}
      {data && data.items.length < data.total && (
        <Button variant="ghost" onClick={() => void more()}>
          Cargar más personas
        </Button>
      )}
      {selected && (
        <Modal
          title={
            selected.status === "pending"
              ? "Dale un lugar en el equipo"
              : "Editar acceso"
          }
          description={`${selected.name} · ${selected.email || selected.username}`}
          onClose={close}
          busy={busy}
          footer={
            <footer className="ve-modal-actions">
              <Button variant="ghost" onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={() => void save()} disabled={busy || !role}>
                {status === "active" ? (
                  <ShieldCheck size={16} />
                ) : (
                  <Pause size={16} />
                )}{" "}
                {busy
                  ? "Guardando…"
                  : status === "active"
                    ? "Confirmar acceso"
                    : "Guardar estado"}
              </Button>
            </footer>
          }
        >
          {error && <Notice error>{error}</Notice>}
          <fieldset className="role-picker">
            <legend>¿Qué necesita hacer esta persona?</legend>
            {data?.roles.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-pressed={role === r.id}
                onClick={() => setRole(r.id)}
                disabled={busy}
                className={role === r.id ? "selected" : ""}
              >
                <span>
                  <strong>{r.name}</strong>
                  <small>{r.description}</small>
                </span>
                {role === r.id ? (
                  <Check size={18} />
                ) : (
                  <span className="role-empty-mark" />
                )}
              </button>
            ))}
          </fieldset>
          <p className="role-sections">
            Secciones:{" "}
            {data?.roles
              .find((r) => r.id === role)
              ?.permissions.map(
                (p) =>
                  ({
                    dashboard: "Resumen",
                    projects: "Proyectos",
                    leads: "Leads",
                    gallery: "Galería",
                    inventory: "Inventario",
                    users: "Equipo",
                  })[p],
              )
              .join(" · ")}
          </p>
          <div className="role-status">
            <Select
              label="Estado del acceso"
              value={status}
              onChange={setStatus}
              options={[
                {
                  value: "active",
                  label: "Aprobar acceso",
                  description: "Puede entrar con el rol seleccionado",
                },
                {
                  value: "suspended",
                  label: "Suspender acceso",
                  description: "Conserva la cuenta, sin acceso a la operación",
                },
                {
                  value: "rejected",
                  label: "No aprobar",
                  description: "La solicitud no recibirá acceso",
                },
              ]}
            />
          </div>
        </Modal>
      )}
    </main>
  );
}
