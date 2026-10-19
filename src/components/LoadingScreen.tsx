/** Shown while the donation data chunk loads. */
export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-screen-inner">
        <p className="loading-brand">Who Funds NZ</p>
        <div className="loading-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="loading-copy">Loading declared donations…</p>
      </div>
    </div>
  );
}
