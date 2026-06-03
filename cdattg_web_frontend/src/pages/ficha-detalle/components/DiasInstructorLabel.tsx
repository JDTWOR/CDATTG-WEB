import type { InstructorFichaResponse } from '../../../types';

type DiasInstructorLabelProps = Readonly<{
  inst: InstructorFichaResponse;
  puedeProgramar: boolean;
}>;

export function DiasInstructorLabel({ inst, puedeProgramar }: DiasInstructorLabelProps) {
  if (inst.dias_formacion_nombres && inst.dias_formacion_nombres.length > 0) {
    return (
      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
        Días: {inst.dias_formacion_nombres.join(', ')}
      </span>
    );
  }
  if (puedeProgramar) {
    return (
      <span className="mt-0.5 block text-xs text-amber-600 dark:text-amber-400">Sin días programados</span>
    );
  }
  return null;
}
