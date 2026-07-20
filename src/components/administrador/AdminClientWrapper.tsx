"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  UserCog,
  Store,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  agregarTecnico,
  editarTecnico,
  eliminarTecnico,
  agregarTienda,
  editarTienda,
  eliminarTienda,
} from "@/app/(dashboard)/administrador/admin-actions";
import { ZONAS, TIPOS_TIENDA } from "@/lib/cuestionario-catalogo";

// ─── Tipos ───────────────────────────────────────────────────
export interface TecnicoAdmin {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
}
export interface TiendaAdmin {
  id: number;
  nombre: string;
  zona: string;
  ubicacion: string;
  marca: string;
  tipo: string;
}

interface Props {
  tecnicos: TecnicoAdmin[];
  tiendas: TiendaAdmin[];
}

// ─── Estilos comunes ─────────────────────────────────────────
const inputCls =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";
const btnPrimary =
  "flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60";
const btnSecondary =
  "flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-60";

// ─── Panel de confirmación de eliminación ─────────────────────
function ConfirmDelete({
  nombre,
  onConfirm,
  onCancel,
  pending,
  error,
}: {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
  error: string;
}) {
  return (
    <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="text-sm font-medium">
          ¿Eliminar <span className="font-bold">&quot;{nombre}&quot;</span>?
        </p>
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onConfirm} disabled={pending} className={btnPrimary + " bg-red-600 hover:bg-red-700"}>
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Eliminar
        </button>
        <button onClick={onCancel} disabled={pending} className={btnSecondary}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAESTRO DE TÉCNICOS
// ─────────────────────────────────────────────────────────────
function MaestroTecnicos({ inicial }: { inicial: TecnicoAdmin[] }) {
  const [lista, setLista] = useState<TecnicoAdmin[]>(inicial);
  const [isPending, start] = useTransition();

  // Formulario de agregar
  const [showAdd, setShowAdd] = useState(false);
  const [addNombre, setAddNombre] = useState("");
  const [addCorreo, setAddCorreo] = useState("");
  const [addTelefono, setAddTelefono] = useState("");
  const [addError, setAddError] = useState("");

  // Edición en línea
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editError, setEditError] = useState("");

  // Eliminación con confirmación
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const resetAdd = () => {
    setAddNombre("");
    setAddCorreo("");
    setAddTelefono("");
    setAddError("");
    setShowAdd(false);
  };

  const handleAgregar = () => {
    setAddError("");
    start(async () => {
      const res = await agregarTecnico(addNombre, addCorreo, addTelefono);
      if ("error" in res) { setAddError(res.error); return; }
      setLista((p) => [
        ...p,
        {
          id: res.data.id,
          nombre: res.data.nombre,
          correo: res.data.correo ?? "",
          telefono: res.data.telefono ?? "",
        },
      ]);
      resetAdd();
    });
  };

  const startEdit = (t: TecnicoAdmin) => {
    setEditId(t.id);
    setEditNombre(t.nombre);
    setEditCorreo(t.correo ?? "");
    setEditTelefono(t.telefono ?? "");
    setEditError("");
    setDeleteId(null);
  };

  const handleEditar = (id: number) => {
    setEditError("");
    start(async () => {
      const res = await editarTecnico(id, editNombre, editCorreo, editTelefono);
      if ("error" in res) { setEditError(res.error); return; }
      setLista((p) =>
        p.map((t) =>
          t.id === id
            ? { ...t, nombre: editNombre.trim(), correo: editCorreo.trim(), telefono: editTelefono.trim() }
            : t
        )
      );
      setEditId(null);
    });
  };

  const handleEliminar = (id: number) => {
    setDeleteError("");
    start(async () => {
      const res = await eliminarTecnico(id);
      if ("error" in res) { setDeleteError(res.error); return; }
      setLista((p) => p.filter((t) => t.id !== id));
      setDeleteId(null);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <UserCog className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Técnicos</h2>
            <p className="text-[10px] text-slate-500">{lista.length} registrado{lista.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            showAdd
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? "Cancelar" : "Nuevo"}
        </button>
      </div>

      {/* Formulario de agregar */}
      {showAdd && (
        <div className="px-5 py-4 bg-blue-50/50 border-b border-blue-200 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Nombre *
            </label>
            <input
              value={addNombre}
              onChange={(e) => setAddNombre(e.target.value)}
              placeholder="Nombre completo"
              className={inputCls}
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Correo
              </label>
              <input
                value={addCorreo}
                onChange={(e) => setAddCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Teléfono
              </label>
              <input
                value={addTelefono}
                onChange={(e) => setAddTelefono(e.target.value)}
                placeholder="999 999 999"
                className={inputCls}
              />
            </div>
          </div>
          {addError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addError}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={handleAgregar} disabled={isPending} className={btnPrimary}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Guardar
            </button>
            <button onClick={resetAdd} disabled={isPending} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="divide-y divide-slate-100">
        {lista.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No hay técnicos registrados.
          </p>
        ) : (
          lista.map((t) => (
            <div key={t.id} className="px-5 py-3">
              {editId === t.id ? (
                /* ── Fila en modo edición ── */
                <div className="space-y-2">
                  <input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Nombre"
                    className={inputCls}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editCorreo}
                      onChange={(e) => setEditCorreo(e.target.value)}
                      placeholder="Correo"
                      type="email"
                      className={inputCls}
                    />
                    <input
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="Teléfono"
                      className={inputCls}
                    />
                  </div>
                  {editError && (
                    <p className="text-xs text-red-600">{editError}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(t.id)} disabled={isPending} className={btnPrimary}>
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </button>
                    <button onClick={() => setEditId(null)} disabled={isPending} className={btnSecondary}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Fila normal ── */
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.nombre}</p>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {t.correo && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Mail className="w-3 h-3" />{t.correo}
                          </span>
                        )}
                        {t.telefono && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3" />{t.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => { startEdit(t); setDeleteId(null); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(deleteId === t.id ? null : t.id); setDeleteError(""); setEditId(null); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {deleteId === t.id && (
                    <ConfirmDelete
                      nombre={t.nombre}
                      onConfirm={() => handleEliminar(t.id)}
                      onCancel={() => setDeleteId(null)}
                      pending={isPending}
                      error={deleteError}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Campos de una tienda (reutilizado en alta y edición) ─────
type TiendaForm = {
  nombre: string;
  zona: string;
  ubicacion: string;
  marca: string;
  tipo: string;
};
const TIENDA_VACIA: TiendaForm = {
  nombre: "",
  zona: "",
  ubicacion: "",
  marca: "",
  tipo: "",
};

function CamposTienda({
  form,
  onChange,
}: {
  form: TiendaForm;
  onChange: (patch: Partial<TiendaForm>) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Nombre *
        </label>
        <input
          value={form.nombre}
          onChange={(e) => onChange({ nombre: e.target.value })}
          placeholder="Ej: Tienda HONOR CC. Plaza Norte"
          className={inputCls}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Zona
          </label>
          <select
            value={form.zona}
            onChange={(e) => onChange({ zona: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {ZONAS.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tipo
          </label>
          <select
            value={form.tipo}
            onChange={(e) => onChange({ tipo: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            {TIPOS_TIENDA.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Ubicación
          </label>
          <input
            value={form.ubicacion}
            onChange={(e) => onChange({ ubicacion: e.target.value })}
            placeholder="Centro comercial"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Marca
          </label>
          <input
            value={form.marca}
            onChange={(e) => onChange({ marca: e.target.value })}
            placeholder="HONOR, XIAOMI…"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAESTRO DE TIENDAS
// ─────────────────────────────────────────────────────────────
function MaestroTiendas({ inicial }: { inicial: TiendaAdmin[] }) {
  const [lista, setLista] = useState<TiendaAdmin[]>(inicial);
  const [isPending, start] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<TiendaForm>(TIENDA_VACIA);
  const [addError, setAddError] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TiendaForm>(TIENDA_VACIA);
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const resetAdd = () => {
    setAddForm(TIENDA_VACIA);
    setAddError("");
    setShowAdd(false);
  };

  const handleAgregar = () => {
    setAddError("");
    start(async () => {
      const res = await agregarTienda(addForm);
      if ("error" in res) { setAddError(res.error); return; }
      setLista((p) => [...p, res.data]);
      resetAdd();
    });
  };

  const startEdit = (t: TiendaAdmin) => {
    setEditId(t.id);
    setEditForm({
      nombre: t.nombre,
      zona: t.zona,
      ubicacion: t.ubicacion,
      marca: t.marca,
      tipo: t.tipo,
    });
    setEditError("");
    setDeleteId(null);
  };

  const handleEditar = (id: number) => {
    setEditError("");
    start(async () => {
      const res = await editarTienda(id, editForm);
      if ("error" in res) { setEditError(res.error); return; }
      setLista((p) =>
        p.map((t) =>
          t.id === id
            ? { ...t, ...editForm, nombre: editForm.nombre.trim() }
            : t
        )
      );
      setEditId(null);
    });
  };

  const handleEliminar = (id: number) => {
    setDeleteError("");
    start(async () => {
      const res = await eliminarTienda(id);
      if ("error" in res) { setDeleteError(res.error); return; }
      setLista((p) => p.filter((t) => t.id !== id));
      setDeleteId(null);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tiendas / Oficinas</h2>
            <p className="text-[10px] text-slate-500">{lista.length} registrada{lista.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddError(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            showAdd
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? "Cancelar" : "Nueva"}
        </button>
      </div>

      {/* Formulario de agregar */}
      {showAdd && (
        <div className="px-5 py-4 bg-emerald-50/50 border-b border-emerald-200 space-y-3">
          <CamposTienda
            form={addForm}
            onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          />
          {addError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addError}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={handleAgregar} disabled={isPending} className={btnPrimary}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Guardar
            </button>
            <button onClick={resetAdd} disabled={isPending} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="divide-y divide-slate-100">
        {lista.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No hay tiendas u oficinas registradas.
          </p>
        ) : (
          lista.map((t) => (
            <div key={t.id} className="px-5 py-3">
              {editId === t.id ? (
                <div className="space-y-2.5">
                  <CamposTienda
                    form={editForm}
                    onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                  />
                  {editError && (
                    <p className="text-xs text-red-600">{editError}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleEditar(t.id)} disabled={isPending} className={btnPrimary}>
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </button>
                    <button onClick={() => setEditId(null)} disabled={isPending} className={btnSecondary}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.nombre}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        {t.zona && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3" />{t.zona}
                          </span>
                        )}
                        {t.ubicacion && (
                          <span className="text-[11px] text-slate-500">· {t.ubicacion}</span>
                        )}
                        {t.marca && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                            {t.marca}
                          </span>
                        )}
                        {t.tipo && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                            {t.tipo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => { startEdit(t); setDeleteId(null); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteId(deleteId === t.id ? null : t.id); setDeleteError(""); setEditId(null); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {deleteId === t.id && (
                    <ConfirmDelete
                      nombre={t.nombre}
                      onConfirm={() => handleEliminar(t.id)}
                      onCancel={() => setDeleteId(null)}
                      pending={isPending}
                      error={deleteError}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export function AdminClientWrapper({ tecnicos, tiendas }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MaestroTecnicos inicial={tecnicos} />
      <MaestroTiendas inicial={tiendas} />
    </div>
  );
}
