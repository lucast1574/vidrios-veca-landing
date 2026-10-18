import { WorkspaceShell } from "./components/workspace/WorkspaceShell";
import {
  currentView,
  type WorkspaceView as View,
} from "./components/workspace/navigation";
import { UserProfile } from "./features/profile/UserProfile";
import { AuthScreen } from "./features/access/AuthScreen";
import { PendingAccess } from "./features/access/PendingAccess";
import { Team } from "./features/access/Team";
import { Dashboard } from "./features/dashboard/Dashboard";
import { type AuthSession } from "@veca/content";

import { Operations } from "./features/operations/Operations";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Globe,
  Images,
  LayoutGrid,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { CATEGORIES, type Project } from "@veca/content";
import { api, post, setCsrf } from "./lib/api";
import { Button, Notice, Status } from "./components/ui";
import { ProjectEditor } from "./features/editor/ProjectEditor";
type Session = AuthSession;
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>(currentView);
  useEffect(() => {
    const change = () => {
      setView(currentView());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  function navigate(next: View) {
    if (
      !window.dispatchEvent(
        new Event("veca-before-navigate", { cancelable: true }),
      )
    )
      return false;
    if (
      editing !== undefined &&
      view === "projects" &&
      !confirm(
        "Guarda los cambios del proyecto antes de cambiar de sección. ¿Continuar?",
      )
    )
      return false;
    setEditing(undefined);
    location.hash = next;
    setView(next);
    return true;
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
    if (session?.user.status === "active") {
      if (session.user.permissions.includes("projects")) void refresh();
      void api<{ storageConfigured: boolean }>("/admin/system")
        .then((x) => setStorageConfigured(x.storageConfigured))
        .catch(() => {});
    }
  }, [session]);
  useEffect(() => {
    if (!session || session.user.status !== "active") return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void api<Session>("/auth/me")
          .then(login)
          .catch(() => setSession(null));
    }, 60000);
    return () => clearInterval(timer);
  }, [session?.user.id, session?.user.status]);
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
  if (!session) return <AuthScreen onLogin={login} />;
  const active = session.user.status === "active" && session.user.emailVerified;
  const can = (permission: View) =>
    permission === "profile" ||
    (active && session.user.permissions.includes(permission));
  async function logout() {
    await post("/auth/logout", {});
    setCsrf("");
    setSession(null);
    setEditing(undefined);
  }
  return (
    <WorkspaceShell
      user={session.user}
      view={view}
      projectCount={projects.length}
      onNavigate={navigate}
      detail={
        view === "projects" && editing !== undefined
          ? editing
            ? "Editar proyecto"
            : "Nuevo proyecto"
          : undefined
      }
    >
      {!storageConfigured && view === "projects" && (
        <Notice>
          El almacenamiento de fotografías está pendiente de activación en
          Nexode. Puedes preparar y guardar los textos; la publicación se
          habilita con una portada.
        </Notice>
      )}
      {view === "profile" ? (
        <UserProfile
          user={session.user}
          onLogout={logout}
          onNavigate={navigate}
        />
      ) : !active ? (
        <PendingAccess
          session={session}
          onUpdate={login}
          onProfile={() => navigate("profile")}
        />
      ) : !can(view) ? (
        <main className="ops-page">
          <h1>Este espacio no está disponible para tu rol.</h1>
          <p>Solicita al administrador que revise tus permisos.</p>
          <Button onClick={() => navigate("profile")}>Revisar mi perfil</Button>
        </main>
      ) : view === "dashboard" ? (
        <Dashboard user={session.user} />
      ) : view === "users" ? (
        <Team currentId={session.user.id} />
      ) : view !== "projects" ? (
        <Operations view={view} inventoryAccess={can("inventory")} />
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
                value: projects.filter((p) => p.status === "published").length,
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
                Sube las fotos de un trabajo, cuenta cómo transformó el espacio
                y revísalo antes de compartirlo con el mundo.
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
    </WorkspaceShell>
  );
}
