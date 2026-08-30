/**
 * Esta es la presentación del área (misión, visión, historia) para el público.
 * Solo se ve si el admin la dejó en publicado. Si no, pongo el recuadro vacío.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { investigacionApi } from '../../services/investigacionApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalPresentacionItem } from '../../types/portal';
import { PortalEmptyState } from './PortalEmptyState';

/**
 * Pido la presentación y, si existe, la muestro por secciones.
 * @returns Página /investigacion/presentacion
 */
export function PortalPresentacionPage() {
  const [item, setItem] = useState<PortalPresentacionItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    investigacionApi.presentacion()
      .then(setItem)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'La presentación aún no está publicada')));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AppLink path={portalPaths.investigacion} className="btn-secondary">Volver</AppLink>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Presentación institucional</h1>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {!item && !error ? (
        <PortalEmptyState titulo="Sin presentación" detalle="El administrador publicará la misión y la visión del área." />
      ) : null}
      {item ? (
        <article className="card space-y-4 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
          {item.mision ? <section><h2 className="font-semibold text-gray-900 dark:text-white">Misión</h2><p>{item.mision}</p></section> : null}
          {item.vision ? <section><h2 className="font-semibold text-gray-900 dark:text-white">Visión</h2><p>{item.vision}</p></section> : null}
          {item.objetivo_general ? <section><h2 className="font-semibold">Objetivo general</h2><p>{item.objetivo_general}</p></section> : null}
          {item.historia ? <section><h2 className="font-semibold">Historia</h2><p>{item.historia}</p></section> : null}
          {item.equipo ? <section><h2 className="font-semibold">Equipo</h2><p>{item.equipo}</p></section> : null}
        </article>
      ) : null}
    </main>
  );
}
