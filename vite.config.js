import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
// `npm run build` writes a single self-contained build/index.html; copy it to the repo root for GitHub Pages.
export default defineConfig({ root: "dev", plugins: [react(), viteSingleFile()], build: { outDir: "../build", emptyOutDir: true } });
