import type { Project } from "@veca/content";
const API =
  process.env.API_INTERNAL_URL ||
  process.env.API_URL ||
  "http://127.0.0.1:4000";
export type ProjectPage = {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
};
export async function api<T>(path: string): Promise<T> {
  const result = await fetch(API + path, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!result.ok) throw new Error(`API ${result.status}`);
  return result.json();
}
export async function projects(
  query: Record<string, string> = {},
): Promise<ProjectPage> {
  return api<ProjectPage>("/public/projects?" + new URLSearchParams(query));
}
