"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText, ExternalLink, QrCode, Copy, Check, Download, X,
} from "lucide-react";
import QRCode from "qrcode";

// ============================================================
// FormularioDropdown — Dropdown con acciones del formulario público
// - Abrir formulario (nueva pestaña)
// - Generar QR (descargable como JPG)
// - Copiar link al portapapeles
// ============================================================

function getFormularioUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/cuestionario`;
  }
  return "/cuestionario";
}

export function FormularioDropdown() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAbrir = useCallback(() => {
    window.open(getFormularioUrl(), "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  const handleCopiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getFormularioUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = getFormularioUrl();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  }, []);

  const handleGenerarQR = useCallback(async () => {
    try {
      const url = getFormularioUrl();
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
      setOpen(false);
    } catch (err) {
      console.error("Error generando QR:", err);
    }
  }, []);

  const handleDescargarQR = useCallback(() => {
    if (!qrDataUrl) return;
    // Convert PNG data URL to JPG via canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      // White background for JPG (no transparency)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = jpgUrl;
      a.download = "formulario-mantenimiento-qr.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = qrDataUrl;
  }, [qrDataUrl]);

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
        >
          <FileText className="w-4 h-4" />
          Formulario
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-slate-100 border border-slate-300 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-1.5">
              <button
                onClick={handleAbrir}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                Abrir formulario
              </button>
              <button
                onClick={handleGenerarQR}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                Generar código QR
              </button>
              <button
                onClick={handleCopiar}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-violet-400" />
                    Copiar link
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && qrDataUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            {/* Close */}
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-900 transition-colors p-1 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Código QR del Formulario</h3>
                <p className="text-xs text-slate-500">
                  Escanea para acceder al cuestionario de mantenimiento
                </p>
              </div>

              {/* QR Image */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR del formulario" className="w-52 h-52" />
                </div>
              </div>

              {/* URL Preview */}
              <div className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500 font-mono break-all truncate">
                  {getFormularioUrl()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleDescargarQR}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar JPG
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(getFormularioUrl()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl border border-slate-300 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
