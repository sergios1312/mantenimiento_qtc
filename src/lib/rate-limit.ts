// ============================================================
// src/lib/rate-limit.ts
// Rate-limit en memoria por proceso. Suficiente para desarrollo
// local con un solo proceso Next.js. Los contadores se resetean
// cuando reinicias el servidor.
// ============================================================

interface LimitWindow {
  max: number;
  windowSec: number;
}

interface CheckArgs {
  endpoint: string;
  ip: string;
  limits: LimitWindow[];
  /** Si true (default), registra el intento al pasar todas las cuotas. */
  record?: boolean;
}

interface CheckResult {
  ok: boolean;
  retryAfterSec?: number;
  message?: string;
}

const buckets = new Map<string, number[]>();

export async function checkRateLimit(args: CheckArgs): Promise<CheckResult> {
  const { endpoint, ip, limits, record = true } = args;
  if (!ip || ip === "unknown") {
    // Sin IP confiable no aplicamos el límite
    return { ok: true };
  }

  const bucket = `${endpoint}:${ip}`;
  const now = Date.now();
  const maxWindowMs = Math.max(...limits.map((l) => l.windowSec)) * 1000;
  const since = now - maxWindowMs;

  // Limpiar timestamps antiguos
  const ts = (buckets.get(bucket) ?? []).filter((t) => t >= since);

  for (const lim of limits) {
    const windowStart = now - lim.windowSec * 1000;
    const count = ts.filter((t) => t >= windowStart).length;
    if (count >= lim.max) {
      const oldest = ts.filter((t) => t >= windowStart).sort((a, b) => a - b)[0];
      const retryAfterMs = oldest + lim.windowSec * 1000 - now;
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
      buckets.set(bucket, ts);
      return {
        ok: false,
        retryAfterSec,
        message: `Demasiadas solicitudes. Intente nuevamente en ${formatRetry(retryAfterSec)}.`,
      };
    }
  }

  if (record) ts.push(now);
  buckets.set(bucket, ts);

  return { ok: true };
}

function formatRetry(sec: number): string {
  if (sec < 60) return `${sec} segundos`;
  if (sec < 3600) return `${Math.ceil(sec / 60)} minutos`;
  return `${Math.ceil(sec / 3600)} horas`;
}
