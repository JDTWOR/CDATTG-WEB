/**
 * @module pages/administracion/CarruselDestacadoForm
 * @description Formulario de una diapositiva (imagen, textos y botón).
 * @author Cristian Deysdayr Jiménez
 */
import type { ComponentProps } from 'react';
import { portalApi, portalMediaUrl } from '../../services/portalApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalBannerItem, PortalEstado } from '../../types/portal';

type Props = Readonly<{
  form: PortalBannerItem;
  setForm: (next: PortalBannerItem) => void;
  onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']>;
  onCancelar: () => void;
  onError: (msg: string) => void;
  saving: boolean;
}>;

/**
 * Campos editables del carrusel de destacados.
 */
export function CarruselDestacadoForm({ form, setForm, onSubmit, onCancelar, onError, saving }: Props) {
  /**
   * Sube la foto de fondo y guarda la URL en el formulario.
   */
  async function onImagen(file: File) {
    try {
      const up = await portalApi.subirArchivo(file);
      setForm({ ...form, imagen_url: up.url });
    } catch (cause: unknown) {
      onError(axiosErrorMessage(cause, 'No se pudo subir la imagen'));
    }
  }

  return (
    <form className="card space-y-3" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {form.id ? 'Editar diapositiva' : 'Nueva diapositiva'}
      </h2>
      <input className="input-field" placeholder="Etiqueta (ej. Formación complementaria)" value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} />
      <input className="input-field" required placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
      <textarea className="input-field" rows={3} placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input-field" placeholder="Texto del botón (opcional)" value={form.boton_texto} onChange={(e) => setForm({ ...form, boton_texto: e.target.value })} />
        <input className="input-field" placeholder="Enlace del botón (/registro o https://…)" value={form.enlace_url} onChange={(e) => setForm({ ...form, enlace_url: e.target.value })} />
      </div>
      <label className="block text-sm" htmlFor="destacado-imagen">Imagen de fondo (jpg, png, webp o gif, máx. 5 MB)</label>
      {form.imagen_url ? <img src={portalMediaUrl(form.imagen_url)} alt="" className="h-32 w-full rounded-lg object-cover" /> : null}
      <input
        id="destacado-imagen"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            void onImagen(f);
          }
        }}
      />
      <select className="input-field" value={form.estado_publicacion} onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as PortalEstado })}>
        <option value="publicado">Publicado (visible en el inicio)</option>
        <option value="borrador">Borrador</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" className="btn-secondary" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
