/**
 * Polling day mode.
 *
 * The Electoral Act 1993, s 197(1)(g), bars publishing any party name, emblem, slogan or logo
 * on polling day before the poll closes. While this mode is on, the site shows a neutral
 * notice only, with no party names, colours or charts.
 *
 * It turns on in either of two ways:
 * 1. Automatically, from the visitor's clock, between POLLING_DAY_START and POLLING_DAY_END.
 * 2. At build time, with VITE_POLLING_DAY=1 (for example `VITE_POLLING_DAY=1 npm run build`).
 *    Use this if a deploy is made for the day, so the mode does not depend on any clock.
 *
 * `?preview=polling-day` forces the mode on for checking. Nothing can force it off inside
 * the window.
 */

/** 2026 general election: polls close at 7 pm NZDT on Saturday 7 November 2026. */
export const POLLING_DAY_START = Date.parse("2026-11-07T00:00:00+13:00");
export const POLLING_DAY_END = Date.parse("2026-11-07T19:00:00+13:00");

export const BUILD_FLAG = import.meta.env.VITE_POLLING_DAY === "1";

export function inPollingWindow(nowMs: number): boolean {
  return nowMs >= POLLING_DAY_START && nowMs < POLLING_DAY_END;
}

export function previewRequested(search: string): boolean {
  return new URLSearchParams(search).get("preview") === "polling-day";
}

export function pollingDayActive(nowMs: number, search: string): boolean {
  return BUILD_FLAG || inPollingWindow(nowMs) || previewRequested(search);
}
