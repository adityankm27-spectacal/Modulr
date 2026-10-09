/** Loading placeholder sized like a list page, so content doesn't jump in. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-3/4 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
