import type { DiaFormacionItem, FichaCaracterizacionResponse } from '../../types';
import { buildHorarioResumenFicha } from '../../utils/fichaListDisplay';

type Props = Readonly<{
  ficha: FichaCaracterizacionResponse;
  diasCatalog: DiaFormacionItem[];
  compact?: boolean;
}>;

export function FichaHorarioResumen({ ficha, diasCatalog, compact = false }: Props) {
  const { jornada, resumen, detalle } = buildHorarioResumenFicha(ficha, diasCatalog);

  let tooltipTitle: string | undefined;
  if (detalle === resumen) {
    tooltipTitle = undefined;
  } else {
    tooltipTitle = detalle;
  }

  return (
    <div className="min-w-0" title={tooltipTitle}>
      {jornada ? (
        <span className="mb-0.5 inline-block rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {jornada}
        </span>
      ) : null}
      <p
        className={`text-gray-600 dark:text-gray-300 ${compact ? 'text-xs leading-snug' : 'text-sm leading-snug'}`}
      >
        {resumen}
      </p>
    </div>
  );
}
