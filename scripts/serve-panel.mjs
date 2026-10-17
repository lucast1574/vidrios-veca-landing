import express from "express";
import helmet from "helmet";
import path from "node:path";
const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: [
          "'self'",
          process.env.PUBLIC_API_URL || "http://localhost:4000",
          "data:",
          "blob:",
        ],
        connectSrc: [
          "'self'",
          process.env.PUBLIC_API_URL || "http://localhost:4000",
        ],
        frameAncestors: ["'none'"],
      },
    },
  }),
);
app.use((req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/config.js", (req, res) =>
  res
    .type("application/javascript")
    .set("Cache-Control", "no-store")
    .send(
      `window.__VECA_CONFIG__=${JSON.stringify({ apiUrl: process.env.PUBLIC_API_URL || "http://localhost:4000" }).replace(/</g, "\\u003c")};`,
    ),
);
app.get("/robots.txt", (req, res) =>
  res.type("text/plain").send("User-agent: *\nDisallow: /\n"),
);
app.use(express.static("apps/panel/dist", { index: false }));
app.get("/{*path}", (req, res) =>
  res.sendFile(path.resolve("apps/panel/dist/index.html")),
);
app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
