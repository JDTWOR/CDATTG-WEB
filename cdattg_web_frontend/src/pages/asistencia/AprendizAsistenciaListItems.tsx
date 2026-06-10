import { memo, type ReactNode } from 'react';
import {
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type { AprendizResponse, AsistenciaAprendizResponse, TipoObservacionAsistenciaItem } from '../../types';
import {
  buildRangoText,
  estadoAprendizVisual,
  formatTramoRegistro,
  sameRegistrosList,
  summaryRegistros,
} from './asistenciaUtils';

export type ModoListaAprendiz = 'individual' | 'grupal';

type AprendizAsistenciaHandlers = Readonly<{
  modoLista: ModoListaAprendiz;
  aprendiz: AprendizResponse;
  registros: AsistenciaAprendizResponse[];
  index: number;
  asistenciaId: number | null;
  selected: boolean;
  busy: boolean;
  onToggleSelect: (aprendizId: number) => void;
  onRegistrarIngreso: (aprendizId: number) => void;
  onRegistrarSalida: (asistenciaAprendizId: number) => void;
  onAbrirEstado: (payload: { asistenciaAprendizId: number; nombre: string; estado: string; motivo: string }) => void;
  onAbrirObservaciones: (payload: {
    asistenciaId: number;
    aprendizId: number;
    nombre: string;
    observaciones: string;
    tiposObservacion?: TipoObservacionAsistenciaItem[];
  }) => void;
  puedeEliminarRegistro?: boolean;
  eliminandoRegistroIds?: Set<number>;
  onEliminarRegistro?: (asistenciaAprendizId: number, aprendizNombre: string, tramoLabel: string) => void;
}>;

function BotonesEliminarRegistroAdmin({
  registros,
  aprendizNombre,
  puedeEliminarRegistro,
  eliminandoRegistroIds,
  onEliminarRegistro,
  className,
}: Readonly<{
  registros: AsistenciaAprendizResponse[];
  aprendizNombre: string;
  puedeEliminarRegistro?: boolean;
  eliminandoRegistroIds?: Set<number>;
  onEliminarRegistro?: (asistenciaAprendizId: number, aprendizNombre: string, tramoLabel: string) => void;
  className: string;
}>) {
  if (!puedeEliminarRegistro || !onEliminarRegistro) return null;
  const tramos = registros.filter((r) => r.hora_ingreso);
  if (tramos.length === 0) return null;

  return (
    <>
      {tramos.map((registro) => {
        const tramoLabel = formatTramoRegistro(registro);
        const eliminando = eliminandoRegistroIds?.has(registro.id) ?? false;
        return (
          <button
            key={registro.id}
            type="button"
            disabled={eliminando}
            onClick={() => onEliminarRegistro(registro.id, aprendizNombre, tramoLabel)}
            className={className}
            title={`Eliminar registro ${tramoLabel} (admin)`}
            aria-label={`Eliminar registro ${tramoLabel}`}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        );
      })}
    </>
  );
}

function BotonResolverEstado({
  requiereRevisionRecord,
  aprendiz,
  onAbrirEstado,
  className,
}: Readonly<{
  requiereRevisionRecord: AsistenciaAprendizResponse;
  aprendiz: AprendizResponse;
  onAbrirEstado: AprendizAsistenciaHandlers['onAbrirEstado'];
  className: string;
}>) {
  return (
    <button
      type="button"
      onClick={() =>
        onAbrirEstado({
          asistenciaAprendizId: requiereRevisionRecord.id,
          nombre: aprendiz.persona_nombre ?? 'Aprendiz',
          estado: requiereRevisionRecord.estado || 'ASISTENCIA_COMPLETA',
          motivo: requiereRevisionRecord.motivo_ajuste || '',
        })
      }
      className={className}
    >
      Resolver estado
    </button>
  );
}

function AccionesTarjetaIndividual({
  aprendiz,
  asistenciaId,
  open,
  puedeEntrada,
  puedeSalida,
  observaciones,
  tiposObservacion,
  requiereRevisionRecord,
  onRegistrarIngreso,
  onRegistrarSalida,
  onAbrirEstado,
  onAbrirObservaciones,
  registros,
  puedeEliminarRegistro,
  eliminandoRegistroIds,
  onEliminarRegistro,
}: Readonly<{
  aprendiz: AprendizResponse;
  asistenciaId: number | null;
  open: AsistenciaAprendizResponse | null;
  puedeEntrada: boolean;
  puedeSalida: boolean;
  observaciones: string;
  tiposObservacion: TipoObservacionAsistenciaItem[];
  requiereRevisionRecord: AsistenciaAprendizResponse | null;
  onRegistrarIngreso: (aprendizId: number) => void;
  onRegistrarSalida: (asistenciaAprendizId: number) => void;
  onAbrirEstado: AprendizAsistenciaHandlers['onAbrirEstado'];
  onAbrirObservaciones: AprendizAsistenciaHandlers['onAbrirObservaciones'];
  registros: AsistenciaAprendizResponse[];
  puedeEliminarRegistro?: boolean;
  eliminandoRegistroIds?: Set<number>;
  onEliminarRegistro?: AprendizAsistenciaHandlers['onEliminarRegistro'];
}>) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
      <button
        type="button"
        disabled={!puedeEntrada}
        onClick={() => onRegistrarIngreso(aprendiz.id)}
        className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
      >
        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
        Entrada
      </button>
      <button
        type="button"
        disabled={!puedeSalida}
        onClick={() => open && onRegistrarSalida(open.id)}
        className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
      >
        <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
        Salida
      </button>
      {requiereRevisionRecord ? (
        <BotonResolverEstado
          requiereRevisionRecord={requiereRevisionRecord}
          aprendiz={aprendiz}
          onAbrirEstado={onAbrirEstado}
          className="min-h-[44px] w-full rounded-lg border border-amber-400 bg-amber-50 text-sm font-medium text-amber-800 touch-manipulation dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
        />
      ) : null}
      {asistenciaId !== null && (
        <button
          type="button"
          onClick={() =>
            onAbrirObservaciones({
              asistenciaId,
              aprendizId: aprendiz.id,
              nombre: aprendiz.persona_nombre ?? 'Aprendiz',
              observaciones,
              tiposObservacion,
            })
          }
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 touch-manipulation"
          aria-label="Observaciones"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
      )}
      <BotonesEliminarRegistroAdmin
        registros={registros}
        aprendizNombre={aprendiz.persona_nombre ?? 'Aprendiz'}
        puedeEliminarRegistro={puedeEliminarRegistro}
        eliminandoRegistroIds={eliminandoRegistroIds}
        onEliminarRegistro={onEliminarRegistro}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 touch-manipulation"
      />
    </div>
  );
}

