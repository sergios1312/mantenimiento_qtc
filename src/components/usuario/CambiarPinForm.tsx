"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cambiarPin } from "@/app/(dashboard)/usuario/usuario-actions";

const fieldCls =
  "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 tracking-widest " +
  "placeholder:text-slate-400 placeholder:tracking-normal hover:border-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";

export function CambiarPinForm() {
  const [pinActual, setPinActual] = useState("");
  const [pinNuevo, setPinNuevo] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ver, setVer] = useState(false);

  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [isPending, start] = useTransition();

  // Solo permite dígitos en los campos de PIN.
  const soloDigitos = (v: string) => v.replace(/\D/g, "").slice(0, 12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk(false);

    if (!pinActual || !pinNuevo || !confirmar) {
      setError("Completa todos los campos.");
      return;
    }
    if (pinNuevo.length < 4) {
      setError("El nuevo PIN debe tener al menos 4 dígitos.");
      return;
    }
    if (pinNuevo !== confirmar) {
      setError("El nuevo PIN y su confirmación no coinciden.");
      return;
    }
    if (pinNuevo === pinActual) {
      setError("El nuevo PIN debe ser distinto al actual.");
      return;
    }

    start(async () => {
      const res = await cambiarPin(pinActual, pinNuevo);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOk(true);
      setPinActual("");
      setPinNuevo("");
      setConfirmar("");
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Cambiar PIN</h2>
          <p className="text-[10px] text-slate-500">
            Mínimo 4 dígitos numéricos.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 max-w-sm">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            PIN actual
          </label>
          <input
            type={ver ? "text" : "password"}
            inputMode="numeric"
            autoComplete="current-password"
            value={pinActual}
            onChange={(e) => setPinActual(soloDigitos(e.target.value))}
            placeholder="••••"
            className={fieldCls}
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nuevo PIN
          </label>
          <div className="relative">
            <input
              type={ver ? "text" : "password"}
              inputMode="numeric"
              autoComplete="new-password"
              value={pinNuevo}
              onChange={(e) => setPinNuevo(soloDigitos(e.target.value))}
              placeholder="Mínimo 4 dígitos"
              className={`${fieldCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
              aria-label={ver ? "Ocultar" : "Mostrar"}
            >
              {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Confirmar nuevo PIN
          </label>
          <input
            type={ver ? "text" : "password"}
            inputMode="numeric"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(soloDigitos(e.target.value))}
            placeholder="Repite el nuevo PIN"
            className={fieldCls}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {ok && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            PIN actualizado correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          Actualizar PIN
        </button>
      </form>
    </div>
  );
}
