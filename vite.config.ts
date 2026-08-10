import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from https://filipeedr.github.io/md-viewer/
  base: "/md-viewer/",
});
