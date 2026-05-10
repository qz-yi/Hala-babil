/**
 * Production server for Expo web static export (expo export --platform web).
 * Serves the static-build/ directory as a Single Page Application.
 * All unknown routes fall back to index.html for client-side routing.
 * Zero external dependencies — Node.js built-ins only.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const INDEX_HTML = path.join(STATIC_ROOT, "index.html");
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".map":  "application/json",
  ".webp": "image/webp",
};

if (!fs.existsSync(STATIC_ROOT)) {
  console.error(
    `ERROR: static-build/ not found at ${STATIC_ROOT}\n` +
    `Run "pnpm run build" first to generate the static export.`
  );
  process.exit(1);
}

if (!fs.existsSync(INDEX_HTML)) {
  console.error(`ERROR: index.html not found in static-build/`);
  process.exit(1);
}

const indexContent = fs.readFileSync(INDEX_HTML);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Strip base path prefix
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Security: prevent path traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve existing static file
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      "content-type": contentType,
      "cache-control": ext === ".html"
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=31536000, immutable",
    });
    res.end(content);
    return;
  }

  // SPA fallback — serve index.html for all other routes
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-cache, no-store, must-revalidate",
  });
  res.end(indexContent);
});

const port = parseInt(process.env.PORT || "8080", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving Expo web build from ${STATIC_ROOT} on port ${port}`);
});
