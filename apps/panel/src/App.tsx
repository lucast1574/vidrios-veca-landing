import { Operations } from "./features/operations/Operations";
import { Kanban, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Globe,
  Images,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Star,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { CATEGORIES, type Project } from "@veca/content";
import { api, post, setCsrf } from "./lib/api";
import { Button, Field, Notice, Status } from "./components/ui";
import { ProjectEditor } from "./features/editor/ProjectEditor";
type Session = { user: { username: string }; csrf: string };
function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const activation = new URLSearchParams(location.hash.slice(1)).get(
    "activate",
  );
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("admin");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <section className="login-story">
        <img src="/assets/logo.svg" alt="Vidrios VECA" />
        <div>
          <p className="overline">GESTIÓN VECA</p>
          <h1>
            Lo que construimos,
            <br />
            <em>merece verse.</em>
          </h1>
          <p>
            Un espacio para dar forma a las historias, los detalles y las nuevas
            posibilidades de VECA.
          </p>
        </div>
        <span>VIDRIOS VECA · LIMA, PERÚ</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-icon">
            <LockKeyhole size={23} />
          </div>
          <p className="overline">ACCESO PRIVADO</p>
          <h2>
            {activation ? "Tu espacio está listo." : "Bienvenido de nuevo."}
          </h2>
          <p>
            {activation
              ? "Crea la contraseña del administrador para empezar."
              : "Ingresa para administrar proyectos, oportunidades e inventario de Vidrios VECA."}
          </p>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const result = await post<Session>(
                  activation ? "/auth/activate" : "/auth/login",
                  activation
                    ? { token: activation, password }
                    : { username, password },
                );
                history.replaceState(null, "", location.pathname);
                onLogin(result);
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Usuario" htmlFor="username">
              <input
                id="username"
                autoComplete="username"
                value={username}
                disabled={!!activation}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Field>
            <Field
              label={activation ? "Crea tu contraseña" : "Contraseña"}
              htmlFor="password"
              hint={
                activation
                  ? "Al menos 12 caracteres. Usa una contraseña única."
                  : undefined
              }
            >
              <input
                id="password"
                type="password"
                autoComplete={activation ? "new-password" : "current-password"}
                minLength={activation ? 12 : 1}
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button disabled={busy} type="submit">
              {busy
                ? "Ingresando…"
                : activation
                  ? "Activar mi cuenta"
                  : "Entrar al estudio"}
              <ArrowUpRight size={18} />
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<"projects" | "leads" | "inventory">(() =>
    location.hash.startsWith("#leads")
      ? "leads"
      : location.hash.startsWith("#inventory")
        ? "inventory"
        : "projects",
  );
  useEffect(() => {
    const change = () =>
      setView(
        location.hash.startsWith("#leads")
          ? "leads"
          : location.hash.startsWith("#inventory")
            ? "inventory"
            : "projects",
      );
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  function navigate(next: "projects" | "leads" | "inventory") {
    if (
      !window.dispatchEvent(
        new Event("veca-before-navigate", { cancelable: true }),
      )
    )
      return;
    if (
      editing !== undefined &&
      view === "projects" &&
      !confirm(
        "Guarda los cambios del proyecto antes de cambiar de sección. ¿Continuar?",
      )
    )
      return;
    setEditing(undefined);
    location.hash = next;
    setView(next);
  }

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [storageConfigured, setStorageConfigured] = useState(true);
  const [editing, setEditing] = useState<Project | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const login = (s: Session) => {
    setCsrf(s.csrf);
    setSession(s);
  };
  async function refresh() {
    try {
      setProjects(await api<Project[]>("/admin/projects"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    api<Session>("/auth/me")
      .then(login)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (session) {
      void refresh();
      void api<{ storageConfigured: boolean }>("/admin/system")
        .then((x) => setStorageConfigured(x.storageConfigured))
        .catch(() => {});
    }
  }, [session]);
  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "all" ||
            (filter === "featured" && p.featured) ||
            p.status === filter) &&
          `${p.title} ${p.location} ${p.tags.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [projects, filter, search],
  );
  if (loading)
    return <div className="loading-screen">Abriendo el estudio de VECA…</div>;
  if (!session) return <Login onLogin={login} />;
  return (
    <div className="studio-shell">
      <aside className="studio-nav">
        <a className="studio-brand" href="/" aria-label="Inicio del panel">
          <img src="/assets/logo.svg" alt="Vidrios VECA" />
          <span>GESTIÓN VECA</span>
        </a>
        <p className="nav-label">ESPACIO DE TRABAJO</p>
        <button
          className={`nav-item ${view === "projects" ? "active" : ""}`}
          onClick={() => navigate("projects")}
        >
          <LayoutGrid size={19} />
          Proyectos<span>{projects.length}</span>
        </button>
        <button
          className={`nav-item ${view === "leads" ? "active" : ""}`}
          onClick={() => navigate("leads")}
        >
          <Kanban size={19} />
          Oportunidades
        </button>
        <button
          className={`nav-item ${view === "inventory" ? "active" : ""}`}
          onClick={() => navigate("inventory")}
        >
          <Package size={19} />
          Inventario
        </button>
        <a
          className="nav-item"
          href="https://veca.com.pe"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Globe size={19} />
          Ver sitio web
          <ArrowUpRight size={16} />
        </a>
        <div className="nav-bottom">
          <div className="user-avatar">A</div>
          <div>
            <strong>Administrador</strong>
            <small>Vidrios VECA</small>
          </div>
          <button
            aria-label="Cerrar sesión"
            onClick={async () => {
              if (
                !window.dispatchEvent(
                  new Event("veca-before-navigate", { cancelable: true }),
                )
              )
                return;
              if (
                editing !== undefined &&
                !confirm("¿Cerrar sesión? Guarda tus cambios antes de salir.")
              )
                return;
              await post("/auth/logout", {});
              setCsrf("");
              setSession(null);
              setEditing(undefined);
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="studio-body">
        <div className="studio-topbar">
          <span>
            VECA <ChevronRight size={13} />{" "}
            {view === "projects"
              ? "Proyectos"
              : view === "leads"
                ? "Oportunidades"
                : "Inventario"}{" "}
            {editing !== undefined && (
              <>
                <ChevronRight size={13} />
                {editing ? "Editar" : "Nuevo proyecto"}
              </>
            )}
          </span>
          <span className="private-label">
            <LockKeyhole size={13} />
            Espacio privado
          </span>
        </div>
        {!storageConfigured && (
          <Notice>
            El almacenamiento de fotografías está pendiente de activación en
            Nexode. Puedes preparar y guardar los textos; la publicación se
            habilita con una portada.
          </Notice>
        )}
        {view !== "projects" ? (
          <Operations view={view} />
        ) : editing !== undefined ? (
          <ProjectEditor
            key={editing?.id || "new"}
            initial={editing}
            onBack={() => {
              setEditing(undefined);
              void refresh();
            }}
            onSaved={(project) =>
              setProjects((old) => [
                project,
                ...old.filter((p) => p.id !== project.id),
              ])
            }
          />
        ) : (
          <main className="dashboard">
            <div className="dashboard-heading">
              <div>
                <p className="overline">EL TRABAJO HABLA POR NOSOTROS</p>
                <h1>
                  Proyectos con perspectiva<span>.</span>
                </h1>
                <p>
                  Publica historias reales. Cuida cada imagen. Comparte lo que
                  hace diferente a VECA.
                </p>
              </div>
              <Button onClick={() => setEditing(null)}>
                <Plus size={18} />
                Nuevo proyecto
              </Button>
            </div>
            <div className="stats-grid">
              {[
                {
                  label: "Total de proyectos",
                  value: projects.length,
                  Icon: LayoutGrid,
                },
                {
                  label: "En la web",
                  value: projects.filter((p) => p.status === "published")
                    .length,
                  Icon: Globe,
                },
                {
                  label: "En preparación",
                  value: projects.filter((p) => p.status === "draft").length,
                  Icon: FileText,
                },
                {
                  label: "Destacados",
                  value: projects.filter(
                    (p) => p.featured && p.status === "published",
                  ).length,
                  Icon: Star,
                },
              ].map(({ label, value, Icon }) => (
                <div className="stat-card" key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>{String(value).padStart(2, "0")}</strong>
                  </div>
                  <Icon size={23} />
                </div>
              ))}
            </div>
            <div className="project-tools">
              <div className="project-tabs">
                {[
                  ["all", "Todos"],
                  ["published", "Publicados"],
                  ["draft", "Borradores"],
                  ["featured", "Destacados"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="search-input">
                <Search size={17} />
                <input
                  aria-label="Buscar proyectos"
                  placeholder="Buscar un proyecto…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            {error && (
              <Notice error>
                {error}
                <button onClick={() => void refresh()}>Reintentar</button>
              </Notice>
            )}
            {!projects.length ? (
              <section className="projects-empty">
                <div className="empty-art">
                  <Images size={42} />
                  <div />
                  <div />
                </div>
                <p className="overline">
                  UNA NUEVA FORMA DE MOSTRAR LO QUE HACEMOS
                </p>
                <h2>La primera historia empieza aquí.</h2>
                <p>
                  Sube las fotos de un trabajo, cuenta cómo transformó el
                  espacio y revísalo antes de compartirlo con el mundo.
                </p>
                <Button onClick={() => setEditing(null)}>
                  <Plus size={17} />
                  Crear mi primer proyecto
                </Button>
              </section>
            ) : !filtered.length ? (
              <div className="empty-search">
                <Search size={28} />
                <h2>No encontramos proyectos</h2>
                <p>Prueba con otro título o cambia el filtro.</p>
              </div>
            ) : (
              <div className="admin-project-grid">
                {filtered.map((project) => {
                  const cover = project.images.find(
                    (i) => i.id === project.coverId,
                  );
                  return (
                    <button
                      className="admin-project"
                      key={project.id}
                      onClick={() => setEditing(project)}
                    >
                      <div className="admin-project-image">
                        {cover ? (
                          <img
                            src={cover.url}
                            alt={cover.alt}
                            style={{
                              objectPosition: `${cover.positionX}% ${cover.positionY}%`,
                            }}
                          />
                        ) : (
                          <Images size={35} />
                        )}
                        <Status
                          published={project.status === "published"}
                          changed={project.hasUnpublishedChanges}
                        />
                        {project.featured && (
                          <span className="featured-star">
                            <Star size={16} />
                          </span>
                        )}
                      </div>
                      <div className="admin-project-copy">
                        <p>
                          {
                            CATEGORIES.find((c) => c.id === project.category)
                              ?.name
                          }
                        </p>
                        <h2>{project.title}</h2>
                        <div>
                          <span>
                            {new Date(project.updatedAt).toLocaleDateString(
                              "es-PE",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span>
                            Editar proyecto
                            <ArrowUpRight size={15} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <footer className="studio-footer">
              <span>VIDRIOS VECA / ESTUDIO EDITORIAL</span>
              <span>Diseñado para dar espacio a tus proyectos.</span>
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
