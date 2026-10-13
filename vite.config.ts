import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const VIRTUAL_DONATIONS = "virtual:donations";
const RESOLVED_VIRTUAL_DONATIONS = "\0virtual:donations";

/**
 * Serves donation rows to the app with donor_address removed.
 * src/data/donations.json is left unchanged.
 */
function publicDonations(): Plugin {
  return {
    name: "public-donations",
    resolveId(id) {
      if (id === VIRTUAL_DONATIONS) return RESOLVED_VIRTUAL_DONATIONS;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_DONATIONS) return null;
      const file = path.resolve("src/data/donations.json");
      this.addWatchFile(file);
      const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(parsed)) {
        throw new Error("donations.json must be an array");
      }
      const stripped = parsed.map((row) => {
        if (typeof row !== "object" || row === null || Array.isArray(row)) return row;
        const copy = { ...(row as Record<string, unknown>) };
        delete copy.donor_address;
        return copy;
      });
      return `export default ${JSON.stringify(stripped)}`;
    },
  };
}

export default defineConfig({
  // GitHub Pages project site: https://maysentg.github.io/nz-party-donations-explorer/
  base: "/nz-party-donations-explorer/",
  plugins: [publicDonations(), react()],
});
