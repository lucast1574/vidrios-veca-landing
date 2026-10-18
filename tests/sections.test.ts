import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  emptyProject,
  projectInputSchema,
  publicationIssues,
  seoFor,
} from "@veca/content";
import { ProjectArticle, ProjectSolutionCard } from "@veca/ui";
import {
  legacySections,
  moveSection,
  pruneSections,
} from "../apps/panel/src/features/editor/sections";
const body = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
const images = ["one", "two", "three"].map((id) => ({
  id,
  url: `https://api.veca.com.pe/media/${id}`,
  width: 1200,
  height: 800,
  alt: `Vidrio ${id}`,
  caption: "",
  positionX: 20,
  positionY: 70,
}));
const project = {
  ...emptyProject(),
  title: "Proyecto de vidrio en Lima",
  coverId: "one",
  images,
  pageLayout: "alternating-right" as const,
  solutionSlot: "viviendas" as const,
  sections: [
    {
      id: "first",
      title: "El reto",
      body: body(
        "Texto real del proyecto con más de sesenta caracteres para explicar el trabajo y su resultado.",
      ),
      imageIds: ["two", "one", "three"],
    },
    {
      id: "second",
      title: "El resultado",
      body: body("Segunda sección."),
      imageIds: ["one"],
    },
  ],
};
test("structured projects render ordered sections and canonical collages; legacy remains intact", () => {
  for (const pageLayout of [
    "stacked",
    "alternating-left",
    "alternating-right",
  ] as const) {
    const html = renderToStaticMarkup(
      React.createElement(ProjectArticle, {
        project: { ...project, pageLayout },
      }),
    );
    assert.match(html, new RegExp(`layout-${pageLayout}`));
    assert.ok(html.indexOf("El reto") < html.indexOf("El resultado"));
    assert.ok(
      html.indexOf('alt="Vidrio two"') < html.indexOf('alt="Vidrio one"'),
    );
    assert.match(html, /collage-3/);
    assert.match(html, /20% 70%/);
    assert.match(html, /photos-right/);
    assert.match(html, /photos-left/);
  }
  const legacy = {
    ...emptyProject(),
    title: "Anterior",
    body: body("Un proyecto anterior que conserva su contenido."),
  };
  assert.match(
    renderToStaticMarkup(
      React.createElement(ProjectArticle, { project: legacy }),
    ),
    /Un proyecto anterior/,
  );
});
test("SEO and publication readiness use section content and require a principal image", () => {
  assert.equal(publicationIssues(project).length, 0);
  assert.match(seoFor(project, "local").description, /Texto real del proyecto/);
  assert.ok(publicationIssues({ ...project, coverId: null }).length > 0);
  assert.ok(publicationIssues({ ...project, sections: [] }).length > 0);
  assert.equal(
    projectInputSchema.safeParse({ ...project, pageLayout: "arbitrary" })
      .success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({
      ...project,
      sections: [
        {
          ...project.sections[0],
          body: { type: "doc", content: [{ type: "script" }] },
        },
      ],
    }).success,
    false,
  );
});
test("section moves, deleted photos and conversion preserve the user's content", () => {
  assert.deepEqual(
    moveSection(project.sections, "second", -1).map((s) => s.id),
    ["second", "first"],
  );
  assert.deepEqual(
    project.sections.map((s) => s.id),
    ["first", "second"],
  );
  assert.deepEqual(pruneSections(project.sections, [images[0]])[0].imageIds, [
    "one",
  ]);
  const previous = {
    ...project,
    sections: [],
    body: {
      ...body("Texto que no se debe perder."),
      content: [
        ...body("Texto que no se debe perder.").content,
        { type: "image", attrs: { mediaId: "one" } },
      ],
    },
  };
  const converted = legacySections(previous);
  assert.match(
    JSON.stringify(converted[0].body),
    /Texto que no se debe perder/,
  );
  assert.deepEqual(
    converted[0].imageIds,
    images.map((i) => i.id),
  );
  assert.ok(!JSON.stringify(converted[0].body).includes('"type":"image"'));
});
test("landing solution cards reuse the chosen cover and escape project copy", () => {
  const html = renderToStaticMarkup(
    React.createElement(ProjectSolutionCard, {
      project: { ...project, title: "<script>bad</script>" },
      href: "/proyectos/local/",
    }),
  );
  assert.match(html, /alt="Vidrio one"/);
  assert.match(html, /href="\/proyectos\/local\//);
  assert.ok(!html.includes("<script>"));
});
