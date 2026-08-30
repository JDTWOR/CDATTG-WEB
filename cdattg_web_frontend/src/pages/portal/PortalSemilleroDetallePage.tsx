/**
 * Esta es la página de un semillero concreto (por el slug de la URL).
 * Lo hice para cargar el detalle y pasárselo a PortalSemilleroFicha.
 * Si no existe o no está publicado, muestro el error.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { SemilleroItem } from '../../types/portal';
import { PortalSemilleroFicha } from './PortalSemilleroFicha';

/**
 * Pido el semillero público y pinto la ficha.
 * @returns Página /investigacion/semilleros/:slug
 */
export function PortalSemilleroDetallePage() {
  // slug: SCBA, SIGEMU, etc. (viene en la URL).
  const { slug } = useParams();
  const [item, setItem] = useState<SemilleroItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    portalApi.semilleroPublico(slug)
      .then(setItem)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se encontró el semillero')));
  }, [slug]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AppLink path={portalPaths.semilleros} className="btn-secondary">Volver</AppLink>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {item ? <PortalSemilleroFicha item={item} /> : null}
    </main>
  );
}
