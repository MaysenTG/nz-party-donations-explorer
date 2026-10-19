export function NotFound() {
  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <p className="not-found-brand">Who Funds NZ</p>
      <h1 id="not-found-title">Page not found</h1>
      <p>There is no page at this address. The explorer lives on the home page.</p>
      <p>
        <a href="/">Back to declared party donations</a>
      </p>
    </main>
  );
}
