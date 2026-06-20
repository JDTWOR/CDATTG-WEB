import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ArrowPathIcon,
  ClockIcon,
  MoonIcon,
  PencilSquareIcon,
  PlusIcon,
  SunIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DAY_LABELS } from '../../components/calendar/calendarUtils';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { DiaFormacionItem, JornadaAdminItem, JornadaBloqueItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/roles';

function horaCorta(hora: string): string {
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}

function abreviarDia(diaNombre?: string, diaId?: number): string {
  if (diaId != null && diaId >= 1 && diaId <= 7) {
    return DAY_LABELS[diaId - 1];
  }
  if (diaNombre) {
    const n = diaNombre.trim();
    return n.length > 3 ? n.slice(0, 3) : n;
  }
  return '—';
}

function iconoJornada(nombre: string) {
  const lower = nombre.toLowerCase();
  if (lower.includes('noche')) return MoonIcon;
  if (lower.includes('tarde')) return SunIcon;
  return ClockIcon;
}

function etiquetaBotonGuardarJornada(saving: boolean, enEdicion: boolean): string {
  if (saving) return 'Guardando…';
  if (enEdicion) return 'Actualizar';
  return 'Crear';
}

function filasTablaJornadas(
  loading: boolean,
  items: JornadaAdminItem[],
  renderFila: (item: JornadaAdminItem) => ReactNode,
): ReactNode {
  if (loading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
          Cargando plantillas…
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
          No hay jornadas configuradas. Cree una plantilla arriba para programar fichas.
        </td>
      </tr>
    );
  }
  return items.map(renderFila);
}

function IconActionButton({
  onClick,
  title,
  className,
  children,
  disabled,
}: Readonly<{
  onClick: () => void;
  title: string;
  className: string;
  children: ReactNode;
  disabled?: boolean;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function JornadaBloquesChips({ bloques }: Readonly<{ bloques: JornadaBloqueItem[] }>) {
  if (bloques.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500">Sin bloques</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {bloques.map((b, idx) => (
        <span
          key={`${b.dia_formacion_id}-${b.hora_inicio}-${idx}`}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <span className="font-semibold text-primary-700 dark:text-primary-300">
            {abreviarDia(b.dia_nombre, b.dia_formacion_id)}
          </span>
          <ClockIcon className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
          {horaCorta(b.hora_inicio)}–{horaCorta(b.hora_fin)}
        </span>
      ))}
    </div>
  );
}

function actualizarBloqueEnIndice(
  bloques: JornadaBloqueItem[],
  idx: number,
  patch: Partial<JornadaBloqueItem>,
): JornadaBloqueItem[] {
  return bloques.map((bloque, i) => (i === idx ? { ...bloque, ...patch } : bloque));
}

function quitarBloqueEnIndice(bloques: JornadaBloqueItem[], idx: number): JornadaBloqueItem[] {
  return bloques.filter((_, i) => i !== idx);
}

