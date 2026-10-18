import { homeSchema } from "../lib/home-schema";
import { projects } from "../lib/api";
import { FeaturedProjects } from "../components/FeaturedProjects";
import { VecaLanding } from "../components/VecaLanding";
import "./landing.css";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "https://veca.com.pe/" } };
export default async function Home() {
  const result = await projects({ featured: "true" }).catch(() => null);
  return (
    <>
      <VecaLanding
        featured={<FeaturedProjects items={result?.items || []} />}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
    </>
  );
}
