import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyProject,
  projectInputSchema,
  seoFor,
  slugify,
  validBody,
} from "@veca/content";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectArticle } from "@veca/ui";
test("SEO derives from the real title, summary and selected cover", () => {
  const p = {
    ...emptyProject(),
    title: "Mamparas para una oficina en San Luis",
    excerpt: "Un nuevo ambiente de trabajo con luz natural.",
    images: [
      {
        id: "one",
        url: "https://api.veca.com.pe/media/one",
        width: 1200,
        height: 800,
        alt: "Mampara de una oficina",
        caption: "",
        positionX: 25,
        positionY: 60,
      },
    ],
    coverId: "one",
  };
  const slug = slugify(p.title);
  assert.equal(slug, "mamparas-para-una-oficina-en-san-luis");
  assert.equal(seoFor(p, slug).title, p.title + " | Vidrios VECA");
  assert.equal(seoFor(p, slug).image, p.images[0].url);
  assert.match(seoFor(p, slug).canonical, /\/proyectos\/mamparas-/);
});
test("rejects executable URLs, arbitrary nodes, malformed documents and excessive nesting", () => {
  assert.equal(
    validBody({ type: "doc", content: [{ type: "script" }] }),
    false,
  );
  assert.equal(
    validBody({
      type: "doc",
      content: [
        {
          type: "text",
          text: "click",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    }),
    false,
  );
  assert.equal(
    validBody({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://arbitrary.example/image.jpg" },
        },
      ],
    }),
    false,
  );
  let deep: any = { type: "paragraph" };
  for (let i = 0; i < 25; i++) deep = { type: "doc", content: [deep] };
  assert.equal(validBody(deep), false);
});
test("only predefined categories and tags can enter a project", () => {
  assert.equal(
    projectInputSchema.safeParse({
      ...emptyProject(),
      title: "Proyecto real",
      category: "inventada",
    }).success,
    false,
  );
  assert.equal(
    projectInputSchema.safeParse({
      ...emptyProject(),
      title: "Proyecto real",
      tags: ["spam"],
    }).success,
    false,
  );
});
test("article safely renders text, canonical media and selected positions without trusting image src", () => {
  const p = {
    ...emptyProject(),
    title: "<script>alert(1)</script>",
    images: [
      {
        id: "one",
        url: "https://api.veca.com.pe/media/one",
        width: 1200,
        height: 800,
        alt: "Ventana",
        caption: "Detalle",
        positionX: 25,
        positionY: 70,
      },
    ],
    coverId: "one",
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Texto de la historia." }],
        },
        {
          type: "image",
          attrs: {
            mediaId: "one",
            src: "https://evil.example/image",
            layout: "left",
          },
        },
      ],
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(ProjectArticle, { project: p }),
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("evil.example"));
  assert.match(html, /image-left/);
  assert.match(html, /25% 70%/);
  assert.match(html, /Texto de la historia/);
});
