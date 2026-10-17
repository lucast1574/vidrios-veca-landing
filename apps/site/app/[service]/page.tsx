import { notFound } from "next/navigation";
import { services } from "../../lib/services";
import { SiteHeader, SiteFooter } from "../../components/SiteChrome";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const page = services[service];
  if (!page) notFound();
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: `https://veca.com.pe/${service}/` },
  };
}
export default async function Service({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const page = services[service];
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main id="contenido" dangerouslySetInnerHTML={{ __html: page.body }} />
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(page.schema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
