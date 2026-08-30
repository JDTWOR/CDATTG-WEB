/**
 * @module pages/administracion/CarruselDestacadosPage
 * @description Módulo admin: Carrusel de destacados SENA Regional Guaviare.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState, type ComponentProps } from 'react';
import { portalApi } from '../../services/portalApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalBannerItem } from '../../types/portal';
import { CarruselDestacadoForm } from './CarruselDestacadoForm';
import { CarruselDestacadoLista } from './CarruselDestacadoLista';
import { destacadosARequest, destacadosVacio } from './carruselFormState';

/**
 * CRUD de diapositivas del carrusel de inicio.
 */
export function CarruselDestacadosPage() {
  const [rows, setRows] = useState<PortalBannerItem[]>([]);
  const [form, setForm] = useState<PortalBannerItem | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setRows(await portalApi.listarBanners());
  }

  useEffect(() => {
    cargar().catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar el carrusel')));
  }, []);

  async function onSubmit(e: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const body = destacadosARequest(form);
      if (form.id) await portalApi.actualizarBanner(form.id, body);
      else await portalApi.crearBanner({ ...body, orden: rows.length });
      setForm(null);
      await cargar();
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  }

  async function onEliminar(id: number) {
    if (!globalThis.confirm('¿Quitar esta diapositiva del carrusel?')) return;
    try {
      await portalApi.eliminarBanner(id);
      await cargar();
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo eliminar'));
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Carrusel de destacados</h1>
          <p className="mt-1 text-sm text-gray-500">SENA Regional Guaviare — imágenes, títulos, textos y botones del inicio público.</p>
        </div>
        {form ? null : (
          <button type="button" className="btn-primary" onClick={() => setForm({ ...destacadosVacio })}>Nueva diapositiva</button>
        )}
      </header>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {form ? (
        <CarruselDestacadoForm form={form} setForm={setForm} onSubmit={(e) => void onSubmit(e)} onCancelar={() => setForm(null)} onError={setError} saving={saving} />
      ) : (
        <CarruselDestacadoLista banners={rows} onEditar={(row) => setForm({ ...destacadosVacio, ...row })} onEliminar={(id) => void onEliminar(id)} />
      )}
    </main>
  );
}
