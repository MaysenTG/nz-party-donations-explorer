/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "1" at build time to turn polling day mode on for the whole deploy. */
  readonly VITE_POLLING_DAY?: string;
}
