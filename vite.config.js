import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base './' keeps asset paths relative, so the built site works at any
// subpath (GitHub Pages project site, client-site iframe, or subdomain).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
