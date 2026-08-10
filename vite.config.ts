import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Served at the domain root via the md.filipeesteves.com custom domain.
  base: "/",
});
