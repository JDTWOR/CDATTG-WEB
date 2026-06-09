import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { DiaFormacionItem, JornadaAdminItem, JornadaBloqueItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/roles';

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

  const canManage = hasAnyRole(roles, ['SUPER ADMINISTRADOR', 'ADMINISTRADOR']);

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
    if (!window.confirm('¿Eliminar esta jornada?')) return;
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
      !window.confirm(
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
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bloques horarios</span>
              <button type="button" onClick={addBloque} className="btn-secondary text-sm">
                + Bloque
              </button>
            </div>
            <div className="space-y-2">
              {formBloques.map((b, idx) => (
                <div key={`${b.dia_formacion_id}-${idx}`} className="flex flex-wrap items-end gap-2">
                  <select
                    value={b.dia_formacion_id}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFormBloques((prev) => prev.map((x, i) => (i === idx ? { ...x, dia_formacion_id: v } : x)));
                    }}
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
                    onChange={(e) =>
                      setFormBloques((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, hora_inicio: e.target.value } : x)),
                      )
                    }
                    className="rounded border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <input
                    type="time"
                    value={b.hora_fin}
                    onChange={(e) =>
                      setFormBloques((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, hora_fin: e.target.value } : x)),
                      )
                    }
                    className="rounded border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setFormBloques((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 text-sm"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {editId && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={propagarFichas}
                onChange={(e) => setPropagarFichas(e.currentTarget.checked)}
                className="rounded border-gray-300"
              />
              Actualizar fichas que usan esta plantilla (bloques vinculados o legacy coincidentes)
            </label>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editId ? 'Actualizar' : 'Crear'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="px-4 py-3 text-left font-medium">Extensión (min)</th>
              <th className="px-4 py-3 text-left font-medium">Bloques</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No hay jornadas.
                </td>
              </tr>
            ) : (
              items.map((j) => (
                <tr key={j.id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium">{j.nombre}</td>
                  <td className="px-4 py-3">{j.minutos_extension_fin}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {j.bloques
                      .map((b) => `${b.dia_nombre ?? b.dia_formacion_id} ${b.hora_inicio}–${b.hora_fin}`)
                      .join('; ')}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button type="button" onClick={() => startEdit(j)} className="text-primary-600 hover:underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => propagarManual(j.id, j.nombre)} className="text-amber-700 hover:underline dark:text-amber-400">
                      Propagar
                    </button>
                    <button type="button" onClick={() => eliminar(j.id)} className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
