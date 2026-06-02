import type { AccionRegistroDocumento } from './asistenciaUtils';

type Props = Readonly<{
  modo: AccionRegistroDocumento;
  onChange: (modo: AccionRegistroDocumento) => void;
}>;

function modoBtnClass(activo: boolean, tipo: 'ingreso' | 'salida'): string {
  const base = 'min-h-[40px] flex-1 rounded-lg px-3 py-2 text-sm font-semibold touch-manipulation sm:flex-none sm:px-4';
  if (!activo) {
    return `${base} border border-gray-300 bg-white text-gray-700 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100`;
  }
  return tipo === 'ingreso' ? `${base} bg-green-600 text-white` : `${base} bg-red-600 text-white`;
}

export function ModoEntradaSalidaToggle({ modo, onChange }: Props) {
  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Acción a registrar
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange('ingreso')} className={modoBtnClass(modo === 'ingreso', 'ingreso')}>
          Entrada
        </button>
        <button type="button" onClick={() => onChange('salida')} className={modoBtnClass(modo === 'salida', 'salida')}>
          Salida
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Mínimo 1 minuto entre entrada y salida del mismo aprendiz.</p>
    </div>
  );
}
