import next from "next";
import { createServer } from "node:http";
import { request as upstreamRequest } from "node:https";
import { pipeline } from "node:stream";

const port = Number(process.env.PORT || 80);
const site = next({ dev: false, dir: "apps/site", hostname: "0.0.0.0", port });
await site.prepare();
const handle = site.getRequestHandler();
const helpers = new Set(
  [
    "handler",
    "handler.js",
    "experiments.js",
    "iframe",
    "iframe.js",
    "links",
    "links.js",
  ].map((name) => "/__/auth/" + name),
);
helpers.add("/__/firebase/init.json");
createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (!helpers.has(url.pathname)) return void handle(req, res);
  if (!["GET", "POST"].includes(req.method || "")) {
    res.writeHead(405, { Allow: "GET, POST" }).end();
    return;
  }
  // Fixed upstream and exact helper paths: this is never an arbitrary URL proxy.
  const forwarded = upstreamRequest(
    {
      hostname: "vidrios-veca.firebaseapp.com",
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        accept: req.headers.accept || "*/*",
        ...(req.headers["content-type"]
          ? { "content-type": req.headers["content-type"] }
          : {}),
        ...(req.headers.origin ? { origin: req.headers.origin } : {}),
      },
      timeout: 15000,
    },
    (upstream) => {
      res.writeHead(upstream.statusCode || 502, {
        ...upstream.headers,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      pipeline(upstream, res, () => {});
    },
  );
  forwarded.on("timeout", () => forwarded.destroy());
  forwarded.on("error", () => {
    if (!res.headersSent)
      res.writeHead(502).end("Authentication temporarily unavailable");
    else res.destroy();
  });
  pipeline(req, forwarded, () => {});
}).listen(port, "0.0.0.0");
