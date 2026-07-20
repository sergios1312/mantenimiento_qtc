"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Store,
  Tag,
  Flag,
  Activity,
  UserCog,
  Loader2,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Upload,
  Save,
  ClipboardCheck,
} from "lucide-react";
import type {
  SolicitudUI,
  TecnicoUI,
  Estatus,
  NivelUrgencia,
} from "./CasosClientWrapper";
import { ESTATUS } from "./CasosClientWrapper";
import {
  actualizarEstatus,
  asignarTecnico,
  actualizarCierre,
} from "@/app/(dashboard)/casos/casos-actions";
import { previewImagen } from "@/lib/cloudinary";
import { categoriaLabel } from "@/lib/cuestionario-catalogo";

interface Props {
  solicitud: SolicitudUI;
  tecnicos: TecnicoUI[];
  onClose: () => void;
  onUpdate: (patch: Partial<SolicitudUI>) => void;
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

const URGENCIA_CLS: Record<NivelUrgencia, string> = {
  Alta: "text-red-700",
  Media: "text-amber-700",
  Baja: "text-emerald-700",
};

// Tope del archivo de entrada (antes de comprimir). Evita cargar
// imágenes enormes al canvas (memoria) en equipos modestos.
const MAX_FILE_MB = 10;
const COMPRESION_MAX_DIM = 1920; // px — coincide con el reescalado de Cloudinary

/**
 * Comprime una imagen en el navegador: la reescala a un máximo de
 * COMPRESION_MAX_DIM px por lado y la reexporta como JPEG. Respeta la
 * orientación EXIF (fotos de celular). Devuelve el base64 (sin encabezado).
 * Lanza si el formato no es decodificable (p. ej. HEIC en Chrome).
 */
async function comprimirImagen(
  file: File
): Promise<{ base64: string; tipo: string }> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const escala = Math.min(
    1,
    COMPRESION_MAX_DIM / Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.round(bitmap.width * escala);
  const height = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("sin-canvas");
  }
  // Fondo blanco: el JPEG no soporta transparencia.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { base64: dataUrl.split(",")[1], tipo: "image/jpeg" };
}

