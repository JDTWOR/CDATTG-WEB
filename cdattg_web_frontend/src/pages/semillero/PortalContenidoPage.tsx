/**
 * Aquí el admin escribe la presentación del área (misión, visión) que ve el público.
 * Si la deja en publicado, sale en /investigacion/presentacion.
 * No es el carrusel de inicio: eso son banners.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { semilleroAdminPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalPresentacionItem } from '../../types/portal';
import { EstadoPublicacionSelect } from './EstadoPublicacionSelect';

const presentacionVacia: PortalPresentacionItem = {
  mision: '', vision: '', objetivo_general: '', historia: '', video_url: '', politicas_pdf: '', equipo: '', estado_publicacion: 'borrador',
};

/**
 * Textos de misión y visión (no el carrusel de inicio).
 * @returns Formulario de presentación
 */
export function PortalContenidoPage() {
  const [pres, setPres] = useState<PortalPresentacionItem>(presentacionVacia);
  const [error, setError] = useState('');

  async function cargar() {
    // Mezclo vacío + lo del API por si falta algún campo.
    setPres({ ...presentacionVacia, ...(await portalApi.obtenerPresentacion()) });
  }

  useEffect(() => {
    cargar().catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar')));
  }, []);

  return (
    <main className="space-y-6">
      <AppLink path={semilleroAdminPaths.index} className="btn-secondary">Volver a semilleros</AppLink>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Presentación de investigación</h1>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void portalApi.guardarPresentacion(pres).then(() => cargar()).catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo guardar')));
        }}
      >
        <textarea className="input-field" rows={3} placeholder="Misión" value={pres.mision} onChange={(e) => setPres({ ...pres, mision: e.target.value })} />
        <textarea className="input-field" rows={3} placeholder="Visión" value={pres.vision} onChange={(e) => setPres({ ...pres, vision: e.target.value })} />
        <textarea className="input-field" rows={3} placeholder="Objetivo general" value={pres.objetivo_general} onChange={(e) => setPres({ ...pres, objetivo_general: e.target.value })} />
        <textarea className="input-field" rows={3} placeholder="Historia" value={pres.historia} onChange={(e) => setPres({ ...pres, historia: e.target.value })} />
        <textarea className="input-field" rows={3} placeholder="Equipo" value={pres.equipo} onChange={(e) => setPres({ ...pres, equipo: e.target.value })} />
        <EstadoPublicacionSelect value={pres.estado_publicacion} onChange={(estado_publicacion) => setPres({ ...pres, estado_publicacion })} />
        <button type="submit" className="btn-primary">Guardar presentación</button>
      </form>
    </main>
  );
}