function PieTarjetaAprendiz({
  esGrupal,
  requiereRevisionRecord,
  aprendiz,
  onAbrirEstado,
  accionesIndividual,
}: Readonly<{
  esGrupal: boolean;
  requiereRevisionRecord: AsistenciaAprendizResponse | null;
  aprendiz: AprendizResponse;
  onAbrirEstado: AprendizAsistenciaHandlers['onAbrirEstado'];
  accionesIndividual: ReactNode;
}>) {
  if (esGrupal) {
    if (requiereRevisionRecord == null) return null;
    return (
      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
        <BotonResolverEstado
          requiereRevisionRecord={requiereRevisionRecord}
          aprendiz={aprendiz}
          onAbrirEstado={onAbrirEstado}
          className="min-h-[40px] w-full rounded-lg border border-amber-400 bg-amber-50 text-sm font-medium text-amber-800 touch-manipulation dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200"
        />
      </div>
    );
  }
  return accionesIndividual;
}

export function TarjetaAprendizAsistencia({
  modoLista,
  aprendiz,
  registros,
  index,
  asistenciaId,
  selected,
  busy,
  onToggleSelect,
  onRegistrarIngreso,
  onRegistrarSalida,
  onAbrirEstado,
  onAbrirObservaciones,
  puedeEliminarRegistro,
  eliminandoRegistroIds,
  onEliminarRegistro,
}: AprendizAsistenciaHandlers) {
  const esGrupal = modoLista === 'grupal';
  const { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord } = summaryRegistros(registros);
  const rango = buildRangoText(firstIngreso, lastSalida, open);
  const estado = estadoAprendizVisual(open, lastSalida);
  const puedeEntrada = !open && !busy;
  const puedeSalida = !!open && !busy;

  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-sm dark:bg-gray-800 ${
        selected ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex gap-3">
        {esGrupal ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(aprendiz.id)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500 touch-manipulation"
            aria-label={`Seleccionar ${aprendiz.persona_nombre ?? 'aprendiz'}`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-gray-900 dark:text-white">{aprendiz.persona_nombre ?? '–'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Doc. {aprendiz.persona_documento ?? '–'} · #{index}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${estado.className}`}>{estado.label}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rango}</p>
          {(tiposObservacion.length > 0 || observaciones) && (
            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {tiposObservacion.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tiposObservacion.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {t.nombre}
                    </span>
                  ))}
                </div>
              )}
              {observaciones ? (
                <p className="line-clamp-2 text-xs" title={observaciones}>
                  {observaciones}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <PieTarjetaAprendiz
        esGrupal={esGrupal}
        requiereRevisionRecord={requiereRevisionRecord}
        aprendiz={aprendiz}
        onAbrirEstado={onAbrirEstado}
        accionesIndividual={
          <AccionesTarjetaIndividual
            aprendiz={aprendiz}
            asistenciaId={asistenciaId}
            open={open}
            puedeEntrada={puedeEntrada}
            puedeSalida={puedeSalida}
            observaciones={observaciones}
            tiposObservacion={tiposObservacion}
            requiereRevisionRecord={requiereRevisionRecord}
            onRegistrarIngreso={onRegistrarIngreso}
            onRegistrarSalida={onRegistrarSalida}
            onAbrirEstado={onAbrirEstado}
            onAbrirObservaciones={onAbrirObservaciones}
            registros={registros}
            puedeEliminarRegistro={puedeEliminarRegistro}
            eliminandoRegistroIds={eliminandoRegistroIds}
            onEliminarRegistro={onEliminarRegistro}
          />
        }
      />
    </div>
  );
}

export const FilaAprendizAsistencia = memo(function FilaAprendizAsistencia(props: AprendizAsistenciaHandlers) {
  const {
    modoLista,
    aprendiz,
    registros,
    index,
    asistenciaId,
    selected,
    busy,
    onToggleSelect,
    onRegistrarIngreso,
    onRegistrarSalida,
    onAbrirEstado,
    onAbrirObservaciones,
    puedeEliminarRegistro,
    eliminandoRegistroIds,
    onEliminarRegistro,
  } = props;
  const esGrupal = modoLista === 'grupal';
  const { open, firstIngreso, lastSalida, observaciones, tiposObservacion, requiereRevisionRecord } = summaryRegistros(registros);
  const textoCeldaSalida = lastSalida ?? (open ? '—' : '–');
  const textoObsCelda = observaciones || (tiposObservacion.length === 0 ? '–' : null);
  const puedeEntrada = !open && !busy;
  const puedeSalida = !!open && !busy;

  return (
    <tr className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${esGrupal && selected ? 'ring-1 ring-inset ring-primary-400' : ''}`}>
      {esGrupal ? (
        <td className="border border-gray-200 dark:border-gray-600 px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(aprendiz.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600"
            aria-label={`Seleccionar ${aprendiz.persona_nombre ?? 'aprendiz'}`}
          />
        </td>
      ) : null}
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-400">{index}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{aprendiz.persona_documento ?? '-'}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-medium">{aprendiz.persona_nombre ?? '-'}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{firstIngreso ?? '–'}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{textoCeldaSalida}</td>
      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-500 dark:text-gray-400">
        {tiposObservacion.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {tiposObservacion.map((t) => (
              <span key={t.id} className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                {t.nombre}
              </span>
            ))}
          </div>
        )}
        {textoObsCelda}
      </td>
      {esGrupal ? null : (
        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!puedeEntrada}
              onClick={() => onRegistrarIngreso(aprendiz.id)}
              className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-40 dark:text-green-400 dark:hover:bg-green-900/30"
              title="Registrar entrada"
              aria-label="Registrar entrada"
            >
              <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              disabled={!puedeSalida}
              onClick={() => open && onRegistrarSalida(open.id)}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/30"
              title="Registrar salida"
              aria-label="Registrar salida"
            >
              <ArrowLeftEndOnRectangleIcon className="h-6 w-6" />
            </button>
            {requiereRevisionRecord ? (
              <BotonResolverEstado
                requiereRevisionRecord={requiereRevisionRecord}
                aprendiz={aprendiz}
                onAbrirEstado={onAbrirEstado}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
              />
            ) : null}
            {asistenciaId !== null && (
            <button
              type="button"
              onClick={() =>
                onAbrirObservaciones({
                  asistenciaId,
                  aprendizId: aprendiz.id,
                  nombre: aprendiz.persona_nombre ?? 'Aprendiz',
                  observaciones,
                  tiposObservacion,
                })
              }
              className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
              title="Observaciones"
              aria-label="Registrar observaciones"
            >
              <PencilSquareIcon className="h-7 w-7" />
            </button>
            )}
            <BotonesEliminarRegistroAdmin
              registros={registros}
              aprendizNombre={aprendiz.persona_nombre ?? 'Aprendiz'}
              puedeEliminarRegistro={puedeEliminarRegistro}
              eliminandoRegistroIds={eliminandoRegistroIds}
              onEliminarRegistro={onEliminarRegistro}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
            />
          </div>
        </td>
      )}
    </tr>
  );
}, (prev, next) => {
  return (
    prev.aprendiz.id === next.aprendiz.id &&
    prev.index === next.index &&
    prev.asistenciaId === next.asistenciaId &&
    sameRegistrosList(prev.registros, next.registros) &&
    prev.modoLista === next.modoLista &&
    prev.selected === next.selected &&
    prev.busy === next.busy &&
    prev.puedeEliminarRegistro === next.puedeEliminarRegistro &&
    prev.eliminandoRegistroIds === next.eliminandoRegistroIds &&
    prev.onToggleSelect === next.onToggleSelect &&
    prev.onRegistrarIngreso === next.onRegistrarIngreso &&
    prev.onRegistrarSalida === next.onRegistrarSalida &&
    prev.onAbrirEstado === next.onAbrirEstado &&
    prev.onAbrirObservaciones === next.onAbrirObservaciones &&
    prev.onEliminarRegistro === next.onEliminarRegistro
  );
});
