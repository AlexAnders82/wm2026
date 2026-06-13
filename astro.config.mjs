// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages liefert unter Unterpfad aus (PLAN.md 2). base ist Pflicht;
// interne Links/Assets laufen über import.meta.env.BASE_URL bzw. Astro-Helpers.
export default defineConfig({
  site: "https://alexanders82.github.io",
  base: "/wm2026",
  trailingSlash: "always",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
