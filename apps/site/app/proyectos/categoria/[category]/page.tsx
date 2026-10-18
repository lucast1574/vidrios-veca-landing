import { notFound } from "next/navigation";
import { CATEGORIES } from "@veca/content";
import { ProjectCollection } from "../../../../components/ProjectCollection";
export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { category } = await params;
  const p = await searchParams;
  const c = CATEGORIES.find((c) => c.id === category);
  if (!c) notFound();
  return {
    title: `Proyectos de ${c.name.toLowerCase()} en Lima`,
    description: `${c.description}. Descubre los proyectos de Vidrios VECA en Lima.`,
    alternates: {
      canonical:
        `https://veca.com.pe/proyectos/categoria/${category}/` +
        (p.page && p.page !== "1" ? `?page=${p.page}` : ""),
    },
    robots: p.q || p.tag ? { index: false, follow: true } : undefined,
  };
}
export default async function Category({ params, searchParams }: Props) {
  const { category } = await params;
  if (!CATEGORIES.some((c) => c.id === category)) notFound();
  const p = await searchParams;
  return (
    <ProjectCollection category={category} q={p.q} tag={p.tag} page={p.page} />
  );
}
