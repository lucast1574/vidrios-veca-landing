import { homeSchema } from "../lib/home-schema";
import Script from "next/script";
import { legacy } from "../lib/legacy";
import { projects } from "../lib/api";
import { FeaturedProjects } from "../components/FeaturedProjects";
import { homeContent } from "../lib/home-content";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "https://veca.com.pe/" } };
export default async function Home() {
  const result = await projects({ featured: "true" }).catch(() => null);

  const items = result?.items || [];
  const content = homeContent(items.length > 0);
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div dangerouslySetInnerHTML={{ __html: content.header }} />
      <main id="contenido">
        <div dangerouslySetInnerHTML={{ __html: content.hero }} />
        <FeaturedProjects items={items} />
        <div dangerouslySetInnerHTML={{ __html: content.sections }} />
      </main>
      <div dangerouslySetInnerHTML={{ __html: legacy.footer }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <Script src="/legacy.js" strategy="afterInteractive" />
    </>
  );
}
