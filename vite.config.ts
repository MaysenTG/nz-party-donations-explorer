import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { nzDateToIso } from "./src/lib/dates.ts";
import { classifyDonor } from "./src/lib/donors.ts";
import {
  OLD_INDIVIDUAL_LABEL,
  inspectionCutoffIso,
  isPastInspection,
  withholdName,
} from "./src/lib/privacy.ts";

const VIRTUAL_DONATIONS = "virtual:donations";
const RESOLVED_VIRTUAL_DONATIONS = "\0virtual:donations";

/**
 * Serves donation rows to the app.
 * - Drops any donor_address field (the committed file no longer has one; this stays as a guard).
 * - Withholds individual donors' names (and organisation names that name a person) on returns past the 6 year inspection period,
 *   using the build date, so those names are not shipped in the bundle.
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
      const cutoff = inspectionCutoffIso(new Date());
      const rows = parsed.map((row) => {
        if (typeof row !== "object" || row === null || Array.isArray(row)) return row;
        const copy = { ...(row as Record<string, unknown>) };
        delete copy.donor_address;
        const name = String(copy.donor_name ?? "");
        const returned = String(copy.return_received_date ?? "");
        if (
          withholdName(classifyDonor(name) === "individual", name) &&
          isPastInspection(nzDateToIso(returned), cutoff)
        ) {
          copy.donor_name = OLD_INDIVIDUAL_LABEL;
          copy.name_withheld = true;
        }
        return copy;
      });
      return `export default ${JSON.stringify(rows)}`;
    },
  };
}

export default defineConfig({
  plugins: [publicDonations(), react()],
});
