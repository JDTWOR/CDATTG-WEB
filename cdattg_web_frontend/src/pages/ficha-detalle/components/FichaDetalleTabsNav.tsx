import type { FichaDetalleTab } from '../types';

type FichaDetalleTabsNavProps = Readonly<{
  tab: FichaDetalleTab;
  setTab: (tab: FichaDetalleTab) => void;
  puedeProgramarInstructores: boolean;
}>;

function tabButtonClass(active: boolean): string {
  return active
    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
}

export function FichaDetalleTabsNav({ tab, setTab, puedeProgramarInstructores }: FichaDetalleTabsNavProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-600">
      <nav className="flex gap-6" aria-label="Secciones de la ficha">
        <button
          type="button"
          onClick={() => setTab('instructores')}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${tabButtonClass(tab === 'instructores')}`}
        >
          Instructores
        </button>
        {puedeProgramarInstructores && (
          <button
            type="button"
            onClick={() => setTab('programacion')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${tabButtonClass(tab === 'programacion')}`}
          >
            Programación
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('aprendices')}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${tabButtonClass(tab === 'aprendices')}`}
        >
          Aprendices
        </button>
      </nav>
    </div>
  );
}
