/**
 * Esta es la pantalla para cargar revista, boletines, podcast, banners, etc.
 * Es la misma pantalla; lo que cambia es el kind (revistas, boletines…).
 * Lo que se publica aquí es lo que ve la gente en el portal.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState, type ComponentProps } from 'react';
import { AppLink } from '../../components/AppLink';
import { investigacionApi } from '../../services/investigacionApi';
import { semilleroAdminPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { BiogjgasItem, EditorialKind } from '../../types/biogjgas';
import { InvestigacionEditorialCampos } from './InvestigacionEditorialCampos';
import { editorialARequest, editorialVacio } from './editorialFormState';
import { editorialMeta } from './editorialKindMeta';

type Props = Readonly<{ kind: EditorialKind }>;

/**
 * Listado + formulario de revista, boletín, podcast, convocatoria, actividad o banner.
 * @param kind Qué sección del menú admin estamos viendo
 * @returns Lista o formulario según haya algo en edición
 */
export function InvestigacionEditorialPage({ kind }: Props) {
  const meta = editorialMeta(kind);
  const [rows, setRows] = useState<BiogjgasItem[]>([]);
  // null = estoy en la lista; un objeto = estoy creando o editando.
  const [form, setForm] = useState<BiogjgasItem | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setRows(await investigacionApi.listarAdmin(kind));
  }

  useEffect(() => {
    // Si cambio de revista a boletines, vuelvo a pedir la lista.
    cargar().catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo listar')));
  }, [kind]);

  async function onSubmit(e: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const body = editorialARequest(form);
      if (form.id) await investigacionApi.actualizar(kind, form.id, body);
      else await investigacionApi.crear(kind, body);
      setForm(null);
      await cargar();
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  async function onEliminar(id: number) {
    if (!globalThis.confirm('¿Eliminar este registro?')) return;
    try {
      await investigacionApi.eliminar(kind, id);
      await cargar();
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo eliminar'));
    }
  }

  return (
    <main className="space-y-6">
      <AppLink path={semilleroAdminPaths.index} className="btn-secondary">Volver a semilleros</AppLink>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{meta.titulo}</h1>
        {form ? null : <button type="button" className="btn-primary" onClick={() => setForm({ ...editorialVacio })}>Nuevo</button>}
      </header>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {form ? (
        <form className="card space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <InvestigacionEditorialCampos kind={kind} form={form} setForm={setForm} />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl border bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <p><span className="font-medium">{r.titulo}</span> <span className="text-xs uppercase text-gray-500">{r.estado_publicacion}</span></p>
              <p className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={() => setForm({ ...editorialVacio, ...r })}>Editar</button>
                <button type="button" className="btn-danger" onClick={() => void onEliminar(r.id)}>Quitar</button>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
