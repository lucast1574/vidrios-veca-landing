import assert from "node:assert/strict";
import sharp from "sharp";
const base = process.env.TEST_API_URL || "http://localhost:4400",
  site = process.env.TEST_SITE_URL || "http://localhost:3380";
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  !["localhost", "127.0.0.1"].includes(new URL(site).hostname)
)
  throw Error("Local fixtures only");
let cookie = "",
  csrf = "";
async function request(path, method = "GET", data, form) {
  const headers = {
    Origin: "http://localhost:3300",
    Cookie: cookie,
    "X-Veca-Csrf": csrf,
  };
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(base + path, {
    method,
    headers,
    body: form || (data && JSON.stringify(data)),
  });
  return { status: res.status, body: await res.json(), res };
}
let r = await request("/auth/login", "POST", {
  username: "admin",
  password: "Local-only-visual-test-2026!",
});
assert.equal(r.status, 201);
cookie = r.res.headers.get("set-cookie").split(";")[0];
csrf = r.body.csrf;
const images = [];
for (const file of ["vivienda.webp", "facade.webp", "mamparas.webp"]) {
  const bytes = await sharp("assets/" + file)
      .resize(800)
      .jpeg()
      .toBuffer(),
    form = new FormData();
  form.append("file", new Blob([bytes], { type: "image/jpeg" }), file + ".jpg");
  r = await request("/media", "POST", null, form);
  assert.equal(r.status, 201);
  images.push({
    ...r.body,
    alt: "Fotografía local de verificación de " + file,
  });
}
const text = (t) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
});
const draft = {
  title: "Collages y secciones de prueba local",
  excerpt: "Proyecto exclusivo de pruebas locales.",
  category: "viviendas",
  tags: ["Ventanas"],
  location: "San Luis",
  body: text(""),
  images,
  coverId: images[0].id,
  coverLayout: "top",
  pageLayout: "alternating-right",
  solutionSlot: "viviendas",
  sections: [
    {
      id: "section-one",
      title: "El reto local",
      body: text(
        "Un texto de prueba con más de sesenta caracteres que describe el proceso de instalación y el resultado del trabajo.",
      ),
      imageIds: images.map((i) => i.id),
    },
    {
      id: "section-two",
      title: "El resultado local",
      body: text("Una segunda sección para comprobar el orden alternado."),
      imageIds: [images[1].id],
    },
  ],
  featured: false,
  featuredOrder: 0,
};
r = await request("/admin/projects", "POST", {
  ...draft,
  sections: [{ ...draft.sections[0], imageIds: ["foreign-image"] }],
});
assert.equal(r.status, 400);
r = await request("/admin/projects", "POST", {
  ...draft,
  sections: [draft.sections[0], draft.sections[0]],
});
assert.equal(r.status, 400);
r = await request("/admin/projects", "POST", draft);
assert.equal(r.status, 201, JSON.stringify(r.body));
let project = r.body;
assert.equal((await request("/public/projects/" + project.slug)).status, 404);
assert.ok(
  !(await request("/public/projects?solutionSlot=viviendas")).body.items.some(
    (p) => p.id === project.id,
  ),
);
r = await request("/admin/projects/" + project.id, "PUT", {
  ...draft,
  coverId: null,
  version: project.version,
});
assert.equal(r.status, 200);
project = r.body;
assert.equal(
  (
    await request(`/admin/projects/${project.id}/publish`, "POST", {
      version: project.version,
    })
  ).status,
  400,
);
r = await request("/admin/projects/" + project.id, "PUT", {
  ...draft,
  version: project.version,
});
assert.equal(r.status, 200);
project = r.body;
r = await request(`/admin/projects/${project.id}/publish`, "POST", {
  version: project.version,
});
assert.equal(r.status, 201, JSON.stringify(r.body));
project = r.body;
let published = (await request("/public/projects/" + project.slug)).body;
assert.equal(published.pageLayout, "alternating-right");
assert.equal(published.sections[0].imageIds.length, 3);
assert.equal(
  (await request("/public/projects?solutionSlot=viviendas")).body.items[0].id,
  project.id,
);
assert.ok(
  (await request("/public/projects?q=Collages&tag=Ventanas")).body.items.some(
    (p) => p.id === project.id,
  ),
);
assert.ok(
  !(await request("/public/projects?tag=Mamparas")).body.items.some(
    (p) => p.id === project.id,
  ),
);
const filteredGallery = await (
  await fetch(site + "/proyectos/?q=Collages&tag=Ventanas")
).text();
assert.ok(filteredGallery.includes("Collages y secciones de prueba local"));
assert.ok(filteredGallery.includes('name="tag"'));
assert.ok(filteredGallery.includes("Etiquetas del proyecto"));
assert.ok(!filteredGallery.includes('class="site-header"'));
const article = await (
  await fetch(site + "/proyectos/" + project.slug + "/")
).text();
assert.ok(article.includes("layout-alternating-right"));
assert.ok(article.includes("collage-3"));
assert.ok(article.includes("El resultado local"));
const home = await (await fetch(site)).text();
assert.ok(home.includes("veca-solution-card"));
assert.ok(home.includes(draft.title));
assert.ok(!home.includes("ve-glass-pane"));
r = await request("/admin/projects/" + project.id, "PUT", {
  ...draft,
  version: project.version,
  pageLayout: "stacked",
  sections: [...draft.sections].reverse(),
});
assert.equal(r.status, 200);
project = r.body;
published = (await request("/public/projects/" + project.slug)).body;
assert.equal(published.pageLayout, "alternating-right");
assert.equal(published.sections[0].id, "section-one");
r = await request(`/admin/projects/${project.id}/publish`, "POST", {
  version: project.version,
});
assert.equal(r.status, 201);
project = r.body;
published = (await request("/public/projects/" + project.slug)).body;
assert.equal(published.pageLayout, "stacked");
assert.equal(published.sections[0].id, "section-two");
// A newly published choice replaces the slot; withdrawing it restores the prior choice.
let replacement = await request("/admin/projects", "POST", {
  ...draft,
  title: "Otra selección local de soluciones",
  coverId: images[2].id,
});
assert.equal(replacement.status, 201);
let second = replacement.body;
replacement = await request(`/admin/projects/${second.id}/publish`, "POST", {
  version: second.version,
});
assert.equal(replacement.status, 201);
second = replacement.body;
assert.equal(
  (await request("/public/projects?solutionSlot=viviendas")).body.items[0].id,
  second.id,
);
assert.equal(
  (
    await request(`/admin/projects/${second.id}/unpublish`, "POST", {
      version: second.version,
    })
  ).status,
  201,
);
assert.equal(
  (await request("/public/projects?solutionSlot=viviendas")).body.items[0].id,
  project.id,
);
r = await request(`/admin/projects/${project.id}/unpublish`, "POST", {
  version: project.version,
});
assert.equal(r.status, 201);
assert.equal((await request("/public/projects/" + project.slug)).status, 404);
assert.ok(
  !(await request("/public/projects?solutionSlot=viviendas")).body.items.some(
    (p) => p.id === project.id,
  ),
);
const spotlight = [];
for (let i = 0; i < 4; i++) {
  let response = await request("/admin/projects", "POST", {
    ...draft,
    title: `Foco local ${i}`,
    solutionSlot: null,
    featured: true,
    featuredOrder: i,
  });
  assert.equal(response.status, 201);
  let item = response.body;
  response = await request(`/admin/projects/${item.id}/publish`, "POST", {
    version: item.version,
  });
  assert.equal(response.status, 201);
  spotlight.push(response.body);
}
const spotlightHome = await (await fetch(site)).text();
assert.equal(
  (spotlightHome.match(/class="public-project-card"/g) || []).length,
  3,
);
const spotlightGallery = await (
  await fetch(site + "/proyectos/?q=Foco&tag=Ventanas")
).text();
assert.equal(
  (spotlightGallery.match(/class="public-project-card"/g) || []).length,
  4,
);
for (const item of spotlight)
  assert.equal(
    (
      await request(`/admin/projects/${item.id}/unpublish`, "POST", {
        version: item.version,
      })
    ).status,
    201,
  );
console.log(
  "PASS: canonical section media, mandatory cover, collages, publication snapshots and panel-selected landing solutions.",
);
