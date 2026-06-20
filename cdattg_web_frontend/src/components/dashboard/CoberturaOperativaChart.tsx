import { useMemo } from 'react';
import { Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import type { PieSectorShapeProps } from 'recharts';
import { useDashboardChartTheme } from './useDashboardChartTheme';

function PieSector({ payload, ...sectorProps }: PieSectorShapeProps) {
  const fill = (typeof payload?.fill === 'string' ? payload.fill : undefined) ?? sectorProps.fill;
  return <Sector {...sectorProps} fill={fill} stroke={sectorProps.stroke ?? 'transparent'} strokeWidth={1} />;
}

type PieSliceLabelProps = {
  name?: string;
  percent?: number;
  x?: number;
  y?: number;
};

function PieSliceLabel({ name, percent, x, y, labelFill }: PieSliceLabelProps & { labelFill: string }) {
  if (percent == null || percent <= 0.04 || x == null || y == null) return null;
  return (
    <text x={x} y={y} fill={labelFill} textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${name ?? ''} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function makePieSliceLabel(labelFill: string) {
  return (props: PieSliceLabelProps) => <PieSliceLabel {...props} labelFill={labelFill} />;
}

type CoberturaOperativaChartProps = Readonly<{
  fichasConSesion: number;
  fichasSinSesion: number;
}>;

export function CoberturaOperativaChart({ fichasConSesion, fichasSinSesion }: CoberturaOperativaChartProps) {
  const theme = useDashboardChartTheme();
  const total = fichasConSesion + fichasSinSesion;
  const labelRenderer = useMemo(() => makePieSliceLabel(theme.label.fill), [theme.label.fill]);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin fichas con formación en el filtro.</p>
    );
  }

  const data = [
    { name: 'Con sesión', value: fichasConSesion, fill: theme.colors.conSesion },
    { name: 'Sin sesión', value: fichasSinSesion, fill: theme.colors.sinSesion },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={2}
          label={labelRenderer}
          labelLine={{ stroke: theme.axis.stroke }}
          shape={PieSector}
        />
        <Tooltip
          contentStyle={theme.tooltip.contentStyle}
          labelStyle={theme.tooltip.labelStyle}
          itemStyle={theme.tooltip.itemStyle}
        />
        <Legend wrapperStyle={{ color: theme.legend.color }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
