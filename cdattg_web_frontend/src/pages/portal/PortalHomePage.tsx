/**
 * Esta es la primera pantalla al abrir el sitio: SENA Regional Guaviare.
 * Lo hice para que el visitante vea los banners y un atajo a Investigación BIOGIGAS.
 * No es el home de /investigacion. Pide los banners a portalApi.home().
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalBannerItem } from '../../types/portal';
import { PortalCarousel } from './PortalCarousel';

/**
 * Cargo el carrusel y debajo la tarjeta para ir a investigación.
 * @returns Inicio público del portal
 */
export function PortalHomePage() {
  // banners: fotos del carrusel. Empiezan vacíos hasta que conteste el API.
  const [banners, setBanners] = useState<PortalBannerItem[]>([]);
  // error: si el API falla, lo muestro en rojo debajo del carrusel.
  const [error, setError] = useState('');

  useEffect(() => {
    // Traigo los banners del inicio (no los de /investigacion).
    portalApi.home()
      .then((h) => setBanners(h.banners ?? []))
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar el portal')));
  }, []);

  return (
    <>
      {/* Carrusel arriba, mismo ancho que la tarjeta de abajo. */}
      <PortalCarousel banners={banners} />
      {/* max-w-6xl: mismo ancho que la cabecera (PortalLayout). */}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {error ? (
          // role="alert" para que el lector de pantalla avise el fallo.
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>
        ) : null}
        {/* Atajo a BIOGIGAS: semilleros, revista, boletines, etc. */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Investigación BIOGIGAS</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Semilleros, revista, boletines, podcast, convocatorias y actividades del Centro.
          </p>
          <AppLink path={portalPaths.investigacion} className="btn-primary mt-4 inline-flex">Ir a Investigación</AppLink>
        </section>
      </div>
    </>
  );
}
