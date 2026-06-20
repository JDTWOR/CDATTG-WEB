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

type SedeRow = {
  nombre: string;
  regional_nombre?: string;
  vinieron: number;
  total: number;
  pct: number;
};

type AsistenciaPorSedeChartProps = Readonly<{
  data: SedeRow[];
}>;

export function AsistenciaPorSedeChart({ data }: AsistenciaPorSedeChartProps) {
  const theme = useDashboardChartTheme();

  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin datos para el filtro seleccionado.</p>
    );
  }

  const chartData = data.map((d) => ({
    sede: d.nombre.length > 18 ? `${d.nombre.slice(0, 16)}…` : d.nombre,
    Vinieron: d.vinieron,
    Total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid stroke={theme.grid.stroke} strokeDasharray={theme.grid.strokeDasharray} vertical={false} />
        <XAxis
          dataKey="sede"
          tick={theme.axis.tick}
          axisLine={{ stroke: theme.axis.stroke }}
          tickLine={{ stroke: theme.axis.stroke }}
          angle={-25}
          textAnchor="end"
          height={60}
        />
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
        />
        <Legend wrapperStyle={{ color: theme.legend.color }} />
        <Bar dataKey="Vinieron" name="Asistieron" fill={theme.colors.vinieron} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Total" name="Esperados" fill={theme.colors.esperados} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
