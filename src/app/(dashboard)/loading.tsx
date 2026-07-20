import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-white border border-slate-200 rounded-xl">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <h3 className="text-lg font-medium text-slate-800">Cargando módulo...</h3>
      <p className="text-sm text-slate-500">Un momento, por favor</p>
    </div>
  );
}
