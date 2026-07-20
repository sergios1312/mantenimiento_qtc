import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { categoriaLabel } from "@/lib/cuestionario-catalogo";
import {
  EstadisticasClient,
  type DatosEstadisticas,
} from "@/components/estadisticas/EstadisticasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estadísticas",
};

// Horas de trabajo de un caso terminado: desde que entró a "En proceso"
// (o desde su creación si no tenemos esa marca) hasta su cierre.
function horasDeTrabajo(r: {
  created_at: string;
  en_proceso_at: string | null;
  terminado_at: string | null;
}): number | null {
  if (!r.terminado_at) return null;
  const fin = new Date(r.terminado_at).getTime();
  const inicio = new Date(r.en_proceso_at ?? r.created_at).getTime();
  if (isNaN(fin) || isNaN(inicio) || fin <= inicio) return null;
  return (fin - inicio) / 3_600_000;
}

export default async function EstadisticasPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [resCasos, { data: tecnicosData }, { data: tiendasData }] =
    await Promise.all([
      supabaseAdmin
        .from("respuestas_cuestionario")
        .select(
          "id, categoria, tienda_id, tecnico_id, created_at, en_proceso_at, terminado_at, estatus"
        ),
      supabaseAdmin.from("tecnicos").select("id, nombre"),
      supabaseAdmin.from("tiendas").select("id, zona"),
    ]);

  // Fallback si la columna terminado_at aún no se migró en la BD:
  // los conteos funcionan igual; las métricas de tiempo quedan vacías.
  let respuestas = resCasos.data as
    | {
        id: number;
        categoria: string;
        tienda_id: number | null;
        tecnico_id: number | null;
        created_at: string;
        en_proceso_at: string | null;
        terminado_at: string | null;
        estatus: string;
      }[]
    | null;
  if (resCasos.error) {
    const { data } = await supabaseAdmin
      .from("respuestas_cuestionario")
      .select(
        "id, categoria, tienda_id, tecnico_id, created_at, en_proceso_at, estatus"
      );
    respuestas = (data ?? []).map((r) => ({ ...r, terminado_at: null }));
  }

  const casos = respuestas ?? [];
  const nombreTecnico = new Map(
    (tecnicosData ?? []).map((t) => [t.id, t.nombre as string])
  );
  const zonaTienda = new Map(
    (tiendasData ?? []).map((t) => [t.id, (t.zona as string) || "Sin zona"])
  );

  // ── 1. Trabajos por técnico ────────────────────────────────
  const porTecnicoMap = new Map<string, number>();
  for (const c of casos) {
    const nombre = c.tecnico_id
      ? nombreTecnico.get(c.tecnico_id) ?? "Técnico eliminado"
      : "Sin asignar";
    porTecnicoMap.set(nombre, (porTecnicoMap.get(nombre) ?? 0) + 1);
  }
  const porTecnico = [...porTecnicoMap.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  // ── 2. Casos por categoría ─────────────────────────────────
  const porCategoriaMap = new Map<string, number>();
  for (const c of casos) {
    porCategoriaMap.set(c.categoria, (porCategoriaMap.get(c.categoria) ?? 0) + 1);
  }
  const porCategoria = [...porCategoriaMap.entries()]
    .map(([categoria, total]) => ({
      categoria,
      label: categoriaLabel(categoria),
      total,
    }))
    .sort((a, b) => b.total - a.total);

  // ── 3. Tiempo de ejecución por categoría (casos terminados) ─
  const tiempoCatMap = new Map<string, { suma: number; n: number }>();
  for (const c of casos) {
    const h = horasDeTrabajo(c);
    if (h === null) continue;
    const acc = tiempoCatMap.get(c.categoria) ?? { suma: 0, n: 0 };
    acc.suma += h;
    acc.n += 1;
    tiempoCatMap.set(c.categoria, acc);
  }
  const tiempoPorCategoria = [...tiempoCatMap.entries()]
    .map(([categoria, { suma, n }]) => ({
      categoria,
      label: categoriaLabel(categoria),
      horasPromedio: Math.round((suma / n) * 10) / 10,
      casos: n,
    }))
    .sort((a, b) => b.horasPromedio - a.horasPromedio);

  // ── 4. Incidencia por zona (+ desglose por categoría) ──────
  const porZonaMap = new Map<string, number>();
  const zonaCatMap = new Map<string, Map<string, number>>();
  for (const c of casos) {
    const zona = c.tienda_id
      ? zonaTienda.get(c.tienda_id) ?? "Sin zona"
      : "Sin zona";
    porZonaMap.set(zona, (porZonaMap.get(zona) ?? 0) + 1);
    const sub = zonaCatMap.get(zona) ?? new Map<string, number>();
    sub.set(c.categoria, (sub.get(c.categoria) ?? 0) + 1);
    zonaCatMap.set(zona, sub);
  }
  const porZona = [...porZonaMap.entries()]
    .map(([zona, total]) => ({ zona, total }))
    .sort((a, b) => b.total - a.total);
  const categoriasZona = porCategoria.map((c) => c.categoria);
  const zonaCategoria = porZona.map(({ zona }) => {
    const sub = zonaCatMap.get(zona)!;
    const fila: Record<string, string | number> = { zona };
    for (const cat of categoriasZona) fila[categoriaLabel(cat)] = sub.get(cat) ?? 0;
    return fila;
  });

  // ── 5. Horas hombre (inicio → cierre) ──────────────────────
  const duraciones: { horas: number; fin: Date }[] = [];
  for (const c of casos) {
    const h = horasDeTrabajo(c);
    if (h === null) continue;
    duraciones.push({ horas: h, fin: new Date(c.terminado_at!) });
  }
  const totalHoras = duraciones.reduce((s, d) => s + d.horas, 0);

  // Tendencia mensual (últimos 6 meses, incluido el actual)
  const meses: { clave: string; mes: string; suma: number; n: number }[] = [];
  const ahora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({
      clave: `${d.getFullYear()}-${d.getMonth()}`,
      mes: d
        .toLocaleDateString("es-PE", { month: "short", year: "2-digit" })
        .replace(".", ""),
      suma: 0,
      n: 0,
    });
  }
  const mesIdx = new Map(meses.map((m, i) => [m.clave, i]));
  for (const d of duraciones) {
    const clave = `${d.fin.getFullYear()}-${d.fin.getMonth()}`;
    const i = mesIdx.get(clave);
    if (i === undefined) continue;
    meses[i].suma += d.horas;
    meses[i].n += 1;
  }
  const porMes = meses.map((m) => ({
    mes: m.mes,
    horasPromedio: m.n > 0 ? Math.round((m.suma / m.n) * 10) / 10 : 0,
    horasTotales: Math.round(m.suma * 10) / 10,
    casos: m.n,
  }));

  // Distribución de duraciones
  const buckets = [
    { rango: "< 24 h", max: 24 },
    { rango: "1–3 días", max: 72 },
    { rango: "3–7 días", max: 168 },
    { rango: "7–14 días", max: 336 },
    { rango: "> 14 días", max: Infinity },
  ];
  const distribucion = buckets.map((b) => ({ rango: b.rango, casos: 0 }));
  for (const d of duraciones) {
    const i = buckets.findIndex((b) => d.horas < b.max);
    distribucion[i === -1 ? buckets.length - 1 : i].casos += 1;
  }

  const datos: DatosEstadisticas = {
    totalCasos: casos.length,
    casosTerminados: casos.filter((c) => c.estatus === "Terminado").length,
    porTecnico,
    porCategoria,
    tiempoPorCategoria,
    porZona,
    zonaCategoria,
    categoriasZona: categoriasZona.map(categoriaLabel),
    horasHombre: {
      totalHoras: Math.round(totalHoras),
      promedioHoras:
        duraciones.length > 0
          ? Math.round((totalHoras / duraciones.length) * 10) / 10
          : 0,
      casosMedidos: duraciones.length,
      porMes,
      distribucion,
    },
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Indicadores de las solicitudes de mantenimiento. Cada métrica se
          muestra en dos formatos (Opción A y B) para elegir el definitivo.
        </p>
      </div>

      <EstadisticasClient datos={datos} />
    </div>
  );
}
