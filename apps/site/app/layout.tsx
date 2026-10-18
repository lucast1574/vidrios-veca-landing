import type { Metadata } from "next";
import "./legacy.css";
import "./projects.css";
import "./landing.css";
import "@veca/ui/src/select.css";
import "@veca/ui/src/article.css";
import { WhatsAppButton } from "../components/SiteChrome";
export const metadata: Metadata = {
  metadataBase: new URL("https://veca.com.pe"),
  title: {
    default: "Vidrios VECA | Vidrios y ventanas en Lima",
    template: "%s | Vidrios VECA",
  },
  description:
    "Ventanas y soluciones en vidrio para edificios, viviendas y remodelaciones. Conoce los proyectos de Vidrios VECA en Lima.",
  openGraph: {
    siteName: "Vidrios VECA",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "/assets/veca-compartir-v1.png",
        width: 1200,
        height: 630,
        alt: "Logo de Vidrios VECA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/veca-compartir-v1.png"],
  },
  icons: { icon: "/assets/favicon.svg" },
};
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <body className="ready">
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
