/**
 * Esta es una foto del carrusel: imagen, etiqueta, título, texto y botón.
 * Lo hice aparte para no mezclar el cambio de banner con cómo se ve cada uno.
 * Si no hay foto, pongo fondo negro (antes era verde y se veía al pasar).
 * @author Cristian Deysdayr Jiménez
 */
import { AppLink } from '../../components/AppLink';
import { portalMediaUrl } from '../../services/portalApi';
import type { PortalBannerItem } from '../../types/portal';
import { claseCapaCarrusel, hrefCarruselSeguro } from './portalCarouselLogic';

type Props = Readonly<{ slide: PortalBannerItem; activa: boolean; debajo?: boolean }>;

/**
 * El botón del banner: si el enlace empieza con / me quedo en el sitio; si no, abre otra pestaña.
 * @param href Dirección ya revisada por hrefCarruselSeguro
 * @param texto Lo que dice el botón
 */
function BotonDestacado({ href, texto }: Readonly<{ href: string; texto: string }>) {
  const clase = 'mt-5 inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sena-green shadow hover:bg-gray-50';
  if (href.startsWith('/')) {
    return <AppLink path={href} className={clase}>{texto}</AppLink>;
  }
  // target _blank: Instagram u otra web; noreferrer por seguridad.
  return <a href={href} className={clase} target="_blank" rel="noreferrer">{texto}</a>;
}

/**
 * Pinto esta capa encima si es la activa, o debajo opaca si es la que se está yendo.
 * @param slide Datos del banner
 * @param activa Si es la que se ve ahora
 * @param debajo Si es la anterior, para tapar el fondo
 */
export function PortalCarouselSlide({ slide, activa, debajo = false }: Props) {
  // Quito javascript: y enlaces raros antes de pintar el botón.
  const href = hrefCarruselSeguro(slide.enlace_url ?? '');
  return (
    <div className={claseCapaCarrusel(activa, debajo)} aria-hidden={!activa}>
      {slide.imagen_url ? (
        <img src={portalMediaUrl(slide.imagen_url)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        // Sin foto: negro, no verde (el verde se veía al pasar de un banner a otro).
        <div className="absolute inset-0 bg-black" />
      )}
      {/* Oscurezco a la izquierda para que se lea el texto blanco. */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
      {/* px-14: dejo hueco para las flechas de los lados. */}
      <div className="relative z-10 flex h-full flex-col justify-center px-14 sm:px-16">
        <p className="w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-sena-green">
          {slide.etiqueta || 'SENA REGIONAL GUAVIARE'}
        </p>
        <h1 className="mt-4 max-w-xl text-3xl font-extrabold text-white sm:text-4xl">
          {slide.titulo || 'Formación y oportunidades'}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/90 sm:text-base">
          {slide.descripcion || 'Áreas, programas e investigación del Centro de Comercio, Industria y Turismo del Guaviare.'}
        </p>
        {slide.boton_texto && href ? <BotonDestacado href={href} texto={slide.boton_texto} /> : null}
      </div>
    </div>
  );
}