export function ModalDetalleCaso({
  solicitud,
  tecnicos,
  onClose,
  onUpdate,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // ── Estatus ──────────────────────────────────────────────
  const cambiarEstatus = (estatus: Estatus) => {
    if (estatus === solicitud.estatus) return;
    startTransition(async () => {
      const res = await actualizarEstatus(solicitud.id, estatus);
      if (res.error) { alert(res.error); return; }
      onUpdate({
        estatus,
        ...(res.enProcesoAt ? { enProcesoAt: res.enProcesoAt } : {}),
      });
    });
  };

  // ── Técnico: selección pendiente + botón "Asignar" ───────
  const [pendingTecnicoId, setPendingTecnicoId] = useState<number | null>(
    solicitud.tecnicoId
  );
  // Sincronizar cuando se abre una solicitud diferente
  useEffect(() => {
    setPendingTecnicoId(solicitud.tecnicoId);
  }, [solicitud.id, solicitud.tecnicoId]);

  const tecnicoSel = pendingTecnicoId
    ? tecnicos.find((t) => t.id === pendingTecnicoId) ?? null
    : null;

  const hayPendiente = pendingTecnicoId !== solicitud.tecnicoId;

  const handleAsignar = () => {
    const tecnico = pendingTecnicoId
      ? tecnicos.find((t) => t.id === pendingTecnicoId) ?? null
      : null;
    startTransition(async () => {
      const res = await asignarTecnico(
        solicitud.id,
        pendingTecnicoId,
        tecnico?.nombre ?? null,
        tecnico?.correo ?? null,
        {
          numero: solicitud.numero,
          fecha: solicitud.fecha,
          tienda: solicitud.tienda,
          categoria: solicitud.categoria,
          descripcion: solicitud.descripcion,
          nivelUrgencia: solicitud.nivelUrgencia,
          estatus: solicitud.estatus,
          imagen_url: solicitud.imagen_url,
          solicitanteNombre: solicitud.solicitanteNombre,
          solicitanteCorreo: solicitud.solicitanteCorreo,
        }
      );
      if (res.error) { alert(res.error); return; }
      onUpdate({ tecnicoId: pendingTecnicoId, tecnicoNombre: tecnico?.nombre ?? null });
    });
  };

  // ── Cierre del caso ──────────────────────────────────────
  const [savingCierre, startCierre] = useTransition();
  const [detallesCierre, setDetallesCierre] = useState(solicitud.detallesCierre);
  const [cierreFile, setCierreFile] = useState<File | null>(null);
  const [cierrePreview, setCierrePreview] = useState<string | null>(null);
  const cierreRef = useRef<HTMLInputElement>(null);

  // Sincronizar al abrir una solicitud diferente
  useEffect(() => {
    setDetallesCierre(solicitud.detallesCierre);
    setCierreFile(null);
    setCierrePreview(null);
  }, [solicitud.id, solicitud.detallesCierre]);

  // Libera el blob URL de la previsualización al reemplazarlo o al
  // desmontar el modal (evita fuga de memoria).
  useEffect(() => {
    return () => {
      if (cierrePreview) URL.revokeObjectURL(cierrePreview);
    };
  }, [cierrePreview]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleCierreFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("El archivo debe ser una imagen.");
      return;
    }
    // Bloquea aquí, ANTES de procesar o subir: nunca se envía a Cloudinary
    // un archivo por encima del tope.
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      alert(
        `La imagen pesa ${mb} MB y supera el máximo de ${MAX_FILE_MB} MB. ` +
          `Usa una imagen más liviana (o pide ampliar el límite).`
      );
      return;
    }

    setCierreFile(file);
    setCierrePreview(URL.createObjectURL(file));
  };

  const quitarCierreFile = () => {
    setCierreFile(null);
    setCierrePreview(null);
    if (cierreRef.current) cierreRef.current.value = "";
  };

  const guardarCierre = () => {
    const detalles = detallesCierre.trim();
    // Evita guardados vacíos accidentales.
    if (!detalles && !cierreFile && !solicitud.imagenCierreUrl) {
      alert("Agrega los detalles de cierre o una imagen del trabajo realizado.");
      return;
    }

    startCierre(async () => {
      try {
        let imagenBase64: string | undefined;
        let imagenTipo: string | undefined;
        if (cierreFile) {
          try {
            // Comprime para una subida rápida y liviana.
            const c = await comprimirImagen(cierreFile);
            imagenBase64 = c.base64;
            imagenTipo = c.tipo;
          } catch {
            // Formato no decodificable en el navegador (p. ej. HEIC):
            // se envía el original y Cloudinary lo convierte.
            imagenBase64 = await toBase64(cierreFile);
            imagenTipo = cierreFile.type || "image/jpeg";
          }
        }

        const res = await actualizarCierre(
          solicitud.id,
          detalles,
          imagenBase64,
          imagenTipo
        );
        if (res.error) { alert(res.error); return; }
        onUpdate({
          detallesCierre: detalles,
          ...(res.imagenCierreUrl
            ? { imagenCierreUrl: res.imagenCierreUrl }
            : {}),
        });
        quitarCierreFile();
      } catch {
        // Falla de transporte/servidor: avisar sin tumbar la página.
        alert(
          "No se pudo guardar el cierre. Revisa tu conexión e inténtalo de nuevo."
        );
      }
    });
  };

  const campos = [
    {
      icon: <Calendar className="w-4 h-4" />,
      label: "Fecha de envío",
      valor: formatFechaHora(solicitud.fecha),
    },
    {
      icon: <User className="w-4 h-4" />,
      label: "Reportado por",
      valor: solicitud.solicitanteNombre,
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Correo solicitante",
      valor: solicitud.solicitanteCorreo,
    },
    {
      icon: <Store className="w-4 h-4" />,
      label: "Tienda",
      valor: solicitud.tienda,
    },
    {
      icon: <Tag className="w-4 h-4" />,
      label: "Categoría",
      valor: categoriaLabel(solicitud.categoria),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Solicitud de Mantenimiento
            </h2>
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              N° {solicitud.numero}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {/* Datos del formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {campos.map(({ icon, label, valor }) => (
              <div
                key={label}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5"
              >
                <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm text-slate-800 mt-0.5 break-words">
                    {valor || "—"}
                  </p>
                </div>
              </div>
            ))}

            {/* Nivel de urgencia (se edita desde la tabla) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <div className="mt-0.5 text-slate-400 shrink-0">
                <Flag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Nivel de urgencia
                </p>
                <p
                  className={`text-sm mt-0.5 font-semibold ${
                    solicitud.nivelUrgencia
                      ? URGENCIA_CLS[solicitud.nivelUrgencia]
                      : "text-slate-400"
                  }`}
                >
                  {solicitud.nivelUrgencia ?? "Sin asignar"}
                </p>
              </div>
            </div>
          </div>

          {/* Gestión: estatus + técnico */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
              Gestión del mantenimiento
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <Activity className="w-3.5 h-3.5" /> Estatus
                </label>
                <select
                  value={solicitud.estatus}
                  disabled={isPending}
                  onChange={(e) => cambiarEstatus(e.target.value as Estatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
                >
                  {ESTATUS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <UserCog className="w-3.5 h-3.5" /> Técnico responsable
                </label>
                <div className="flex gap-2">
                  <select
                    value={pendingTecnicoId ?? ""}
                    disabled={isPending}
                    onChange={(e) =>
                      setPendingTecnicoId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
                  >
                    <option value="">— Sin asignar —</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  {hayPendiente && (
                    <button
                      onClick={handleAsignar}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Asignar
                    </button>
                  )}
                </div>
              </div>
            </div>
            {tecnicoSel && (tecnicoSel.correo || tecnicoSel.telefono) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                {tecnicoSel.correo && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {tecnicoSel.correo}
                  </span>
                )}
                {tecnicoSel.telefono && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {tecnicoSel.telefono}
                  </span>
                )}
              </div>
            )}
            {isPending && !hayPendiente && (
              <p className="flex items-center gap-1.5 text-xs text-blue-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Descripción del problema
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
              {solicitud.descripcion || "—"}
            </p>
          </div>

          {/* Evidencia fotográfica */}
          {solicitud.imagen_url && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Evidencia fotográfica
              </p>
              <a
                href={solicitud.imagen_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImagen(solicitud.imagen_url)}
                  alt="Evidencia"
                  loading="lazy"
                  className="w-full object-cover max-h-64"
                />
                <p className="text-[10px] text-center text-slate-400 py-1.5 bg-slate-50">
                  Clic para ver en tamaño completo
                </p>
              </a>
            </div>
          )}

          {/* Cierre del caso */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              <ClipboardCheck className="w-3.5 h-3.5" /> Cierre del caso
            </p>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Detalles de cierre
              </label>
              <textarea
                value={detallesCierre}
                onChange={(e) => setDetallesCierre(e.target.value)}
                rows={3}
                placeholder="Describe cómo se solucionó el problema…"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Imagen de cierre
              </label>

              {/* Imagen ya guardada (si no hay una nueva seleccionada) */}
              {solicitud.imagenCierreUrl && !cierrePreview && (
                <a
                  href={solicitud.imagenCierreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors mb-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImagen(solicitud.imagenCierreUrl)}
                    alt="Imagen de cierre"
                    loading="lazy"
                    className="w-full object-cover max-h-56"
                  />
                </a>
              )}

              {/* Previsualización del archivo recién seleccionado */}
              {cierrePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cierrePreview}
                    alt="Previsualización"
                    className="w-full object-cover max-h-56 rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={quitarCierreFile}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => cierreRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-lg p-4 text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs text-slate-600">
                    {solicitud.imagenCierreUrl
                      ? "Reemplazar imagen"
                      : "Cargar foto del problema resuelto"}
                  </p>
                </div>
              )}
              <input
                ref={cierreRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleCierreFile(e.target.files)}
                className="hidden"
              />
            </div>

            <button
              onClick={guardarCierre}
              disabled={savingCierre}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
            >
              {savingCierre ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar cierre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
