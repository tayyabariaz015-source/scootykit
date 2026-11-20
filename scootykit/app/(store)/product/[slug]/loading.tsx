export default function Loading() {
  return (
    <div className="container-page py-6 sm:py-10" aria-busy="true">
      <div className="skeleton h-4 w-64" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
