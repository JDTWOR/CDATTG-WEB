import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  EyeIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { fichasPaths } from '../../routes/paths';
import { LABEL_INSTRUCTOR_LIDER } from '../../constants/instructorLiderLabels';
import type { DiaFormacionItem, FichaCaracterizacionResponse } from '../../types';
import { formatUbicacionFicha, toDisplayTitle } from '../../utils/fichaListDisplay';
import { FichaHorarioResumen } from './FichaHorarioResumen';

type Props = Readonly<{
  list: FichaCaracterizacionResponse[];
  diasFormacion: DiaFormacionItem[];
  puedeProgramarInstructores: boolean;
  onEdit: (item: FichaCaracterizacionResponse) => void;
  onDelete: (id: number) => void;
  onAsignar: (payload: { ficha: FichaCaracterizacionResponse; tipo: 'instructores' | 'aprendices' }) => void;
}>;

function EstadoBadge({ activa }: Readonly<{ activa: boolean }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        activa
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  );
}

function AccionesFicha({
  item,
  puedeProgramarInstructores,
  onEdit,
  onDelete,
  onAsignar,
  layout,
}: Readonly<{
  item: FichaCaracterizacionResponse;
  puedeProgramarInstructores: boolean;
  onEdit: (item: FichaCaracterizacionResponse) => void;
  onDelete: (id: number) => void;
  onAsignar: Props['onAsignar'];
  layout: 'row' | 'card';
}>) {
  const btn =
    layout === 'row'
      ? 'rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400'
      : 'inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:border-gray-600 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-300';

  return (
    <div className={`flex ${layout === 'card' ? 'flex-wrap gap-2' : 'items-center justify-end gap-0.5'}`}>
      <Link to={fichasPaths.detalle(item.id)} className={btn} title="Ver ficha">
        <EyeIcon className="h-5 w-5" />
      </Link>
      {puedeProgramarInstructores ? (
        <Link
          to={`${fichasPaths.detalle(item.id)}?tab=programacion`}
          className={btn}
          title="Programar instructores"
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </Link>
      ) : null}
      <button type="button" onClick={() => onAsignar({ ficha: item, tipo: 'instructores' })} className={btn} title="Asignar instructores">
        <AcademicCapIcon className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => onAsignar({ ficha: item, tipo: 'aprendices' })} className={btn} title="Asignar aprendices">
        <UsersIcon className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => onEdit(item)} className={btn} title="Editar">
        <PencilSquareIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className={
          layout === 'row'
            ? 'rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
            : 'inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-gray-600 dark:hover:bg-red-900/20'
        }
        title="Eliminar"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function FichaAdminCard({
  item,
  diasFormacion,
  puedeProgramarInstructores,
  onEdit,
  onDelete,
  onAsignar,
}: Readonly<{
  item: FichaCaracterizacionResponse;
  diasFormacion: DiaFormacionItem[];
  puedeProgramarInstructores: boolean;
  onEdit: (item: FichaCaracterizacionResponse) => void;
  onDelete: (id: number) => void;
  onAsignar: Props['onAsignar'];
}>) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold text-primary-700 dark:text-primary-400">{item.ficha}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {toDisplayTitle(item.programa_formacion_nombre)}
          </h3>
        </div>
        <EstadoBadge activa={item.status} />
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{LABEL_INSTRUCTOR_LIDER}</dt>
          <dd className="mt-0.5 text-gray-700 dark:text-gray-200">{toDisplayTitle(item.instructor_nombre)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Horario</dt>
          <dd className="mt-0.5">
            <FichaHorarioResumen ficha={item} diasCatalog={diasFormacion} compact />
          </dd>
        </div>
        <div className="flex items-start gap-1.5 text-gray-600 dark:text-gray-300">
          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <span>{formatUbicacionFicha(item)}</span>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <UsersIcon className="h-4 w-4" />
          {item.cantidad_aprendices} aprendices
        </span>
        <AccionesFicha
          item={item}
          puedeProgramarInstructores={puedeProgramarInstructores}
          onEdit={onEdit}
          onDelete={onDelete}
          onAsignar={onAsignar}
          layout="card"
        />
      </div>
    </article>
  );
}

export function FichasAdminTable({
  list,
  diasFormacion,
  puedeProgramarInstructores,
  onEdit,
  onDelete,
  onAsignar,
}: Props) {
  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center dark:border-gray-600 dark:bg-gray-900/40">
        <p className="text-base font-medium text-gray-700 dark:text-gray-200">No hay fichas registradas</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cree una ficha o ajuste los filtros de búsqueda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:hidden">
        {list.map((item) => (
          <FichaAdminCard
            key={item.id}
            item={item}
            diasFormacion={diasFormacion}
            puedeProgramarInstructores={puedeProgramarInstructores}
            onEdit={onEdit}
            onDelete={onDelete}
            onAsignar={onAsignar}
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600 lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                <th className="whitespace-nowrap px-4 py-3">Ficha</th>
                <th className="min-w-[220px] px-4 py-3">Programa</th>
                <th className="min-w-[160px] px-4 py-3">Horario</th>
                <th className="min-w-[180px] px-4 py-3">Ubicación</th>
                <th className="whitespace-nowrap px-4 py-3 text-center">Aprendices</th>
                <th className="whitespace-nowrap px-4 py-3">Estado</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {list.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30">
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <span className="font-mono text-sm font-bold text-primary-700 dark:text-primary-400">{item.ficha}</span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
                      {toDisplayTitle(item.programa_formacion_nombre)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                      {toDisplayTitle(item.instructor_nombre)}
                    </p>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 align-top">
                    <FichaHorarioResumen ficha={item} diasCatalog={diasFormacion} compact />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{formatUbicacionFicha(item)}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center align-top">
                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {item.cantidad_aprendices}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <EstadoBadge activa={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 align-top">
                    <AccionesFicha
                      item={item}
                      puedeProgramarInstructores={puedeProgramarInstructores}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAsignar={onAsignar}
                      layout="row"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
