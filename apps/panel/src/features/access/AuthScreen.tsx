import { useEffect, useState, type FormEvent } from "react";
import { googleIdToken } from "../../lib/google";
import type { AuthSession } from "@veca/content";
import {
  ArrowUpRight,
  LockKeyhole,
  ShieldCheck,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { api, post } from "../../lib/api";
import { Field, Button, Notice } from "../../components/ui";
type Settings = {
  emailRegistrationAvailable: boolean;
  google: null | {
    projectId: string;
    apiKey: string;
    authDomain: string;
    appId: string;
  };
};
type Verification = {
  verificationRequired: true;
  challenge: string;
  email: string;
};
type Screen = "login" | "register" | "verify" | "forgot" | "reset" | "activate";
export function AuthScreen({ onLogin }: { onLogin: (s: AuthSession) => void }) {
  const activation = new URLSearchParams(location.hash.slice(1)).get(
    "activate",
  );
  const [screen, setScreen] = useState<Screen>(
      activation ? "activate" : "login",
    ),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [challenge, setChallenge] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void api<Settings>("/auth/config")
      .then(setSettings)
      .catch(() => {});
  }, []);
  function change(next: Screen) {
    setScreen(next);
    setError("");
    setMessage("");
    setCode("");
  }
  function receive(result: AuthSession | Verification) {
    if ("verificationRequired" in result) {
      setChallenge(result.challenge);
      setEmail(result.email);
      setScreen("verify");
      setMessage(
        "Enviamos un código de seis dígitos a tu correo. Revisa también spam.",
      );
      return;
    }
    history.replaceState(null, "", location.pathname);
    setPassword("");
    onLogin(result);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (screen === "login")
        receive(await post("/auth/login", { username: email, password }));
      else if (screen === "register")
        receive(await post("/auth/register", { name, email, password }));
      else if (screen === "verify")
        receive(await post("/auth/verify", { challenge, code }));
      else if (screen === "activate")
        receive(await post("/auth/activate", { token: activation, password }));
      else if (screen === "forgot") {
        const result = await post<{ challenge: string }>("/auth/forgot", {
          email,
        });
        setChallenge(result.challenge);
        setScreen("reset");
        setPassword("");
        setMessage(
          "Si existe una cuenta con ese correo, recibirás un código para recuperar el acceso.",
        );
      } else receive(await post("/auth/reset", { challenge, code, password }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    if (!settings?.google) return;
    setBusy(true);
    setError("");
    try {
      const token = await googleIdToken(settings.google);
      receive(await post("/auth/google", { idToken: token }));
    } catch (e) {
      setError(
        (e as { code?: string }).code?.startsWith("auth/")
          ? "No se pudo completar el acceso con Google. Permite la ventana emergente e inténtalo otra vez."
          : (e as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  const titles: Record<Screen, string> = {
    login: "Tu equipo, conectado.",
    register: "Tu lugar en VECA.",
    verify: "Confirma tu correo.",
    forgot: "Recupera tu acceso.",
    reset: "Un nuevo comienzo.",
    activate: "Tu espacio está listo.",
  };
  return (
    <main className="login-page auth-page">
      <section className="login-story">
        <img src="/assets/logo.svg" alt="Vidrios VECA" />
        <div>
          <p>Un equipo. Una visión.</p>
          <h1>
            Cada gran obra
            <br />
            empieza contigo.
          </h1>
          <p>
            Proyectos, personas y materiales. El trabajo de VECA, en un mismo
            lugar.
          </p>
        </div>
        <span>San Luis, Lima · Vidrios VECA</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-icon">
            {screen === "verify" ? (
              <Mail size={23} />
            ) : (
              <LockKeyhole size={23} />
            )}
          </div>
          <h2>{titles[screen]}</h2>
          <p>
            {screen === "register"
              ? "Regístrate con cualquier correo. Los accesos externos requieren aprobación del administrador."
              : screen === "verify" || screen === "reset"
                ? `Escribe el código enviado a ${email}.`
                : screen === "login"
                  ? "Ingresa a tu espacio de trabajo."
                  : "Confirma tu identidad para continuar."}
          </p>
          {error && <Notice error>{error}</Notice>}
          {message && <Notice>{message}</Notice>}
          {screen === "login" && settings?.google && (
            <>
              <button
                className="auth-google"
                type="button"
                disabled={busy}
                onClick={() => void google()}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.5Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.9c1.5 0 2.8.5 3.8 1.5L18.6 4A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z"
                  />
                </svg>
                Continuar con Google
              </button>
              <div className="auth-divider">o usa tu correo</div>
            </>
          )}
          <form onSubmit={submit}>
            {screen === "register" && (
              <Field label="Nombre y apellido">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
            )}
            {["login", "register", "forgot"].includes(screen) && (
              <Field
                label={
                  screen === "login" ? "Correo o usuario" : "Correo electrónico"
                }
              >
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type={screen === "login" ? "text" : "email"}
                  autoComplete="username"
                  required
                  maxLength={180}
                />
              </Field>
            )}
            {["verify", "reset"].includes(screen) && (
              <Field label="Código de verificación">
                <input
                  className="auth-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  minLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </Field>
            )}
            {["login", "register", "reset", "activate"].includes(screen) && (
              <Field
                label={screen === "reset" ? "Nueva contraseña" : "Contraseña"}
                hint={
                  screen !== "login" ? "Al menos 12 caracteres." : undefined
                }
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    screen === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={screen === "login" ? 1 : 12}
                  maxLength={256}
                />
              </Field>
            )}
            <Button
              disabled={
                busy ||
                (screen === "register" &&
                  settings?.emailRegistrationAvailable === false)
              }
              type="submit"
            >
              {busy
                ? "Un momento…"
                : screen === "login"
                  ? "Entrar"
                  : screen === "register"
                    ? "Crear mi cuenta"
                    : screen === "verify"
                      ? "Verificar correo"
                      : screen === "forgot"
                        ? "Enviar código"
                        : "Continuar"}
              <ArrowUpRight size={17} />
            </Button>
          </form>
          {screen === "register" &&
            settings?.emailRegistrationAvailable === false && (
              <Notice>
                Estamos preparando el envío de códigos. Por ahora puedes entrar
                con Google.
              </Notice>
            )}
          <div className="auth-links">
            {screen === "login" ? (
              <>
                <button onClick={() => change("forgot")}>
                  Olvidé mi contraseña
                </button>
                <span>
                  ¿Nuevo en el equipo?{" "}
                  <button onClick={() => change("register")}>
                    Crear una cuenta
                  </button>
                </span>
              </>
            ) : (
              <button onClick={() => change("login")}>
                <ArrowLeft size={14} />
                Volver al acceso
              </button>
            )}
          </div>
          {screen === "verify" && (
            <button
              className="auth-resend"
              disabled={busy || !password}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  receive(
                    await post("/auth/login", { username: email, password }),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Solicitar otro código
            </button>
          )}
          <p className="auth-assurance">
            <ShieldCheck size={15} />
            Los correos corporativos verificados reciben el acceso definido por
            la empresa. Los externos esperan aprobación.
          </p>
          <p className="auth-assurance">
            Usamos tu nombre y correo para identificarte y gestionar el acceso.
            <a
              href="https://veca.com.pe/privacidad/"
              target="_blank"
              rel="noreferrer"
            >
              Política de privacidad
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
