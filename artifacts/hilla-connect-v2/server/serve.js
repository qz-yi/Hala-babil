/**
 * Production/dev server for Expo web static export.
 * Serves the static-build/ directory as a Single Page Application.
 * Proxies /api/* and /socket.io/* to the API server on port 3000.
 */

const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const INDEX_HTML = path.join(STATIC_ROOT, "index.html");
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");
const API_PORT = parseInt(process.env.API_PORT || "3000", 10);

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

function proxyToApi(req, res) {
  const options = {
    hostname: "127.0.0.1",
    port: API_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${API_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy] Error forwarding to API:", err.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway");
    }
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  // Proxy API and socket.io requests to the backend
  if (pathname.startsWith("/api/") || pathname.startsWith("/socket.io/")) {
    return proxyToApi(req, res);
  }

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

// Handle WebSocket upgrades for socket.io proxy
// Uses net.connect (raw TCP) — http.request cannot tunnel WebSocket upgrades.
server.on("upgrade", (req, socket, head) => {
  if (req.url && (req.url.startsWith("/socket.io/") || req.url.startsWith("/api/"))) {
    const upstream = net.connect(API_PORT, "127.0.0.1", () => {
      // Forward the raw HTTP upgrade request to the upstream API server
      let raw = `${req.method} ${req.url} HTTP/1.1\r\n`;
      for (const [key, val] of Object.entries(req.headers)) {
        raw += `${key}: ${Array.isArray(val) ? val.join(", ") : val}\r\n`;
      }
      raw += "\r\n";
      upstream.write(raw);
      if (head && head.length > 0) upstream.write(head);
      // Bidirectional pipe — both sides exchange WebSocket frames directly
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    upstream.on("error", () => { try { socket.destroy(); } catch (_) {} });
    socket.on("error", () => { try { upstream.destroy(); } catch (_) {} });
    socket.on("end", () => { try { upstream.end(); } catch (_) {} });
    upstream.on("end", () => { try { socket.end(); } catch (_) {} });
  } else {
    socket.destroy();
  }
});

const port = parseInt(process.env.PORT || "5000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving Expo web build from ${STATIC_ROOT} on port ${port}`);
  console.log(`Proxying /api/* and /socket.io/* to API server on port ${API_PORT}`);
});
