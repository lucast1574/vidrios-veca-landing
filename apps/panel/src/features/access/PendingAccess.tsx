import { useEffect, useState } from "react";
import { Clock3, ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import type { AuthSession } from "@veca/content";
import { api, post, setCsrf } from "../../lib/api";
import { Button, Notice } from "../../components/ui";
export function PendingAccess({
  session,
  onUpdate,
  onLogout,
}: {
  session: AuthSession;
  onUpdate: (s: AuthSession) => void;
  onLogout: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      onUpdate(await api<AuthSession>("/auth/me"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <main className="access-wait">
      <img src="/assets/logo.svg" alt="Vidrios VECA" />
      <section>
        <div className="access-wait-icon">
          <Clock3 size={30} />
        </div>
        <p>{session.user.name}</p>
        <h1>
          {session.user.status === "pending"
            ? "Tu cuenta ya está verificada."
            : "Tu acceso está pausado."}
        </h1>
        <p>
          {session.user.status === "pending"
            ? "Un administrador debe aprobar tu acceso y asignarte un rol. Cuando lo haga, podrás entrar a las secciones de tu equipo."
            : "Comunícate con el administrador de VECA para revisar el estado de tu cuenta."}
        </p>
        <span>
          <ShieldCheck size={16} />
          {session.user.email}
        </span>
        {error && <Notice error>{error}</Notice>}
        <Button onClick={() => void refresh()} disabled={busy}>
          <RefreshCw size={15} />
          {busy ? "Revisando…" : "Comprobar acceso"}
        </Button>
        <button
          className="access-logout"
          onClick={async () => {
            await post("/auth/logout", {});
            setCsrf("");
            onLogout();
          }}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
