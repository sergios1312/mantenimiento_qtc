/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  Upload,
  X,
  FileText,
  Film,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Send,
  MapPin,
} from "lucide-react";
import {
  CATEGORIAS,
  categoriaLabel,
  esCorreoQtc,
  type TiendaOption,
} from "@/lib/cuestionario-catalogo";

type FormStatus = "idle" | "submitting" | "success" | "error";

interface ArchivoPreview {
  file: File;
  preview: string | null;
  tipo: "image" | "video" | "raw";
}

function getTipoArchivo(file: File): "image" | "video" | "raw" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "raw";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// text-base (16px) en todos los inputs — evita zoom automático en iOS Safari
const cardCls =
  "bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm";
const labelCls =
  "block text-sm font-semibold text-slate-900 mb-2.5 sm:mb-3";
const fieldCls =
  "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 " +
  "placeholder:text-slate-400 hover:border-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";

export function FormularioCuestionario({
  tiendas = [],
}: {
  tiendas?: TiendaOption[];
}) {
  const [solicitanteNombre, setSolicitanteNombre] = useState("");
  const [solicitanteCorreo, setSolicitanteCorreo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");

  // Selección de tienda en cascada
  const [zona, setZona] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  // Fallback si aún no se han cargado tiendas en la base de datos
  const [tiendaManual, setTiendaManual] = useState("");

  const [foto, setFoto] = useState<ArchivoPreview | null>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Listas derivadas para el desplegable en cascada ──────────
  const sinTiendas = tiendas.length === 0;

  const zonas = useMemo(() => {
    const orden = ["Zona Norte", "Zona Centro", "Zona Sur"];
    const unicas = Array.from(
      new Set(tiendas.map((t) => t.zona).filter(Boolean))
    );
    return unicas.sort((a, b) => {
      const ia = orden.indexOf(a);
      const ib = orden.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [tiendas]);

  const ubicaciones = useMemo(() => {
    if (!zona) return [];
    return Array.from(
      new Set(
        tiendas
          .filter((t) => t.zona === zona)
          .map((t) => t.ubicacion)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [tiendas, zona]);

  const tiendasFiltradas = useMemo(
    () => tiendas.filter((t) => t.zona === zona && t.ubicacion === ubicacion),
    [tiendas, zona, ubicacion]
  );

  const tiendaSel = useMemo(
    () => tiendas.find((t) => t.id === tiendaId) ?? null,
    [tiendas, tiendaId]
  );

  const handleZona = (z: string) => {
    setZona(z);
    setUbicacion("");
    setTiendaId(null);
  };
  const handleUbicacion = (u: string) => {
    setUbicacion(u);
    setTiendaId(null);
  };

  const handleFotoChange = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo supera 10 MB.");
      return;
    }
    setFoto({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      tipo: getTipoArchivo(file),
    });
  }, []);

  const handleQuitarFoto = () => {
    if (foto?.preview) URL.revokeObjectURL(foto.preview);
    setFoto(null);
    if (fotoRef.current) fotoRef.current.value = "";
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = solicitanteNombre.trim();
    const correo = solicitanteCorreo.trim();
    const tiendaOk = sinTiendas
      ? tiendaManual.trim().length > 0
      : tiendaId !== null;

    if (!nombre) {
      setErrorMsg("Ingrese el nombre de quien reporta.");
      setStatus("error");
      return;
    }
    if (!correo) {
      setErrorMsg("Ingrese su correo QTC.");
      setStatus("error");
      return;
    }
    if (!esCorreoQtc(correo)) {
      setErrorMsg("El correo ingresado no es válido.");
      setStatus("error");
      return;
    }
    if (!tiendaOk || !descripcion.trim() || !categoria) {
      setErrorMsg("Complete todos los campos obligatorios.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      let imagen_base64: string | undefined;
      let imagen_tipo: string | undefined;
      if (foto) {
        imagen_base64 = await toBase64(foto.file);
        imagen_tipo = foto.file.type;
      }

      const payload = {
        solicitante_nombre: solicitanteNombre.trim(),
        solicitante_correo: solicitanteCorreo.trim(),
        tienda_id: sinTiendas ? null : tiendaId,
        tienda: sinTiendas ? tiendaManual.trim() : tiendaSel?.nombre ?? "",
        descripcion: descripcion.trim(),
        categoria,
        website: honeypot,
        ...(imagen_base64 && { imagen_base64, imagen_tipo }),
      };

      const res = await fetch("/api/cuestionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Error al enviar el formulario.");

      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error desconocido."
      );
      setStatus("error");
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────
  if (status === "success") {
    return (
      <div className={`${cardCls} text-center max-w-2xl mx-auto`}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
          ¡Solicitud enviada!
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
          Tu solicitud de mantenimiento fue registrada. El equipo encargado
          la revisará a la brevedad.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-colors shadow-sm text-base"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-5"
    >
      {/* Honeypot anti-bot */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="website">No completar este campo</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* 1. Datos de quien reporta */}
      <div className={cardCls}>
        <label className={labelCls}>
          1. Datos de quien reporta{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5">
              Nombre
            </span>
            <input
              type="text"
              value={solicitanteNombre}
              onChange={(e) => setSolicitanteNombre(e.target.value)}
              required
              placeholder="Nombre y apellido"
              className={fieldCls}
              autoCapitalize="words"
            />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5">
              Correo QTC
            </span>
            <input
              type="email"
              value={solicitanteCorreo}
              onChange={(e) => setSolicitanteCorreo(e.target.value)}
              required
              placeholder="Escriba su correo"
              className={fieldCls}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
            />
          </div>
        </div>
      </div>

      {/* 2. Tienda / Oficina — selección en cascada */}
      <div className={cardCls}>
        <label className={labelCls}>
          2. ¿Para qué Tienda / Oficina?{" "}
          <span className="text-red-500">*</span>
        </label>

        {sinTiendas ? (
          /* Fallback: aún no hay tiendas cargadas en la base de datos */
          <input
            type="text"
            value={tiendaManual}
            onChange={(e) => setTiendaManual(e.target.value)}
            required
            placeholder="Escriba la tienda u oficina"
            className={fieldCls}
            autoCapitalize="words"
          />
        ) : (
          <div className="space-y-3">
            {/* Paso 1 · Zona */}
            <div>
              <span className="block text-xs font-medium text-slate-500 mb-1.5">
                Zona
              </span>
              <select
                value={zona}
                onChange={(e) => handleZona(e.target.value)}
                required
                className={`${fieldCls} appearance-none cursor-pointer`}
              >
                <option value="">Selecciona tu zona</option>
                {zonas.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Paso 2 · Ubicación */}
            {zona && (
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1.5">
                  Ubicación / Centro comercial
                </span>
                <select
                  value={ubicacion}
                  onChange={(e) => handleUbicacion(e.target.value)}
                  required
                  className={`${fieldCls} appearance-none cursor-pointer`}
                >
                  <option value="">Selecciona la ubicación</option>
                  {ubicaciones.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paso 3 · Tienda */}
            {zona && ubicacion && (
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1.5">
                  Tienda / punto
                </span>
                <select
                  value={tiendaId ?? ""}
                  onChange={(e) =>
                    setTiendaId(e.target.value ? Number(e.target.value) : null)
                  }
                  required
                  className={`${fieldCls} appearance-none cursor-pointer`}
                >
                  <option value="">Selecciona la tienda</option>
                  {tiendasFiltradas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Resumen de la selección */}
            {tiendaSel && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800 leading-snug">
                  <span className="font-semibold">{tiendaSel.nombre}</span>
                  {tiendaSel.marca ? ` · ${tiendaSel.marca}` : ""}
                  {tiendaSel.tipo ? ` · ${tiendaSel.tipo}` : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Descripción del problema */}
      <div className={cardCls}>
        <label className={labelCls}>
          3. Descripción del problema{" "}
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          rows={4}
          placeholder="Describa la falla o necesidad..."
          className={`${fieldCls} resize-none`}
          autoCapitalize="sentences"
        />
      </div>

      {/* 4. Categoría */}
      <div className={cardCls}>
        <label className={labelCls}>
          4. Categoría <span className="text-red-500">*</span>
        </label>
        {/* Grid 2 col en móvil, lista en tablet+ */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
          {CATEGORIAS.map((cat) => (
            <label
              key={cat}
              className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                categoria === cat
                  ? "bg-blue-50 border-blue-300 text-blue-900"
                  : "bg-white border-slate-200 text-slate-700 active:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="categoria"
                value={cat}
                checked={categoria === cat}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-4 h-4 accent-blue-600 shrink-0"
              />
              <span className="text-xs sm:text-sm font-medium leading-tight">
                {categoriaLabel(cat)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Foto de evidencia */}
      <div className={cardCls}>
        <label className={`${labelCls} mb-1`}>
          5. Foto de evidencia{" "}
          <span className="text-slate-400 text-xs font-normal">
            (opcional)
          </span>
        </label>

        {!foto ? (
          <div
            onClick={() => fotoRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 active:border-blue-400 hover:bg-blue-50/30 rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-all"
          >
            <Upload className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-700">
              Toca para{" "}
              <span className="text-blue-600 font-semibold">
                cargar archivo
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Máx. 10 MB · imagen o PDF
            </p>
            <input
              ref={fotoRef}
              type="file"
              accept=".pdf,image/*,video/*"
              onChange={(e) => handleFotoChange(e.target.files)}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
            {foto.tipo === "image" && foto.preview ? (
              <img
                src={foto.preview}
                alt=""
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : foto.tipo === "video" ? (
              <Film className="w-14 h-14 p-3 text-blue-600 bg-blue-50 rounded-lg flex-shrink-0" />
            ) : (
              <FileText className="w-14 h-14 p-3 text-amber-600 bg-amber-50 rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {foto.file.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatBytes(foto.file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuitarFoto}
              className="p-2 text-slate-400 hover:text-red-600 active:text-red-700 transition-colors rounded-lg hover:bg-red-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Botón enviar */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-4 rounded-xl font-semibold text-white text-base
          bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-md shadow-blue-500/20 hover:shadow-blue-500/30
          transition-all duration-200 flex items-center justify-center gap-2"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar Solicitud
          </>
        )}
      </button>
    </form>
  );
}
