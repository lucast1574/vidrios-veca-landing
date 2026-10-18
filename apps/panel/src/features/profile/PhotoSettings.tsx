import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import type { SessionUser } from "@veca/content";
import { googleIdToken, type GoogleConfiguration } from "../../lib/google";
import { api, post } from "../../lib/api";
import { UserAvatar } from "../../components/workspace/UserAvatar";
export function PhotoSettings({
  user,
  onUpdate,
}: {
  user: SessionUser;
  onUpdate: (user: SessionUser) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("La foto debe pesar como máximo 4 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api<{ user: SessionUser }>("/account/avatar", {
        method: "POST",
        body,
      });
      onUpdate(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function select(source: "google" | "none") {
    setBusy(true);
    setError("");
    try {
      let result: { user: SessionUser };
      if (source === "google" && !user.googlePhotoAvailable) {
        const settings = await api<{ google: GoogleConfiguration | null }>(
          "/auth/config",
        );
        if (!settings.google)
          throw new Error("El acceso con Google no está disponible.");
        const idToken = await googleIdToken(settings.google, user.email);
        result = await post("/account/avatar/google", { idToken });
      } else {
        result = await post("/account/avatar/preference", { source });
      }
      onUpdate(result.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-photo-settings">
      <UserAvatar name={user.name} src={user.avatarUrl} large />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        aria-label="Seleccionar foto de perfil"
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      <button
        type="button"
        className="profile-photo-upload"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Camera size={15} />
        {busy ? "Actualizando…" : "Cambiar foto"}
      </button>
      <p>JPG, PNG, WebP o AVIF · Hasta 4 MB</p>
      <div className="profile-photo-actions">
        {(user.googlePhotoAvailable || user.authMethods?.includes("google")) &&
          user.avatarSource !== "google" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void select("google")}
            >
              Usar foto de Google
            </button>
          )}
        {user.avatarUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void select("none")}
          >
            Quitar foto
          </button>
        )}
      </div>
      {user.avatarSource === "google" && (
        <small>Foto sincronizada con Google</small>
      )}
      {error && (
        <p role="alert" className="profile-photo-error">
          {error}
        </p>
      )}
    </div>
  );
}
