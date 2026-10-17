import { legacy } from "./legacy";
/** Keep the commercial page complete until its first real featured publication. */
export function homeContent(hasFeaturedProjects: boolean) {
  if (hasFeaturedProjects)
    return {
      header: legacy.header,
      hero: legacy.beforeProjects,
      sections: legacy.afterProjects,
    };
  return {
    header: legacy.header.replaceAll('href="#proyectos"', 'href="/proyectos/"'),
    hero: legacy.beforeProjects
      .replaceAll('href="#proyectos"', 'href="#soluciones"')
      .replace("Conoce nuestros proyectos", "Explora nuestras soluciones")
      .replace("Bajar a proyectos", "Bajar a soluciones"),
    sections: legacy.afterProjects.replace(
      /section-number">0([2-5])/g,
      (_, number: string) => `section-number">0${Number(number) - 1}`,
    ),
  };
}
