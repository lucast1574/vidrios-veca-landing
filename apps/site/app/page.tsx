import { SOLUTION_SLOTS } from "@veca/content";
import { homeSchema } from "../lib/home-schema";
import { projects } from "../lib/api";
import { FeaturedProjects } from "../components/FeaturedProjects";
import { VecaLanding } from "../components/VecaLanding";
import "./landing.css";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "https://veca.com.pe/" } };
export default async function Home() {
  const [result, ...solutions] = await Promise.all([
    projects({ featured: "true" }).catch(() => null),
    ...SOLUTION_SLOTS.map((slot) =>
      projects({ solutionSlot: slot.id }).catch(() => null),
    ),
  ]);
  return (
    <>
      <VecaLanding
        featured={<FeaturedProjects items={result?.items || []} />}
        solutionProjects={solutions.flatMap(
          (result) => result?.items.slice(0, 1) || [],
        )}
        consultationUrl={`${process.env.PUBLIC_API_URL || "https://api.veca.com.pe"}/public/consultations`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
    </>
  );
}
