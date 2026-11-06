import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/source-sans-3/latin-700.css";
import "@fontsource/source-sans-3/latin-ext-400.css";
import "@fontsource/source-sans-3/latin-ext-600.css";
import "@fontsource/source-sans-3/latin-ext-700.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/source-serif-4/latin-700.css";
import "@fontsource/source-serif-4/latin-ext-600.css";
import "@fontsource/source-serif-4/latin-ext-700.css";
import { LoadingScreen } from "./components/LoadingScreen.tsx";
import { NotFound } from "./components/NotFound.tsx";
import { PollingDayNotice } from "./components/PollingDayNotice.tsx";
import {
  BUILD_FLAG,
  POLLING_DAY_END,
  POLLING_DAY_START,
  pollingDayActive,
} from "./lib/pollingDay.ts";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element missing");

/** Only the site root is a real route; filters live in the query string. */
function isKnownPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/index.html";
}

const now = Date.now();
const knownPath = isKnownPath(window.location.pathname);
const pollingDay = knownPath && pollingDayActive(now, window.location.search);
const missingPage = !knownPath;

// Start the app chunk immediately when polling-day mode is off, so the wait is shorter.
const loadApp = () => import("./App.tsx");
if (knownPath && !pollingDay) void loadApp();
const App = lazy(loadApp);

// Reload at the start and end of the window so an open tab switches over on time.
if (!BUILD_FLAG && knownPath) {
  for (const edge of [POLLING_DAY_START, POLLING_DAY_END]) {
    const wait = edge - now;
    if (wait > 0 && wait < 2 ** 31 - 1) window.setTimeout(() => window.location.reload(), wait + 1000);
  }
}

if (pollingDay) document.title = "Paused on election day";
if (missingPage) document.title = "Page not found · Who Funds NZ";

createRoot(root).render(
  <StrictMode>
    {missingPage ? (
      <NotFound />
    ) : pollingDay ? (
      <PollingDayNotice />
    ) : (
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    )}
  </StrictMode>,
);
