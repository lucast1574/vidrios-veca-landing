import { ProjectCollection } from "../../components/ProjectCollection";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const p = await searchParams;
  return {
    title: "Proyectos de vidrio en Lima",
    description:
      "Explora los proyectos de Vidrios VECA: ventanas, mamparas, fachadas y remodelaciones en Lima.",
    alternates: {
      canonical:
        "https://veca.com.pe/proyectos/" +
        (p.page && p.page !== "1" ? `?page=${p.page}` : ""),
    },
    robots: p.q || p.tag ? { index: false, follow: true } : undefined,
  };
}
export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const p = await searchParams;
  return <ProjectCollection q={p.q} tag={p.tag} page={p.page} />;
}
