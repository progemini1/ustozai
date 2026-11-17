import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Run after `npm run build`. Exercise the actual production server and assets.
test("Production HTTP server", async (t) => {
  const index = await readFile(new URL("./dist/index.html", import.meta.url));
  const port = await new Promise((resolvePort, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const selected = probe.address().port;
      probe.close((error) => (error ? reject(error) : resolvePort(selected)));
    });
  });
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: resolve("."),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(`Server exited: ${output}`);
      try {
        ready = (await fetch(base + "/health")).ok;
      } catch {}
      if (ready) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.ok(ready, `Server did not become ready: ${output}`);

    await t.test(
      "health endpoint returns JSON and is never cached",
      async () => {
        const response = await fetch(base + "/health");
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ok" });
        assert.match(response.headers.get("content-type"), /application\/json/);
        assert.equal(response.headers.get("cache-control"), "no-store");
      },
    );
    await t.test(
      "direct form and confirmation URLs return the built SPA",
      async () => {
        for (const path of [
          "/",
          "/qatnovlar?hudud=B%20tumani",
          "/sorov/Y02",
          "/tasdiq/test-receipt",
          "/qollanma",
          "/sorovlar",
        ]) {
          const response = await fetch(base + path);
          assert.equal(response.status, 200, path);
          assert.match(response.headers.get("content-type"), /text\/html/);
          assert.deepEqual(
            Buffer.from(await response.arrayBuffer()),
            index,
            path,
          );
        }
      },
    );
    await t.test(
      "HEAD has the same headers without a response body",
      async () => {
        const response = await fetch(base + "/sorov/Y02", { method: "HEAD" });
        assert.equal(response.status, 200);
        assert.equal(
          Number(response.headers.get("content-length")),
          index.length,
        );
        assert.equal(await response.text(), "");
      },
    );
    await t.test(
      "hashed JavaScript is served as JavaScript with immutable cache",
      async () => {
        const name = (await readdir("dist/assets")).find((name) =>
          name.endsWith(".js"),
        );
        assert.ok(name, "Production JavaScript must be present");
        const response = await fetch(base + "/assets/" + name);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type"), /javascript/);
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.match(response.headers.get("cache-control"), /immutable/);
        assert.ok((await response.text()).length > 0);
      },
    );
    await t.test(
      "missing assets return 404 instead of an HTML fallback",
      async () => {
        for (const path of [
          "/assets/not-present.js",
          "/brand/not-present.png",
          "/README.md",
          "/api/requests",
        ]) {
          assert.equal((await fetch(base + path)).status, 404, path);
        }
      },
    );
    await t.test(
      "POST is rejected rather than pretending to save server data",
      async () => {
        const response = await fetch(base + "/sorov/Y02", {
          method: "POST",
          body: "name=Sinovchi",
        });
        assert.equal(response.status, 405);
        assert.equal(response.headers.get("allow"), "GET, HEAD");
      },
    );
    await t.test(
      "dotfiles and encoded traversal cannot expose repository files",
      async () => {
        for (const path of [
          "/.env",
          "/.git/config",
          "/assets/%2e%2e%5cpackage.json",
        ]) {
          assert.equal((await fetch(base + path)).status, 404, path);
        }
      },
    );
    await t.test(
      "malformed URL encoding is handled without crashing",
      async () => {
        assert.equal((await fetch(base + "/%ZZ")).status, 400);
        assert.equal((await fetch(base + "/health")).status, 200);
      },
    );
  } finally {
    child.kill();
    if (child.exitCode === null)
      await new Promise((resolveExit) => child.once("exit", resolveExit));
  }
});
