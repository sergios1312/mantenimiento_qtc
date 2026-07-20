export default function LoadingCasos() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-slate-200 rounded" />

      {/* Toolbar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-72 bg-slate-200 rounded-xl" />
        <div className="flex-1" />
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Filtros skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 w-40 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tabla skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
