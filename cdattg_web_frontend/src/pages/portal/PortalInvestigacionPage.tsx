/**
 * Esta es la entrada pública de Investigación BIOGIGAS.
 * Lo hice para mostrar banners, semilleros y el menú Explora (revista, boletines, etc.).
 * Pide los datos a investigacionApi.home(). El carrusel es el mismo del inicio.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { investigacionApi } from '../../services/investigacionApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { InvestigacionHomeResponse } from '../../types/portal';
import { PortalCarousel } from './PortalCarousel';
import { PortalEmptyState } from './PortalEmptyState';
import { EXPLORA_INVESTIGACION } from './portalExplora';
import { PortalSemilleroCard } from './PortalSemilleroCard';

// Estado inicial: nada cargado todavía.
const vacio: InvestigacionHomeResponse = { banners: [], semilleros: [], presentacion: null };

/**
 * Cargo home de investigación y pinto carrusel, tarjetas y enlaces.
 * @returns Página /investigacion
 */
export function PortalInvestigacionPage() {
  const [data, setData] = useState<InvestigacionHomeResponse>(vacio);
  const [error, setError] = useState('');

  useEffect(() => {
    // Home público de BIOGIGAS (banners + semilleros publicados).
    investigacionApi.home()
      .then(setData)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar investigación')));
  }, []);

  return (
    <>
      <PortalCarousel banners={data.banners} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
        ) : null}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Semilleros de investigación</h2>
            <AppLink path={portalPaths.semilleros} className="text-sm font-medium text-primary-700 hover:underline">Ver listado</AppLink>
          </div>
          {data.semilleros.length === 0 ? (
            <PortalEmptyState titulo="Aún no hay semilleros publicados" detalle="Cuando el administrador publique un grupo, aparecerá aquí." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.semilleros.map((s) => (
                <li key={s.id}><PortalSemilleroCard item={s} /></li>
              ))}
            </ul>
          )}
        </section>
        {/* Enlaces a presentación, revista, boletines, etc. (portalExplora). */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Explora el área de investigación</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORA_INVESTIGACION.map((e) => (
              <li key={e.to}>
                <AppLink path={e.to} className="block rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-sena-green hover:bg-gray-50 dark:border-gray-700">
                  {e.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
