"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "./actions";
import { Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 px-4
                 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                 rounded-xl transition-all duration-200 shadow-md shadow-blue-500/20
                 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none
                 focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-white"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Verificando...
        </>
      ) : (
        "Ingresar"
      )}
    </button>
  );
}

interface UsuarioOption {
  usuario: string;
  ciudad: string;
  responsable: string;
}

export function LoginForm({ usuarios }: { usuarios: UsuarioOption[] }) {
  const [state, action] = useActionState(signIn, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="usuario" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Usuario
        </label>
        <select
          id="usuario"
          name="usuario"
          required
          defaultValue=""
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-slate-400"
        >
          <option value="" disabled>— Selecciona un usuario —</option>
          {usuarios.map((u) => (
            <option key={u.usuario} value={u.usuario}>
              {u.ciudad} ({u.responsable})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pin" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          PIN de acceso
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          placeholder="••••"
          required
          autoComplete="current-password"
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-400 hover:border-slate-400"
        />
      </div>

      {state?.error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