function JornadaFormBloquesEditor({
  bloques,
  dias,
  onChange,
  onAdd,
}: Readonly<{
  bloques: JornadaBloqueItem[];
  dias: DiaFormacionItem[];
  onChange: (bloques: JornadaBloqueItem[]) => void;
  onAdd: () => void;
}>) {
  const patchBloque = (idx: number, patch: Partial<JornadaBloqueItem>) => {
    onChange(actualizarBloqueEnIndice(bloques, idx, patch));
  };

  const removeBloque = (idx: number) => {
    onChange(quitarBloqueEnIndice(bloques, idx));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bloques horarios</span>
        <button type="button" onClick={onAdd} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
          <PlusIcon className="h-4 w-4" aria-hidden />
          Bloque
        </button>
      </div>
      <div className="space-y-2">
        {bloques.map((b, idx) => (
          <div key={`${b.dia_formacion_id}-${idx}`} className="flex flex-wrap items-end gap-2">
            <select
              value={b.dia_formacion_id}
              onChange={(e) => patchBloque(idx, { dia_formacion_id: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-800"
            >
              {dias.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={b.hora_inicio}
              onChange={(e) => patchBloque(idx, { hora_inicio: e.target.value })}
              className="rounded border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
            <input
              type="time"
              value={b.hora_fin}
              onChange={(e) => patchBloque(idx, { hora_fin: e.target.value })}
              className="rounded border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
            <IconActionButton
              onClick={() => removeBloque(idx)}
              title="Quitar bloque"
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </IconActionButton>
          </div>
        ))}
      </div>
    </div>
  );
}

export const AdministracionJornadasPage = () => {
  const { roles } = useAuth();
  const [items, setItems] = useState<JornadaAdminItem[]>([]);
  const [dias, setDias] = useState<DiaFormacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formExtension, setFormExtension] = useState(60);
  const [formBloques, setFormBloques] = useState<JornadaBloqueItem[]>([]);
  const [propagarFichas, setPropagarFichas] = useState(true);
  const [infoMsg, setInfoMsg] = useState('');

  const canManage = hasAnyRole(roles, ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR']);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [jornadas, diasCat] = await Promise.all([
        apiService.getAdministracionJornadas(),
        apiService.getCatalogosDiasFormacion(),
      ]);
      setItems(jornadas);
      setDias(diasCat);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudieron cargar las jornadas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      setError('Solo superadministrador o administrador puede gestionar jornadas.');
      return;
    }
    void cargar();
  }, [canManage, cargar]);

  const resetForm = () => {
    setEditId(null);
    setFormNombre('');
    setFormExtension(60);
    setFormBloques([]);
    setPropagarFichas(true);
  };

  const startEdit = (j: JornadaAdminItem) => {
    setEditId(j.id);
    setFormNombre(j.nombre);
    setFormExtension(j.minutos_extension_fin);
    setFormBloques(j.bloques.map((b) => ({ ...b })));
  };

  const addBloque = () => {
    setFormBloques((prev) => [
      ...prev,
      {
        dia_formacion_id: dias[0]?.id ?? 1,
        hora_inicio: '08:00',
        hora_fin: '12:00',
        orden: prev.length,
      },
    ]);
  };

  const guardar: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    if (!formNombre.trim() || formBloques.length === 0) {
      setError('Nombre y al menos un bloque son obligatorios.');
      return;
    }
    void (async () => {
      setSaving(true);
      setError('');
      setInfoMsg('');
      try {
        const payload = {
          nombre: formNombre.trim(),
          minutos_extension_fin: formExtension,
          bloques: formBloques,
        };
        if (editId) {
          const res = await apiService.updateAdministracionJornada(editId, {
            ...payload,
            propagar_fichas: propagarFichas,
          });
          if (res.propagacion) {
            const p = res.propagacion;
            setInfoMsg(
              `Plantilla guardada. Fichas actualizadas: ${p.actualizadas}` +
                (p.omitidas > 0 ? `; omitidas (solape u error): ${p.omitidas}` : ''),
            );
          }
        } else {
          await apiService.createAdministracionJornada(payload);
        }
        resetForm();
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo guardar la jornada.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const eliminar = (id: number) => {
    if (!globalThis.confirm('¿Eliminar esta jornada?')) return;
    void (async () => {
      try {
        await apiService.deleteAdministracionJornada(id);
        if (editId === id) resetForm();
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo eliminar.'));
      }
    })();
  };

  const propagarManual = (id: number, nombre: string) => {
    if (
      !globalThis.confirm(
        `¿Propagar la plantilla «${nombre}» a todas las fichas vinculadas? Los bloques personalizados no se modifican.`,
      )
    ) {
      return;
    }
    void (async () => {
      setError('');
      setInfoMsg('');
      try {
        const p = await apiService.propagarAdministracionJornada(id);
        setInfoMsg(
          `Propagación completada. Fichas actualizadas: ${p.actualizadas}` +
            (p.omitidas > 0 ? `; omitidas: ${p.omitidas}` : ''),
        );
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo propagar la plantilla.'));
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jornadas de formación</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Plantillas horarias (Diurna, Tarde, Noche, etc.) usadas al programar fichas.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {infoMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
          {infoMsg}
        </div>
      )}

      {canManage && (
        <form onSubmit={guardar} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-600 dark:bg-gray-800/80 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editId ? 'Editar jornada' : 'Nueva jornada'}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="jornada-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                id="jornada-nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="input-field mt-1 w-full"
              />
            </div>
            <div>
              <label htmlFor="jornada-ext" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Extensión post-fin (minutos)
              </label>
              <input
                id="jornada-ext"
                type="number"
                min={0}
                value={formExtension}
                onChange={(e) => setFormExtension(Number(e.target.value))}
                className="input-field mt-1 w-full"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minutos después del fin del bloque en que aún se permite registrar salida. Si no define valor aquí,
                se usa el global en Configuración de asistencia.
              </p>
            </div>
          </div>

          <JornadaFormBloquesEditor
            bloques={formBloques}
            dias={dias}
            onChange={setFormBloques}
            onAdd={addBloque}
          />

          {editId != null && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={propagarFichas}
                onChange={(e) => setPropagarFichas(e.currentTarget.checked)}
                className="rounded border-gray-300"
              />
              <span>
                Actualizar fichas que usan esta plantilla (bloques vinculados o legacy coincidentes)
              </span>
            </label>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {etiquetaBotonGuardarJornada(saving, editId != null)}
            </button>
            {editId != null && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-600">
            <caption className="sr-only">Plantillas de jornadas de formación</caption>
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Plantilla
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Extensión
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Horarios programados
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-900">
              {filasTablaJornadas(loading, items, (j) => {
                const JornadaIcon = iconoJornada(j.nombre);
                const enEdicion = editId === j.id;
                return (
                  <tr
                    key={j.id}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                      enEdicion ? 'bg-primary-50/80 ring-1 ring-inset ring-primary-200 dark:bg-primary-900/20 dark:ring-primary-800' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          <JornadaIcon className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{j.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {j.bloques.length} bloque{j.bloques.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        title="Minutos extra tras el fin del bloque para tomar asistencia"
                      >
                        <ClockIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        {j.minutos_extension_fin} min
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <JornadaBloquesChips bloques={j.bloques} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconActionButton
                          onClick={() => startEdit(j)}
                          title={`Editar plantilla ${j.nombre}`}
                          className="text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        >
                          <PencilSquareIcon className="h-5 w-5" aria-hidden />
                        </IconActionButton>
                        <IconActionButton
                          onClick={() => propagarManual(j.id, j.nombre)}
                          title={`Propagar ${j.nombre} a fichas vinculadas`}
                          className="text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          <ArrowPathIcon className="h-5 w-5" aria-hidden />
                        </IconActionButton>
                        <IconActionButton
                          onClick={() => eliminar(j.id)}
                          title={`Eliminar plantilla ${j.nombre}`}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden />
                        </IconActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
