import { ProductGridSkeleton } from "./product-card";

export function ListingSkeleton() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-5 h-9 w-72" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-full" />
          ))}
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
