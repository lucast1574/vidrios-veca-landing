import { Icon } from "@veca/ui/src/Icon";
import { SiteHeader, SiteFooter } from "../components/SiteChrome";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="project-next section-pad">
        <p className="eyebrow">VIDRIOS VECA</p>
        <h1>
          No encontramos
          <br />
          esta página.
        </h1>
        <p>Explora nuestras soluciones o vuelve a los proyectos.</p>
        <a className="button button-orange" href="/proyectos/">
          Explorar proyectos{" "}
          <span>
            <Icon name="arrow-up-right" />
          </span>
        </a>
      </main>
      <SiteFooter />
    </>
  );
}
