import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import busboy from "busboy";
import { createHmac, randomUUID } from "node:crypto";

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
const sessions = new Map();
const refreshTokens = new Map();
const signingKey = randomUUID();
const headers = {
  "Cache-Control": "no-store",
  // A browser test must never contact production services.
  "Content-Security-Policy":
    "connect-src 'self' blob: ws://127.0.0.1:4173; object-src 'none'",
};
const json = (value, status = 200) => Response.json(value, { status, headers });
function guestSession(user = null, refreshToken = randomUUID()) {
  const timestamp = Math.floor(Date.now() / 1000);
  user ??= {
    id: randomUUID(),
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "anonymous", providers: ["anonymous"] },
    user_metadata: {},
    identities: [],
    is_anonymous: true,
    created_at: new Date().toISOString(),
  };
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    is_anonymous: true,
    iat: timestamp,
    exp: timestamp + 3600,
    session_id: randomUUID(),
  })}`;
  const accessToken = `${body}.${createHmac("sha256", signingKey).update(body).digest("base64url")}`;
  const session = {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: timestamp + 3600,
    refresh_token: refreshToken,
    user,
  };
  sessions.set(accessToken, session);
  refreshTokens.set(refreshToken, user);
  return session;
}
function guest(request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const session = sessions.get(token);
  return session && session.expires_at > Date.now() / 1000
    ? session.user
    : null;
}
function ownsPath(user, key) {
  return Boolean(
    user &&
    key.startsWith(`scans/${user.id}/`) &&
    /^scans\/[0-9a-f-]+\/[0-9a-f-]+\.(?:webp|jpg)$/.test(key),
  );
}
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
    if (path === "/__mock__/auth/v1/signup" && request.method === "POST")
      return json(guestSession());
    if (path === "/__mock__/auth/v1/token" && request.method === "POST") {
      const body = await request.json();
      const user = refreshTokens.get(body.refresh_token);
      return user
        ? json(guestSession(user, body.refresh_token))
        : json({ error: "invalid_grant" }, 400);
    }
    if (path === "/__mock__/auth/v1/user") {
      const user = guest(request);
      return user ? json(user) : json({ error: "Not authenticated" }, 401);
    }
    if (path === "/__mock__/rest/v1/guidelines")
      return request.method === "GET"
        ? json([])
        : json({ error: "Read only" }, 403);
    if (path === "/__mock__/rest/v1/scans") {
      const user = guest(request);
      if (!user) return json({ message: "Not authenticated" }, 401);
      if (request.method === "POST") {
        const row = await request.json();
        if (
          row.owner_id !== user.id ||
          row.image_url !== null ||
          !ownsPath(user, `scans/${row.storage_path}`) ||
          row.storage_path !==
            `${user.id}/${row.id}.${row.storage_path.endsWith(".webp") ? "webp" : "jpg"}`
        )
          return json({ message: "Ownership policy denied insert" }, 403);
        if (rows.has(row.id))
          return json({ code: "23505", message: "Duplicate id" }, 409);
        rows.set(row.id, row);
        return json(null, 201);
      }
      if (request.method === "DELETE") {
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        if (rows.get(id)?.owner_id === user.id) rows.delete(id);
        return new Response(null, { status: 204, headers });
      }
      if (request.method !== "GET")
        return json({ message: "Read only scans" }, 403);
      const matching = [...rows.values()].filter(
        (row) =>
          row.owner_id === user.id &&
          [...url.searchParams].every(
            ([field, value]) =>
              !value.startsWith("eq.") || String(row[field]) === value.slice(3),
          ),
      );
      return json(matching);
    }
    if (path.startsWith("/__mock__/storage/v1/object/")) {
      const user = guest(request);
      if (!user) return json({ error: "Not authenticated" }, 401);
      const key = path
        .replace("/__mock__/storage/v1/object/", "")
        .replace(/^authenticated\//, "");
      if (key.startsWith("public/"))
        return json({ error: "Private bucket" }, 403);
      if (request.method === "DELETE") {
        const { prefixes } = await request.json();
        if (!prefixes.every((name) => ownsPath(user, key + "/" + name)))
          return json({ error: "Ownership policy denied delete" }, 403);
        for (const name of prefixes) objects.delete(key + "/" + name);
        return json([]);
      }
      if (!ownsPath(user, key))
        return json({ error: "Ownership policy denied access" }, 403);
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
