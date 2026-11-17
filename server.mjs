import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, relative, sep } from "node:path";
const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path === "/health") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : '{"status":"ok"}');
      return;
    }
    if (
      path.startsWith("/api/") ||
      path.split(/[\\/]/).some((p) => p.startsWith(".")) ||
      path.includes(":")
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    let file = resolve(root, "." + path);
    const rel = relative(root, file);
    if (rel === ".." || rel.startsWith(".." + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
      await stat(file);
    } catch {
      if (extname(path)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      file = resolve(root, "index.html");
    }
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Content-Length": bytes.length,
      "Cache-Control": path.startsWith("/assets/")
        ? "public,max-age=31536000,immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(400);
    res.end("Bad request");
  }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, process.env.PORT ? "0.0.0.0" : "127.0.0.1", () =>
  console.log(`Yo‘lchi: http://127.0.0.1:${port}`),
);
