declare global {
  interface Window {
    __VECA_CONFIG__?: { apiUrl: string };
  }
}
export const API_BASE =
  window.__VECA_CONFIG__?.apiUrl ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";
let csrf = "";
export const setCsrf = (value: string) => {
  csrf = value;
};
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (options.method && options.method !== "GET")
    headers.set("X-Veca-Csrf", csrf);
  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    credentials: "include",
  }).catch(() => {
    throw new Error(
      "No pudimos conectar con el servidor. Inténtalo nuevamente en unos momentos.",
    );
  });
  const body = await res.json().catch(() => ({
    message: "El servidor no respondió. Inténtalo nuevamente.",
  }));
  if (!res.ok)
    throw new Error(
      Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message || "No pudimos completar la acción.",
    );
  return body;
}
export const post = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data) });
