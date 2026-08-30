/**
 * Esta pantalla sirve para crear o editar un semillero (nombre, foto, líneas, etc.).
 * Si la URL trae id, cargo el que ya existe; si no, empiezo vacío.
 * Los campos están en SemilleroFichaCampos y SemilleroHijosCampos.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState, type ComponentProps } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { semilleroAdminPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { SemilleroItem } from '../../types/portal';
import { semilleroARequest, semilleroVacio } from './semilleroFormState';
import { SemilleroHijosCampos } from './SemilleroHijosCampos';
import { SemilleroFichaCampos } from './SemilleroFichaCampos';

/**
 * Formulario de semillero (alta o edición).
 * @returns Página de guardar semillero
 */
export function SemilleroFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState<SemilleroItem>(semilleroVacio);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // 0 = alta; otro número = el id de la URL.
  const editId = id ? Number(id) : 0;

  useEffect(() => {
    if (!editId) return;
    portalApi.obtenerSemillero(editId)
      .then((row) => setForm({ ...semilleroVacio, ...row, lineas: row.lineas ?? [], integrantes: row.integrantes ?? [], proyectos: row.proyectos ?? [] }))
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar')));
  }, [editId]);

  async function onSubmit(e: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = semilleroARequest(form);
      if (editId) await portalApi.actualizarSemillero(editId, body);
      else await portalApi.crearSemillero(body);
      nav(semilleroAdminPaths.index);
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  async function onImagen(file: File) {
    try {
      const up = await portalApi.subirArchivo(file);
      setForm((f) => ({ ...f, imagen_url: up.url }));
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo subir la imagen'));
    }
  }

  return (
    <main className="space-y-6">
      <AppLink path={semilleroAdminPaths.index} className="btn-secondary">Volver</AppLink>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{editId ? 'Editar semillero' : 'Nuevo semillero'}</h1>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      <form className="card space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <SemilleroFichaCampos form={form} setForm={setForm} onImagen={(f) => void onImagen(f)} />
        <SemilleroHijosCampos form={form} setForm={setForm} />
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </main>
  );
}
