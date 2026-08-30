/**
 * Este es el listado completo de semilleros en el portal.
 * Lo hice aparte del home de investigación para no llenar esa página.
 * Pide la lista a portalApi.semillerosPublicos().
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { SemilleroItem } from '../../types/portal';
import { PortalEmptyState } from './PortalEmptyState';
import { PortalSemilleroCard } from './PortalSemilleroCard';

/**
 * Cargo semilleros publicados y los pinto en tarjetas.
 * @returns Página /investigacion/semilleros
 */
export function PortalSemillerosPage() {
  const [rows, setRows] = useState<SemilleroItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi.semillerosPublicos()
      .then(setRows)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudieron cargar los semilleros')));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AppLink path={portalPaths.investigacion} className="btn-secondary">Volver a Investigación</AppLink>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Semilleros de investigación</h1>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {rows.length === 0 && !error ? (
        <PortalEmptyState titulo="Aún no hay semilleros publicados" detalle="Cuando se publiquen, aparecerán aquí." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <li key={s.id}><PortalSemilleroCard item={s} /></li>
          ))}
        </ul>
      )}
    </main>
  );
}
