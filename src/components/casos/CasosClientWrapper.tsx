"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Trash2,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  eliminarSolicitud,
  actualizarUrgencia,
} from "@/app/(dashboard)/casos/casos-actions";
import { ModalDetalleCaso } from "./ModalDetalleCaso";
import { FormularioDropdown } from "./FormularioDropdown";
import { categoriaLabel } from "@/lib/cuestionario-catalogo";

// ─── Tipos compartidos ────────────────────────────────────────
export type NivelUrgencia = "Alta" | "Media" | "Baja";
export type Estatus =
  | "No iniciado"
  | "Solicitud de permiso de tienda"
  | "Adquisición y compras"
  | "En proceso"
  | "Terminado";

export const URGENCIAS: NivelUrgencia[] = ["Alta", "Media", "Baja"];
export const ESTATUS: Estatus[] = [
  "No iniciado",
  "Solicitud de permiso de tienda",
  "Adquisición y compras",
  "En proceso",
  "Terminado",
];

export interface TecnicoUI {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
}

// Una fila = una solicitud enviada desde el formulario público.
export interface SolicitudUI {
  id: number;
  numero: string; // correlativo autogenerado, p. ej. "0001"
  fecha: string; // created_at (ISO)
  tienda: string;
  categoria: string;
  solicitanteNombre: string;
  solicitanteCorreo: string;
  descripcion: string;
  imagen_url: string | null;
  nivelUrgencia: NivelUrgencia | null;
  estatus: Estatus;
  enProcesoAt: string | null; // ISO; momento de entrada a "En proceso"
  detallesCierre: string;
  imagenCierreUrl: string | null;
  tecnicoId: number | null;
  tecnicoNombre: string | null;
}

interface Props {
  solicitudes: SolicitudUI[];
  tecnicos: TecnicoUI[];
  isAdmin: boolean;
  categoriasDisponibles: string[];
}

const PAGE_SIZE = 25;

// Límite de atención en horas, según el nivel de urgencia.
const LIMITE_HORAS: Record<NivelUrgencia, number> = {
  Alta: 24,
  Media: 72,
  Baja: 14 * 24,
};

function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

// ─── Cálculo de tiempo restante ───────────────────────────────
type EstadoTiempo = "completado" | "sin" | "vencido" | "pronto" | "ok";

// Formatea una duración (ms): horas si es menos de un día, días si es más.
function formatDuracion(ms: number): string {
  const abs = Math.abs(ms);
  const horas = abs / 3_600_000;
  if (horas < 24) return `${horas.toFixed(0)} h`;
  return `${(abs / 86_400_000).toFixed(1)} días`;
}

function calcularTiempo(
  s: SolicitudUI,
  ahora: number
): { texto: string; estado: EstadoTiempo } {
  if (s.estatus === "Terminado") {
    return { texto: "Completado", estado: "completado" };
  }

  let inicioMs: number;
  let limiteHoras: number;

  if (s.estatus === "En proceso") {
    // Al entrar a "En proceso" el contador se reinicia y depende de la urgencia.
    if (!s.nivelUrgencia) {
      return { texto: "—", estado: "sin" };
    }
    inicioMs = new Date(s.enProcesoAt ?? s.fecha).getTime();
    limiteHoras = LIMITE_HORAS[s.nivelUrgencia];
  } else {
    // Etapas iniciales (No iniciado, Permiso de tienda, Adquisición):
    // 24 h fijas desde la creación, para cualquier nivel de urgencia.
    inicioMs = new Date(s.fecha).getTime();
    limiteHoras = 24;
  }

  if (isNaN(inicioMs)) return { texto: "—", estado: "sin" };

  // Resta de instantes absolutos (epoch ms): duración real,
  // independiente de la zona horaria del cliente.
  const restanteMs = inicioMs + limiteHoras * 3_600_000 - ahora;

  if (restanteMs <= 0) {
    return {
      texto: `Vencido (${formatDuracion(restanteMs)})`,
      estado: "vencido",
    };
  }
  return {
    texto: formatDuracion(restanteMs),
    estado: restanteMs < 86_400_000 ? "pronto" : "ok",
  };
}

const TIEMPO_CLS: Record<EstadoTiempo, string> = {
  completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sin: "bg-slate-50 text-slate-400 border-slate-200",
  vencido: "bg-red-50 text-red-700 border-red-200",
  pronto: "bg-amber-50 text-amber-700 border-amber-200",
  ok: "bg-slate-50 text-slate-600 border-slate-200",
};

