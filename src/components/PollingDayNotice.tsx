import { POLLING_DAY_END } from "../lib/pollingDay.ts";

const CLOSE_TIME = new Date(POLLING_DAY_END).toLocaleString("en-NZ", {
  timeZone: "Pacific/Auckland",
  hour: "numeric",
  minute: "2-digit",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function PollingDayNotice() {
  return (
    <main className="polling-day" aria-labelledby="polling-day-title">
      <h1 id="polling-day-title">Paused while voting is open</h1>
      <p>
        This site is paused on election day. It will be back after voting closes at {CLOSE_TIME}.
      </p>
      <p>
        The Electoral Act 1993 does not allow party names or logos to be published on election
        day while voting is open, so no donation data is shown until then.
      </p>
      <p>
        The source data is published by the Electoral Commission at{" "}
        <a href="https://elections.nz/">elections.nz</a>. This site is not affiliated with the
        Electoral Commission.
      </p>
    </main>
  );
}
