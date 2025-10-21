import { context } from "esbuild";
import { cpSync, mkdirSync } from "fs";
import { resolve } from "path";

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
  target: ["chrome114"],
} as const;

async function run() {
  const ctx = await context({
    entryPoints: {
      "background/index": resolve(root, "extension", "background", "index.ts"),
      "content/gmail": resolve(root, "extension", "content", "gmail.ts"),
      "ui/panel": resolve(root, "extension", "ui", "panel.tsx"),
    },
    outdir,
    platform: "browser",
    format: "esm",
    ...common,
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching extension sources…");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("Built extension to dist/extension");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