const URGENCIA_CLS: Record<NivelUrgencia, string> = {
  Alta: "bg-red-50 text-red-700 border-red-300",
  Media: "bg-amber-50 text-amber-700 border-amber-300",
  Baja: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

const ESTATUS_CLS: Record<Estatus, string> = {
  "No iniciado": "bg-slate-100 text-slate-600 border-slate-300",
  "Solicitud de permiso de tienda":
    "bg-amber-50 text-amber-700 border-amber-300",
  "Adquisición y compras": "bg-violet-50 text-violet-700 border-violet-300",
  "En proceso": "bg-blue-50 text-blue-700 border-blue-300",
  Terminado: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

const thCls =
  "text-left px-3 py-2.5 text-slate-500 font-semibold uppercase tracking-wide whitespace-nowrap";

// ─── Filtro multi-selección ───────────────────────────────────
function FiltroMultiple({
  resumen,
  opciones,
  seleccion,
  open,
  setOpen,
  onToggle,
  onLimpiar,
  formatear,
}: {
  resumen: string;
  opciones: string[];
  seleccion: string[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onToggle: (valor: string) => void;
  onLimpiar: () => void;
  formatear?: (v: string) => string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs flex items-center justify-between min-w-[160px] text-slate-600 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
      >
        <span className="truncate pr-2">{resumen}</span>
        <span className="text-[10px] opacity-70">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 z-50 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-60 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-slate-200">
              <button
                onClick={onLimpiar}
                className="text-[10px] text-slate-500 hover:text-slate-800"
              >
                Limpiar
              </button>
            </div>
            {opciones.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">
                Sin opciones
              </p>
            ) : (
              opciones.map((o) => (
                <label
                  key={o}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2 accent-blue-600"
                    checked={seleccion.includes(o)}
                    onChange={() => onToggle(o)}
                  />
                  <span className="text-xs text-slate-700">
                    {formatear ? formatear(o) : o}
                  </span>
                </label>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export function CasosClientWrapper({
  solicitudes,
  tecnicos,
  isAdmin,
  categoriasDisponibles,
}: Props) {
  const router = useRouter();
  const [isPendingDelete, startDelete] = useTransition();
  const [, startUpdate] = useTransition();

  const [lista, setLista] = useState<SolicitudUI[]>(solicitudes);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);

  const [categoriaFiltro, setCategoriaFiltro] = useState<string[]>([]);
  const [openCategoria, setOpenCategoria] = useState(false);

  const [detalle, setDetalle] = useState<SolicitudUI | null>(null);
  const [eliminar, setEliminar] = useState<SolicitudUI | null>(null);
  const [elimError, setElimError] = useState("");

  // Reloj para "Tiempo restante". null hasta montar → evita
  // desajustes de hidratación entre el render del servidor y el cliente.
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hayFiltros = categoriaFiltro.length > 0;

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return lista.filter((s) => {
      if (categoriaFiltro.length > 0 && !categoriaFiltro.includes(s.categoria))
        return false;
      if (!q) return true;
      return (
        s.numero.toLowerCase().includes(q) ||
        s.tienda.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q) ||
        (s.tecnicoNombre?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [lista, busqueda, categoriaFiltro]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPages);
  const visibles = filtradas.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  );

  const limpiarFiltros = () => {
    setCategoriaFiltro([]);
    setBusqueda("");
    setPage(1);
  };

  const toggleCategoria = (c: string) => {
    setCategoriaFiltro((p) =>
      p.includes(c) ? p.filter((x) => x !== c) : [...p, c]
    );
    setPage(1);
  };

  // Aplica un cambio optimista a la lista y al detalle abierto.
  const aplicarCambio = (id: number, patch: Partial<SolicitudUI>) => {
    setLista((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDetalle((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const cambiarUrgencia = (s: SolicitudUI, nivel: NivelUrgencia) => {
    if (s.nivelUrgencia === nivel) return;
    const anterior = s.nivelUrgencia;
    aplicarCambio(s.id, { nivelUrgencia: nivel });
    startUpdate(async () => {
      const res = await actualizarUrgencia(s.id, nivel);
      if (res.error) {
        aplicarCambio(s.id, { nivelUrgencia: anterior });
        alert(res.error);
      }
    });
  };

  const confirmarEliminar = () => {
    if (!eliminar) return;
    setElimError("");
    startDelete(async () => {
      const res = await eliminarSolicitud(eliminar.id);
      if (res.error) {
        setElimError(res.error);
        return;
      }
      setLista((prev) => prev.filter((s) => s.id !== eliminar.id));
      if (detalle?.id === eliminar.id) setDetalle(null);
      setEliminar(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por N°, marca, tienda, técnico..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        <FormularioDropdown />
      </div>

      {/* Filtros */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Filtros
            </span>
            <span className="ml-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 font-medium">
              {filtradas.length}{" "}
              {filtradas.length === 1 ? "SOLICITUD" : "SOLICITUDES"}
            </span>
          </div>
          {(hayFiltros || busqueda) && (
            <button
              onClick={limpiarFiltros}
              className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiltroMultiple
            resumen={
              categoriaFiltro.length > 0
                ? `${categoriaFiltro.length} categoría(s)`
                : "Todas las categorías"
            }
            opciones={categoriasDisponibles}
            seleccion={categoriaFiltro}
            open={openCategoria}
            setOpen={setOpenCategoria}
            onToggle={toggleCategoria}
            onLimpiar={() => {
              setCategoriaFiltro([]);
              setPage(1);
            }}
            formatear={categoriaLabel}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-100">
              <tr>
                <th className={thCls}>N°</th>
                <th className={thCls}>Fecha</th>
                <th className={thCls}>Tienda</th>
                <th className={thCls}>Urgencia</th>
                <th className={thCls}>Tiempo restante</th>
                <th className={thCls}>Estatus</th>
                <th className={thCls}>Técnico</th>
                <th className={thCls}>Categoría</th>
                <th className={`${thCls} text-center`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    {busqueda || hayFiltros
                      ? "Sin resultados para los filtros seleccionados."
                      : "No hay solicitudes registradas."}
                  </td>
                </tr>
              ) : (
                visibles.map((s) => {
                  const tiempo =
                    ahora === null ? null : calcularTiempo(s, ahora);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setDetalle(s)}
                      className="border-t border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2.5 text-slate-500 font-mono whitespace-nowrap">
                        {s.numero}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono whitespace-nowrap">
                        {formatFecha(s.fecha)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-slate-700 max-w-[160px] truncate"
                        title={s.tienda}
                      >
                        {s.tienda || "—"}
                      </td>

                      {/* Urgencia — editable directamente en la tabla */}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={s.nivelUrgencia ?? ""}
                          onChange={(e) => {
                            if (e.target.value)
                              cambiarUrgencia(
                                s,
                                e.target.value as NivelUrgencia
                              );
                          }}
                          className={`text-[10px] font-semibold rounded-md border px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${
                            s.nivelUrgencia
                              ? URGENCIA_CLS[s.nivelUrgencia]
                              : "bg-white text-slate-400 border-slate-300"
                          }`}
                        >
                          <option value="" disabled>
                            Asignar
                          </option>
                          {URGENCIAS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tiempo restante — calculado */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {tiempo === null ? (
                          <span className="text-slate-300">…</span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              TIEMPO_CLS[tiempo.estado]
                            }`}
                          >
                            {tiempo.texto}
                          </span>
                        )}
                      </td>

                      {/* Estatus */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            ESTATUS_CLS[s.estatus]
                          }`}
                        >
                          {s.estatus}
                        </span>
                      </td>

                      {/* Técnico */}
                      <td
                        className="px-3 py-2.5 text-slate-700 max-w-[140px] truncate"
                        title={s.tecnicoNombre ?? ""}
                      >
                        {s.tecnicoNombre ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {categoriaLabel(s.categoria)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td
                        className="px-3 py-2.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Ver detalle"
                            onClick={() => setDetalle(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <PanelRightOpen className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              title="Eliminar"
                              onClick={() => {
                                setEliminar(s);
                                setElimError("");
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Página {paginaActual} de {totalPages} · {filtradas.length}{" "}
              solicitudes
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, paginaActual + 1))}
                disabled={paginaActual === totalPages}
                className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: detalle de solicitud */}
      {detalle && (
        <ModalDetalleCaso
          solicitud={detalle}
          tecnicos={tecnicos}
          onClose={() => setDetalle(null)}
          onUpdate={(patch) => aplicarCambio(detalle.id, patch)}
        />
      )}

      {/* Confirmación: eliminar */}
      {eliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Eliminar Solicitud
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              ¿Confirmas que deseas eliminar la solicitud{" "}
              <span className="font-mono text-red-600 font-bold">
                N° {eliminar.numero}
              </span>
              ?
            </p>
            {elimError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                {elimError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEliminar(null);
                  setElimError("");
                }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-500 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={isPendingDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {isPendingDelete ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isPendingDelete ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
