/**
 * Post-build adapter that turns Vite's `dist/client` + `dist/server`
 * into Vercel's Build Output API v3 layout under `.vercel/output/`.
 *
 *   .vercel/output/
 *     config.json
 *     static/                 ← all of dist/client/* (favicons, og, icons, /paymemo-extension.zip)
 *     functions/_render.func/
 *       .vc-config.json       (nodejs22.x runtime, Web-standard fetch handler)
 *       index.mjs             (entry — re-exports server.js as Vercel handler)
 *       server.js             (TanStack Start SSR bundle)
 *       assets/...            (chunked SSR code)
 *
 * Run from package.json via:
 *     "buildCommand": "npm run build && node scripts/vercel-build.mjs"
 *
 * Vercel auto-detects `.vercel/output/` and skips its own framework detection.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distClient = path.join(root, "dist/client");
const distServer = path.join(root, "dist/server");
const out = path.join(root, ".vercel/output");
const outStatic = path.join(out, "static");
const outFunc = path.join(out, "functions/_render.func");

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) return copyDir(s, d);
      return fs.copyFile(s, d);
    }),
  );
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(distClient)) || !(await exists(distServer))) {
    throw new Error(
      "Missing dist/client or dist/server — run `npm run build` first.",
    );
  }

  await rmrf(out);
  await fs.mkdir(out, { recursive: true });

  // 1. config.json — try filesystem first, fall back to the SSR function.
  const config = {
    version: 3,
    routes: [
      // Long-cache hashed assets shipped by Vite.
      {
        src: "^/assets/(.*)$",
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
        },
        continue: true,
      },
      {
        src: "^/icons/(.*)$",
        headers: {
          "cache-control": "public, max-age=86400",
        },
        continue: true,
      },
      // Try static files (favicon, og-image, /paymemo-extension.zip, etc.).
      { handle: "filesystem" },
      // Everything else → SSR.
      { src: "/(.*)", dest: "/_render" },
    ],
  };
  await fs.writeFile(
    path.join(out, "config.json"),
    JSON.stringify(config, null, 2),
  );

  // 2. Copy the static build.
  await copyDir(distClient, outStatic);

  // 3. Build the SSR function.
  await fs.mkdir(outFunc, { recursive: true });
  await copyDir(distServer, outFunc);

  await fs.writeFile(
    path.join(outFunc, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.mjs",
        launcherType: "Nodejs",
        shouldAddHelpers: false,
        supportsResponseStreaming: true,
      },
      null,
      2,
    ),
  );

  const entry = `// Vercel Node22 supports Web-standard fetch handlers when the function
// default-exports a (Request) => Promise<Response> in an ESM module.
import server from "./server.js";

export default async function handler(request) {
  return server.fetch(request);
}
`;
  await fs.writeFile(path.join(outFunc, "index.mjs"), entry);

  console.log("✓ Vercel Build Output API written to", path.relative(root, out));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
