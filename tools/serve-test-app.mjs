import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import busboy from "busboy";

const build = JSON.parse(readFileSync(".test-app/current.json", "utf8"));
const testRoot = resolve(".test-app");
if (!resolve(build.directory).startsWith(testRoot + sep))
  throw new Error("Invalid test build directory");
const exportRoot = resolve(build.directory, "out");
const fixtureRoot = resolve("tools/e2e/fixtures/photos");
// TFJS's prebuilt browser module preserves backend-registration order.
const bundle = await Bun.build({
  entrypoints: ["tools/e2e/support/inference-harness.ts"],
  target: "browser",
  external: ["@tensorflow/tfjs"],
  minify: false,
});
if (!bundle.success) throw new Error(String(bundle.logs));
const harness = await bundle.outputs[0].text();
const rows = new Map();
const objects = new Map();
const headers = {
  "Cache-Control": "no-store",
  // A browser test must never contact production services.
  "Content-Security-Policy":
    "connect-src 'self' blob: ws://127.0.0.1:4173; object-src 'none'",
};
const json = (value, status = 200) => Response.json(value, { status, headers });
function localFile(root, name) {
  const path = resolve(root, name);
  if (!path.startsWith(root + sep))
    return new Response("Forbidden", { status: 403 });
  const file = Bun.file(path);
  return file
    .exists()
    .then((exists) =>
      exists
        ? new Response(file, { headers })
        : new Response("Not found", { status: 404 }),
    );
}

// This mock checks client workflows; it does not test Supabase RLS or its service.
Bun.serve({
  hostname: "127.0.0.1",
  port: 4173,
  async fetch(request, server) {
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname);
    if (path.startsWith("/__mock__/realtime/")) {
      if (server.upgrade(request)) return;
      return new Response("WebSocket required", { status: 400 });
    }
    if (path === "/__test__/ready")
      return json({ fingerprint: build.fingerprint });
    if (path === "/__test__/provenance") return json(build);
    if (path === "/__test__/harness.js")
      return new Response(harness, {
        headers: { ...headers, "Content-Type": "text/javascript" },
      });
    if (path === "/__test__/tf.js")
      return new Response(
        Bun.file("node_modules/@tensorflow/tfjs/dist/tf.fesm.min.js"),
        { headers: { ...headers, "Content-Type": "text/javascript" } },
      );
    if (path === "/__test__/harness.html")
      return new Response(
        '<!doctype html><html><head><title>Local inference test harness</title><script type="importmap">{"imports":{"@tensorflow/tfjs":"/__test__/tf.js"}}</script></head><body><script type="module" src="/__test__/harness.js"></script></body></html>',
        { headers: { ...headers, "Content-Type": "text/html" } },
      );
    if (path.startsWith("/__test__/photos/"))
      return localFile(fixtureRoot, path.slice("/__test__/photos/".length));
    if (path === "/__mock__/rest/v1/guidelines") return json([]);
    if (path === "/__mock__/rest/v1/scans") {
      if (request.method === "POST") {
        const row = await request.json();
        rows.set(row.id, row);
        return json(null, 201);
      }
      if (request.method === "DELETE") {
        rows.delete(url.searchParams.get("id")?.replace(/^eq\./, ""));
        return new Response(null, { status: 204, headers });
      }
      const device = url.searchParams.get("device_id")?.replace(/^eq\./, "");
      return json([...rows.values()].filter((row) => row.device_id === device));
    }
    if (path.startsWith("/__mock__/storage/v1/object/")) {
      const key = path
        .replace("/__mock__/storage/v1/object/", "")
        .replace(/^public\//, "");
      if (request.method === "POST" || request.method === "PUT") {
        // Supabase sends Blob uploads as multipart; store only the photo part.
        const contentType =
          request.headers.get("content-type") || "application/octet-stream";
        const body = Buffer.from(await request.arrayBuffer());
        const upload = contentType.startsWith("multipart/form-data")
          ? await new Promise((resolve, reject) => {
              // Bun 1.4's formData() drops Supabase's empty field name.
              const parser = busboy({
                headers: { "content-type": contentType },
                limits: { files: 1 },
              });
              let photo = null;
              parser.on("file", (_name, stream, info) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("error", reject);
                stream.on("end", () => {
                  photo = { bytes: Buffer.concat(chunks), type: info.mimeType };
                });
              });
              parser.on("error", reject);
              parser.on("filesLimit", () =>
                reject(new Error("Expected one upload file")),
              );
              parser.on("close", () => resolve(photo));
              parser.end(body);
            })
          : { bytes: body, type: contentType };
        if (!upload) return json({ error: "Missing upload file" }, 400);
        objects.set(key, upload);
        return json({ Key: key });
      }
      if (request.method === "DELETE") {
        const { prefixes } = await request.json();
        for (const name of prefixes) objects.delete(key + "/" + name);
        return json([]);
      }
      const object = objects.get(key);
      return object
        ? new Response(object.bytes, {
            headers: { ...headers, "Content-Type": object.type },
          })
        : new Response("Not found", { status: 404 });
    }
    if (path.startsWith("/__mock__/"))
      return json({ error: "Unimplemented mock endpoint" }, 501);
    return localFile(exportRoot, path === "/" ? "index.html" : path.slice(1));
  },
  websocket: {
    message(socket, data) {
      const message = JSON.parse(String(data));
      // Supabase's Phoenix transport uses the JSON array serializer.
      if (Array.isArray(message)) {
        const [joinRef, ref, topic, event] = message;
        if (event === "phx_join" || event === "heartbeat")
          socket.send(
            JSON.stringify([
              joinRef,
              ref,
              topic,
              "phx_reply",
              { status: "ok", response: { postgres_changes: [] } },
            ]),
          );
      } else if (
        message.event === "phx_join" ||
        message.event === "heartbeat"
      ) {
        socket.send(
          JSON.stringify({
            topic: message.topic,
            ref: message.ref,
            event: "phx_reply",
            payload: { status: "ok", response: { postgres_changes: [] } },
          }),
        );
      }
    },
  },
});
console.log("Test server: http://127.0.0.1:4173 (local mock backend only)");
