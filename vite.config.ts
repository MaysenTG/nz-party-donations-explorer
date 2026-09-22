import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages project site: https://maysentg.github.io/nz-party-donations-explorer/
  base: "/nz-party-donations-explorer/",
  plugins: [react()],
});
