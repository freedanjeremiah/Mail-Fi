import { context } from "esbuild";
import { cpSync, mkdirSync } from "fs";
import { resolve } from "path";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

const isWatch = process.argv.includes("--watch");
const root = resolve(process.cwd());
const outdir = resolve(root, "dist", "extension");

// Ensure outdir exists
mkdirSync(outdir, { recursive: true });
mkdirSync(resolve(outdir, "ui"), { recursive: true });

// Copy static files
cpSync(resolve(root, "extension", "manifest.json"), resolve(outdir, "manifest.json"));
cpSync(resolve(root, "extension", "ui", "panel.html"), resolve(outdir, "ui", "panel.html"));
cpSync(resolve(root, "extension", "ui", "panel.css"), resolve(outdir, "ui", "panel.css"));

const common = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: "chrome114",
} as const;

async function run() {
  const ctx = await context({
    entryPoints: {
      "background/index": resolve(root, "extension", "background", "index.ts"),
      "content/gmail": resolve(root, "extension", "content", "gmail.ts"),
      "ui/panel": resolve(root, "extension", "ui", "panel.tsx"),
      "injected/nexus-init": resolve(root, "extension", "injected", "nexus-init.ts"),
    },
    outdir,
    platform: "browser",
    format: "esm",
    plugins: [
      NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
      NodeModulesPolyfillPlugin(),
    ],
    define: {
      "process.env.NODE_DEBUG": "false",
      "global": "globalThis",
    },
    ...common,
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching extension sources…");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    // Copy prebuilt Nexus CA bundle from nexus-hyperliquid-poc
    try {
      cpSync(resolve(root, "extension", "injected", "nexus-ca.js"), resolve(outdir, "injected", "nexus-ca.js"));
      console.log("Copied nexus-ca.js");
    } catch (err) {
      console.warn("nexus-ca.js not found, skipping");
    }
    console.log("Built extension to dist/extension");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
