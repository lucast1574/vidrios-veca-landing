import assert from "node:assert/strict";
import sharp from "sharp";
const base = process.env.TEST_API_URL || "http://localhost:4400",
  origin = process.env.TEST_PANEL_URL || "http://localhost:3300";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Integration fixtures are local-only.");
let cookie = "",
  csrf = "";
async function request(
  route,
  { method = "GET", data, auth = true, form, csrfOverride } = {},
) {
  const headers = { Origin: origin };
  if (auth && cookie) headers.Cookie = cookie;
  if (method !== "GET") headers["X-Veca-Csrf"] = csrfOverride ?? csrf;
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(base + route, {
    method,
    headers,
    body: form || (data && JSON.stringify(data)),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { res, body };
}
let r = await request("/admin/projects", { auth: false });
assert.equal(r.res.status, 401);
r = await request("/auth/login", {
  method: "POST",
  data: { username: "admin", password: "Local-only-visual-test-2026!" },
});
assert.equal(r.res.status, 201, JSON.stringify(r.body));
cookie = r.res.headers.get("set-cookie").split(";")[0];
csrf = r.body.csrf;
assert.ok(cookie.includes("veca_session="));
assert.ok(r.res.headers.get("set-cookie").includes("HttpOnly"));
const draft = {
  title: "Proyecto de verificación local",
  excerpt: "Un trabajo de prueba para comprobar la publicación y su SEO.",
  category: "viviendas",
  tags: ["Ventanas", "Luz natural"],
  location: "Lima",
  body: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Este contenido existe exclusivamente en la base local de pruebas. Permite comprobar la edición de proyectos sin publicar trabajos inventados en la web del cliente.",
          },
        ],
      },
    ],
  },
  images: [],
  coverId: null,
  coverLayout: "left",
  featured: true,
  featuredOrder: 1,
};
r = await request("/admin/projects", {
  method: "POST",
  data: draft,
  csrfOverride: "bad",
});
assert.equal(r.res.status, 403);
r = await request("/admin/projects", { method: "POST", data: draft });
assert.equal(r.res.status, 201, JSON.stringify(r.body));
let project = r.body;
assert.equal(
  (await request("/public/projects/" + project.slug, { auth: false })).res
    .status,
  404,
);
assert.equal(
  (await request("/public/projects", { auth: false })).body.total,
  0,
);
r = await request(`/admin/projects/${project.id}/publish`, {
  method: "POST",
  data: { version: project.version },
});
assert.equal(r.res.status, 400);
const invalid = new FormData();
invalid.append(
  "file",
  new Blob(["<svg><script>alert(1)</script></svg>"], { type: "image/svg+xml" }),
  "invalid.svg",
);
assert.equal(
  (await request("/media", { method: "POST", form: invalid })).res.status,
  400,
);
const bytes = await sharp("assets/vivienda.webp").resize(800).jpeg().toBuffer();
const form = new FormData();
form.append(
  "file",
  new Blob([bytes], { type: "image/jpeg" }),
  "local-test.jpg",
);
r = await request("/media", { method: "POST", form });
assert.equal(r.res.status, 201, JSON.stringify(r.body));
const image = {
  ...r.body,
  alt: "Ventanas de una vivienda luminosa",
  caption: "Fotografía utilizada solo para verificar el editor local.",
};
assert.equal(
  (await request("/media/" + image.id, { auth: false })).res.status,
  401,
);
r = await request("/admin/projects/" + project.id, {
  method: "PUT",
  data: {
    ...draft,
    version: project.version,
    images: [image],
    coverId: image.id,
  },
});
assert.equal(r.res.status, 200, JSON.stringify(r.body));
project = r.body;
assert.equal(
  (
    await request("/admin/projects/" + project.id, {
      method: "PUT",
      data: { ...draft, version: 1 },
    })
  ).res.status,
  409,
);
r = await request(`/admin/projects/${project.id}/publish`, {
  method: "POST",
  data: { version: project.version },
});
assert.equal(r.res.status, 201, JSON.stringify(r.body));
project = r.body;
assert.equal(
  (await request("/public/projects/" + project.slug, { auth: false })).body
    .title,
  draft.title,
);
assert.equal(
  (await request("/media/" + image.id, { auth: false })).res.status,
  200,
);
assert.equal(
  (await request("/public/projects?category=edificios", { auth: false })).body
    .total,
  0,
);
assert.equal(
  (
    await request("/public/projects?q=verificaci%C3%B3n&featured=true", {
      auth: false,
    })
  ).body.total,
  1,
);
const update = {
  ...draft,
  title: "Título modificado sin publicar",
  version: project.version,
  images: [image],
  coverId: image.id,
};
r = await request("/admin/projects/" + project.id, {
  method: "PUT",
  data: update,
});
assert.equal(r.res.status, 200);
project = r.body;
assert.equal(
  (await request("/public/projects/" + project.slug, { auth: false })).body
    .title,
  draft.title,
);
const homeHtml = await (
  await fetch(process.env.TEST_SITE_URL || "http://localhost:3380")
).text();
assert.ok(
  homeHtml.indexOf('id="proyectos"') < homeHtml.indexOf('id="soluciones"'),
);
assert.ok(homeHtml.includes(draft.title));
assert.ok(!homeHtml.includes(update.title));
assert.ok(!homeHtml.includes("panel.veca.com.pe"));
assert.ok(homeHtml.includes("https://wa.me/51908917621"));
const html = await (
  await fetch(
    (process.env.TEST_SITE_URL || "http://localhost:3380") +
      "/proyectos/" +
      project.slug +
      "/",
  )
).text();
assert.ok(html.includes("<title>" + draft.title + " | Vidrios VECA</title>"));
assert.ok(html.includes("application/ld+json"));
assert.ok(html.includes("https://veca.com.pe/proyectos/" + project.slug + "/"));
assert.ok(html.includes("Ventanas de una vivienda luminosa"));
const sitemap = await (
  await fetch(
    (process.env.TEST_SITE_URL || "http://localhost:3380") + "/sitemap.xml",
  )
).text();
assert.ok(sitemap.includes(project.slug));
r = await request(`/admin/projects/${project.id}/unpublish`, {
  method: "POST",
  data: { version: project.version },
});
assert.equal(r.res.status, 201);
project = r.body;
assert.equal(
  (await request("/public/projects/" + project.slug, { auth: false })).res
    .status,
  404,
);
assert.equal(
  (await request("/media/" + image.id, { auth: false })).res.status,
  401,
);
assert.ok(
  !(
    await (
      await fetch(
        (process.env.TEST_SITE_URL || "http://localhost:3380") + "/sitemap.xml",
      )
    ).text()
  ).includes(project.slug),
);
const emptyHome = await (
  await fetch(process.env.TEST_SITE_URL || "http://localhost:3380")
).text();
assert.ok(!emptyHome.includes('id="proyectos"'));
assert.ok(emptyHome.includes("Explora nuestras soluciones"));
console.log(
  "PASS: admin authentication, CSRF, private drafts/media, image validation and S3 round-trip, publication rules, stale-save conflicts, draft isolation, filters, rendered SEO/sitemap and unpublication.",
);
