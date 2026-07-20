"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import {
  Users,
  Tag,
  Timer,
  MapPin,
  Clock,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

// ─── Tipos de datos que llegan del servidor ───────────────────
export interface DatosEstadisticas {
  totalCasos: number;
  casosTerminados: number;
  porTecnico: { nombre: string; total: number }[];
  porCategoria: { categoria: string; label: string; total: number }[];
  tiempoPorCategoria: {
    categoria: string;
    label: string;
    horasPromedio: number;
    casos: number;
  }[];
  porZona: { zona: string; total: number }[];
  zonaCategoria: Record<string, string | number>[];
  categoriasZona: string[];
  horasHombre: {
    totalHoras: number;
    promedioHoras: number;
    casosMedidos: number;
    porMes: {
      mes: string;
      horasPromedio: number;
      horasTotales: number;
      casos: number;
    }[];
    distribucion: { rango: string; casos: number }[];
  };
}

// ─── Paleta y helpers ─────────────────────────────────────────
const COLORES = [
  "#2563eb", // blue-600
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
];

function fmtHoras(h: number): string {
  if (h < 48) return `${Math.round(h * 10) / 10} h`;
  return `${Math.round((h / 24) * 10) / 10} días`;
}

// ─── Tarjeta contenedora de cada gráfico ──────────────────────
function ChartCard({
  opcion,
  titulo,
  descripcion,
  children,
}: {
  opcion: "A" | "B";
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{titulo}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{descripcion}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border ${
            opcion === "A"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-violet-50 text-violet-700 border-violet-200"
          }`}
        >
          Opción {opcion}
        </span>
      </div>
      {children}
    </div>
  );
}

function SinDatos({ mensaje }: { mensaje: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center">
      <p className="text-xs text-slate-400 text-center max-w-[240px]">
        {mensaje}
      </p>
    </div>
  );
}

function SeccionTitulo({
  icon: Icon,
  numero,
  titulo,
  subtitulo,
}: {
  icon: React.ComponentType<{ className?: string }>;
  numero: number;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-blue-600" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">
          {numero}. {titulo}
        </h2>
        <p className="text-xs text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}

// ─── Treemap: celda personalizada ─────────────────────────────
interface TreemapCellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
}

function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, name, value } = props;
  const mostrarTexto = width > 70 && height > 36;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={COLORES[index % COLORES.length]}
        fillOpacity={0.85}
        stroke="#fff"
        strokeWidth={2}
      />
      {mostrarTexto && (
        <>
          <text
            x={x + 8}
            y={y + 18}
            fill="#fff"
            fontSize={11}
            fontWeight={700}
          >
            {name}
          </text>
          <text x={x + 8} y={y + 33} fill="#fff" fontSize={11} opacity={0.9}>
            {value} casos
          </text>
        </>
      )}
    </g>
  );
}

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

// ─── Componente principal ─────────────────────────────────────
export function EstadisticasClient({ datos }: { datos: DatosEstadisticas }) {
  const {
    porTecnico,
    porCategoria,
    tiempoPorCategoria,
    porZona,
    zonaCategoria,
    categoriasZona,
    horasHombre,
  } = datos;

  const hayCasos = datos.totalCasos > 0;
  const hayTiempos = horasHombre.casosMedidos > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* ── KPIs generales ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            icon: ClipboardList,
            label: "Casos totales",
            valor: String(datos.totalCasos),
            color: "text-blue-600 bg-blue-50 border-blue-200",
          },
          {
            icon: CheckCircle2,
            label: "Terminados",
            valor: String(datos.casosTerminados),
            color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          },
          {
            icon: Clock,
            label: "Horas hombre acumuladas",
            valor: hayTiempos ? `${horasHombre.totalHoras} h` : "—",
            color: "text-violet-600 bg-violet-50 border-violet-200",
          },
          {
            icon: Timer,
            label: "Promedio por caso",
            valor: hayTiempos ? fmtHoras(horasHombre.promedioHoras) : "—",
            color: "text-amber-600 bg-amber-50 border-amber-200",
          },
          {
            icon: CheckCircle2,
            label: "Casos con tiempo medido",
            valor: String(horasHombre.casosMedidos),
            color: "text-slate-600 bg-slate-100 border-slate-200",
          },
        ].map(({ icon: Icon, label, valor, color }) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-2 ${color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 leading-none">
              {valor}
            </p>
            <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wide font-semibold">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── 1. Trabajos por técnico ────────────────────────── */}
      <SeccionTitulo
        icon={Users}
        numero={1}
        titulo="Trabajos por técnico"
        subtitulo="Cantidad de casos asignados a cada técnico."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          opcion="A"
          titulo="Barras horizontales"
          descripcion="Ideal para comparar y rankear: se lee de mayor a menor y los nombres largos no se cortan."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, porTecnico.length * 42)}>
              <BarChart
                data={porTecnico}
                layout="vertical"
                margin={{ left: 8, right: 28, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} casos`, "Total"]} />
                <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={22}>
                  <LabelList dataKey="total" position="right" style={{ fontSize: 11, fill: "#475569" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          opcion="B"
          titulo="Dona de participación"
          descripcion="Muestra qué porcentaje de la carga de trabajo lleva cada técnico."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={porTecnico}
                  dataKey="total"
                  nameKey="nombre"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ percent }) =>
                    `${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {porTecnico.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} casos`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── 2. Categoría más trabajada ─────────────────────── */}
      <SeccionTitulo
        icon={Tag}
        numero={2}
        titulo="Categorías más trabajadas"
        subtitulo="Distribución de los casos según el tipo de trabajo."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          opcion="A"
          titulo="Barras verticales ordenadas"
          descripcion="Ranking clásico: la categoría dominante salta a la vista de inmediato."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={porCategoria}
                margin={{ left: 0, right: 8, top: 8, bottom: 38 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} casos`, "Total"]} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={34}>
                  {porCategoria.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          opcion="B"
          titulo="Treemap proporcional"
          descripcion="El área de cada bloque equivale a su volumen de casos: se ve al instante qué domina."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={porCategoria.map((c) => ({ name: c.label, size: c.total }))}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<TreemapCell />}
              >
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} casos`, ""]}
                />
              </Treemap>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── 3. Tiempo de ejecución por categoría ───────────── */}
      <SeccionTitulo
        icon={Timer}
        numero={3}
        titulo="Tiempo de ejecución por categoría"
        subtitulo="Horas promedio desde que el caso inicia su atención hasta su cierre (solo casos terminados)."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          opcion="A"
          titulo="Barras horizontales (horas promedio)"
          descripcion="Las duraciones se comparan mejor en barras: más larga la barra, más tarda la categoría."
        >
          {tiempoPorCategoria.length === 0 ? (
            <SinDatos mensaje="Aún no hay casos terminados con tiempo medido. Se llenará a medida que se cierren casos." />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, tiempoPorCategoria.length * 46)}
            >
              <BarChart
                data={tiempoPorCategoria}
                layout="vertical"
                margin={{ left: 8, right: 44, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit=" h" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={150}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, _n, item) => [
                    `${fmtHoras(Number(v))} (${item?.payload?.casos ?? 0} casos)`,
                    "Promedio",
                  ]}
                />
                <Bar dataKey="horasPromedio" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={22}>
                  <LabelList
                    dataKey="horasPromedio"
                    position="right"
                    formatter={(v: React.ReactNode) => fmtHoras(Number(v))}
                    style={{ fontSize: 10, fill: "#475569" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          opcion="B"
          titulo="Radar de perfiles"
          descripcion="Vista de 'huella': compara de un vistazo el perfil de demora entre todas las categorías."
        >
          {tiempoPorCategoria.length < 3 ? (
            <SinDatos mensaje="El radar necesita al menos 3 categorías con casos terminados. Se llenará a medida que se cierren casos." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={tiempoPorCategoria} outerRadius="70%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} unit=" h" />
                <Radar
                  name="Horas promedio"
                  dataKey="horasPromedio"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.35}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [fmtHoras(Number(v)), "Promedio"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── 4. Zona con mayor incidencia ───────────────────── */}
      <SeccionTitulo
        icon={MapPin}
        numero={4}
        titulo="Incidencia por zona"
        subtitulo="Qué zona de operaciones reporta más solicitudes."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          opcion="A"
          titulo="Dona por zona"
          descripcion="Con pocas zonas, la dona muestra la proporción del total que aporta cada una."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={porZona}
                  dataKey="total"
                  nameKey="zona"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name}: ${Math.round((percent ?? 0) * 100)}%`
                  }
                >
                  {porZona.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} casos`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          opcion="B"
          titulo="Barras apiladas (zona × categoría)"
          descripcion="Además de qué zona reporta más, muestra de qué tipo de trabajo se compone."
        >
          {!hayCasos ? (
            <SinDatos mensaje="Aún no hay casos registrados." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zonaCategoria} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="zona" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {categoriasZona.map((cat, i) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="zona"
                    fill={COLORES[i % COLORES.length]}
                    radius={i === categoriasZona.length - 1 ? [6, 6, 0, 0] : undefined}
                    barSize={56}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── 5. Horas hombre ────────────────────────────────── */}
      <SeccionTitulo
        icon={Clock}
        numero={5}
        titulo="Horas hombre (inicio → cierre)"
        subtitulo="Tiempo de trabajo por caso: desde que entra a atención hasta que se cierra."
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          opcion="A"
          titulo="Tendencia mensual"
          descripcion="Evolución del tiempo promedio por caso cerrado en los últimos 6 meses: muestra si el equipo mejora."
        >
          {!hayTiempos ? (
            <SinDatos mensaje="Aún no hay casos terminados con tiempo medido." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={horasHombre.porMes} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="gradHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" h" width={44} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name, item) => {
                    if (name === "Horas promedio")
                      return [
                        `${fmtHoras(Number(v))} (${item?.payload?.casos ?? 0} casos cerrados)`,
                        name,
                      ];
                    return [String(v), String(name)];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="horasPromedio"
                  name="Horas promedio"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#gradHoras)"
                  dot={{ r: 3, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          opcion="B"
          titulo="Distribución de duraciones"
          descripcion="Histograma: cuántos casos se resuelven en menos de 24 h, en 1–3 días, etc."
        >
          {!hayTiempos ? (
            <SinDatos mensaje="Aún no hay casos terminados con tiempo medido." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={horasHombre.distribucion}
                margin={{ left: 0, right: 8, top: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="rango" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} casos`, "Cantidad"]} />
                <Bar dataKey="casos" fill="#10b981" radius={[6, 6, 0, 0]} barSize={48}>
                  <LabelList dataKey="casos" position="top" style={{ fontSize: 11, fill: "#475569" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Nota metodológica */}
      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-200 pt-4">
        Nota: los tiempos se miden desde que el caso entra a «En proceso»
        (o desde su creación si no se registró esa etapa) hasta que se marca
        «Terminado». Los casos cerrados antes de habilitar esta medición no
        cuentan con tiempo registrado y se excluyen de los promedios; los
        conteos por técnico, categoría y zona sí incluyen todos los casos.
      </p>
    </div>
  );
}
