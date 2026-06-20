import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DASHBOARD_CHART_COLORS } from './dashboardChartColors';

export function useDashboardChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return useMemo(
    () => ({
      isDark,
      colors: {
        vinieron: DASHBOARD_CHART_COLORS.senaGreen,
        esperados: isDark ? '#475569' : DASHBOARD_CHART_COLORS.senaDark,
        conSesion: DASHBOARD_CHART_COLORS.senaGreen,
        sinSesion: DASHBOARD_CHART_COLORS.senaOrange,
      },
      axis: {
        stroke: isDark ? '#64748b' : '#94a3b8',
        tick: { fill: isDark ? '#cbd5e1' : '#475569', fontSize: 11 },
      },
      grid: {
        stroke: isDark ? '#334155' : '#e2e8f0',
        strokeDasharray: '3 3',
      },
      legend: {
        color: isDark ? '#e2e8f0' : '#334155',
      },
      label: {
        fill: isDark ? '#f1f5f9' : '#1e293b',
      },
      tooltip: {
        contentStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
          borderRadius: '8px',
          color: isDark ? '#f1f5f9' : '#1e293b',
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
        },
        labelStyle: { color: isDark ? '#94a3b8' : '#64748b' },
        itemStyle: { color: isDark ? '#f1f5f9' : '#1e293b' },
      },
    }),
    [isDark],
  );
}
