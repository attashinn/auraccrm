export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-[rgba(17,17,17,0.06)] rounded-lg" />
          <div className="h-3 w-80 bg-[rgba(17,17,17,0.04)] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-[rgba(17,17,17,0.06)] rounded-lg" />
          <div className="h-8 w-24 bg-[rgba(17,17,17,0.06)] rounded-lg" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="surface-card rounded-[28px] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[rgba(17,17,17,0.06)] rounded" />
              <div className="h-8 w-8 bg-[rgba(17,17,17,0.06)] rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-[rgba(17,17,17,0.08)] rounded-lg" />
            <div className="h-2.5 w-24 bg-[rgba(17,17,17,0.04)] rounded" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="surface-card rounded-[28px] p-6 space-y-4 lg:col-span-2">
          <div className="h-4 w-40 bg-[rgba(17,17,17,0.06)] rounded" />
          <div className="h-3 w-60 bg-[rgba(17,17,17,0.04)] rounded" />
          <div className="h-[240px] bg-[rgba(17,17,17,0.04)] rounded-2xl" />
        </div>
        <div className="surface-card rounded-[28px] p-6 space-y-4">
          <div className="h-4 w-32 bg-[rgba(17,17,17,0.06)] rounded" />
          <div className="h-3 w-48 bg-[rgba(17,17,17,0.04)] rounded" />
          <div className="h-[240px] bg-[rgba(17,17,17,0.04)] rounded-2xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="surface-card rounded-[28px] p-6 space-y-4">
            <div className="h-4 w-36 bg-[rgba(17,17,17,0.06)] rounded" />
            <div className="h-3 w-52 bg-[rgba(17,17,17,0.04)] rounded" />
            <div className="h-[180px] bg-[rgba(17,17,17,0.04)] rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
