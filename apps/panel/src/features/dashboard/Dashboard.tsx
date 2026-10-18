import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Package,
  Users,
  Layers3,
  Kanban,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { LEAD_STAGES, type SessionUser } from "@veca/content";
import { api } from "../../lib/api";
import { Notice } from "../../components/ui";
import {
  useLiveRefresh,
  date,
  stageName,
  amount,
  unitName,
} from "../operations/shared";
type Summary = {
  stages: Record<string, number>;
  recent: { id: string; name: string; stage: string; district: string }[];
  upcoming: {
    id: string;
    name: string;
    appointment: string;
    district: string;
  }[];
  lowStock: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    balance: number;
    minimum: number;
  }[];
  publishedProjects: number | null;
  pendingUsers: number | null;
  mail?: { configured: boolean; pending: number };
};
export function Dashboard({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Summary | null>(null),
    [error, setError] = useState("");
  const refresh = useCallback(() => {
    void api<Summary>("/admin/dashboard")
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(refresh, [refresh]);
  useLiveRefresh(refresh);
  if (!data)
    return (
      <main className="ops-page">
        <h1>Resumen del equipo</h1>
        {error ? <Notice error>{error}</Notice> : <p>Cargando tu resumen…</p>}
      </main>
    );
  const can = (permission: string) =>
    user.permissions.some((p) => p === permission);
  const cards = [
    ...(can("leads")
      ? [
          {
            label: "Por contactar",
            value: data?.stages.prelead || 0,
            detail: "Primeras conversaciones pendientes",
            href: "#leads",
            Icon: Kanban,
          },
          {
            label: "Obras en ejecución",
            value: data?.stages.execution || 0,
            detail: "Proyectos que están tomando forma",
            href: "#leads",
            Icon: Layers3,
          },
        ]
      : []),
    ...(can("projects")
      ? [
          {
            label: "Proyectos publicados",
            value: data?.publishedProjects || 0,
            detail: "El trabajo que ya cuenta nuestra web",
            href: "#projects",
            Icon: ArrowUpRight,
          },
        ]
      : []),
    ...(can("users")
      ? [
          {
            label: "Solicitudes de acceso",
            value: data?.pendingUsers || 0,
            detail: "Correos verificados por revisar",
            href: "#users",
            Icon: Users,
          },
        ]
      : []),
  ];
  return (
    <main className="ops-page workspace-dashboard">
      <div className="workspace-welcome">
        <div>
          <p>{user.roleName} · Vidrios VECA</p>
          <h1>
            Hola, {user.name.split(" ")[0]}
            <span>.</span>
          </h1>
          <p>Una mirada a lo que necesita tu equipo hoy.</p>
        </div>
        <button
          className="ops-icon-button"
          onClick={refresh}
          aria-label="Actualizar resumen"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="workspace-metrics">
        {cards.map(({ label, value, detail, href, Icon }) => (
          <a href={href} key={label}>
            <div>
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <strong>{data ? value : "—"}</strong>
            <p>{detail}</p>
          </a>
        ))}
      </div>
      {data?.mail && !data.mail.configured && (
        <Notice>
          El envío de correos necesita configuración. Las solicitudes por Google
          y el trabajo del panel siguen disponibles.
        </Notice>
      )}
      {can("leads") && (
        <section className="workspace-pipeline">
          <div className="workspace-section-head">
            <h2>De la consulta a la obra</h2>
            <a href="#leads">
              Abrir tablero <ArrowUpRight size={16} />
            </a>
          </div>
          <div>
            {LEAD_STAGES.slice(0, 5).map((stage, i) => (
              <a key={stage.id} href="#leads">
                <span>{stage.name}</span>
                <strong>{data?.stages[stage.id] || 0}</strong>
                <div className="workspace-stage-bar">
                  <span
                    style={{
                      width: `${data ? Math.max(5, Math.min(100, ((data.stages[stage.id] || 0) / Math.max(1, ...Object.values(data.stages))) * 100)) : 0}%`,
                      background: [
                        "#a4afa7",
                        "#cbb481",
                        "#7b9baf",
                        "#e77b51",
                        "#7a9a76",
                      ][i],
                    }}
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
      <div className="workspace-columns">
        {can("leads") && (
          <section className="workspace-section">
            <div className="workspace-section-head">
              <h2>Próximas coordinaciones</h2>
              <CalendarDays size={19} />
            </div>
            {data?.upcoming.length ? (
              data.upcoming.map((item) => (
                <a
                  className="workspace-row"
                  href={`#leads/${item.id}`}
                  key={item.id}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.district} · {date(item.appointment)}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ))
            ) : (
              <div className="workspace-empty">
                <CalendarDays size={25} />
                <p>Aún no hay coordinaciones próximas.</p>
                <a href="#leads">
                  Revisar leads <ArrowRight size={15} />
                </a>
              </div>
            )}
          </section>
        )}
        {can("inventory") && (
          <section className="workspace-section">
            <div className="workspace-section-head">
              <h2>Materiales por reponer</h2>
              <Package size={19} />
            </div>
            {data?.lowStock.length ? (
              data.lowStock.map((m) => (
                <a className="workspace-row" href="#inventory" key={m.id}>
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {m.sku} · Mínimo {amount(m.minimum)} {unitName(m.unit)}
                    </small>
                  </span>
                  <b>
                    {amount(m.balance)} <small>{unitName(m.unit)}</small>
                  </b>
                </a>
              ))
            ) : (
              <div className="workspace-empty">
                <CheckCircle2 size={25} />
                <p>No hay alertas de reposición registradas.</p>
                <a href="#inventory">
                  Ver inventario <ArrowRight size={15} />
                </a>
              </div>
            )}
          </section>
        )}
        {can("leads") && (
          <section className="workspace-section">
            <div className="workspace-section-head">
              <h2>Últimas leads</h2>
              <Kanban size={19} />
            </div>
            {data?.recent.length ? (
              data.recent.map((item) => (
                <a
                  className="workspace-row"
                  href={`#leads/${item.id}`}
                  key={item.id}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.district} · {stageName(item.stage)}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ))
            ) : (
              <div className="workspace-empty">
                <p>Las nuevas consultas de la web aparecerán aquí.</p>
              </div>
            )}
          </section>
        )}
        {!can("leads") && !can("inventory") && (
          <section className="workspace-section">
            <h2>Tu espacio en el equipo</h2>
            <p>
              Tu cuenta tiene acceso al resumen. Si necesitas otra sección,
              solicita al administrador que revise tus permisos.
            </p>
            <p>
              <strong>{user.roleName}</strong> · {user.email}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
