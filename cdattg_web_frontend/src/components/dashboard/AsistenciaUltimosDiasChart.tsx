import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboardChartTheme } from './useDashboardChartTheme';

export type DiaFormacionRow = {
  fecha: string;
  etiqueta: string;
  esperados: number;
  vinieron: number;
  pct: number;
};

type AsistenciaUltimosDiasChartProps = Readonly<{
  data: DiaFormacionRow[];
}>;

export function AsistenciaUltimosDiasChart({ data }: AsistenciaUltimosDiasChartProps) {
  const theme = useDashboardChartTheme();

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Sin días de formación recientes en el alcance seleccionado.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    dia: d.etiqueta,
    Vinieron: d.vinieron,
    Esperados: d.esperados,
    ratio: `${d.vinieron}/${d.esperados}`,
    pct: d.pct,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} barGap={4} barCategoryGap="18%">
        <CartesianGrid stroke={theme.grid.stroke} strokeDasharray={theme.grid.strokeDasharray} vertical={false} />
        <XAxis dataKey="dia" tick={theme.axis.tick} axisLine={{ stroke: theme.axis.stroke }} tickLine={{ stroke: theme.axis.stroke }} />
        <YAxis
          allowDecimals={false}
          tick={theme.axis.tick}
          axisLine={{ stroke: theme.axis.stroke }}
          tickLine={{ stroke: theme.axis.stroke }}
        />
        <Tooltip
          contentStyle={theme.tooltip.contentStyle}
          labelStyle={theme.tooltip.labelStyle}
          itemStyle={theme.tooltip.itemStyle}
          formatter={(value, name, item) => {
            const num = typeof value === 'number' ? value : Number(value ?? 0);
            const payload = item?.payload as { ratio?: string; pct?: number } | undefined;
            if (name === 'Vinieron' || name === 'Asistieron') {
              return [`${num} aprendices (${payload?.ratio ?? ''}, ${payload?.pct ?? 0}%)`, 'Asistieron'];
            }
            if (name === 'Esperados') {
              return [`${num} aprendices`, 'Esperados'];
            }
            return [num, String(name)];
          }}
        />
        <Legend wrapperStyle={{ color: theme.legend.color, paddingTop: 8 }} />
        <Bar dataKey="Esperados" name="Esperados" fill={theme.colors.esperados} radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar dataKey="Vinieron" name="Asistieron" fill={theme.colors.vinieron} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
