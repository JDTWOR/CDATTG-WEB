/**
 * Este es el carrusel de banners del portal (inicio e investigación).
 * Lo hice del ancho de las tarjetas, con flechas a los lados, porque el banner
 * a pantalla completa se veía mal. El banner anterior se queda debajo para
 * que no se vea un destello verde al pasar. Usa portalCarouselLogic.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef, useState } from 'react';
import type { PortalBannerItem } from '../../types/portal';
import {
  CARRUSEL_INTERVALO_MS,
  indiceAnteriorCarrusel,
  siguienteIndiceCarrusel,
} from './portalCarouselLogic';
import { PortalCarouselControles } from './PortalCarouselControles';
import { PortalCarouselSlide } from './PortalCarouselSlide';

type Props = Readonly<{ banners: PortalBannerItem[] }>;

// Si no hay banners, igual pinto un slide (fondo negro y textos por defecto).
const FALLBACK: PortalBannerItem = {
  id: 0,
  titulo: '',
  descripcion: '',
  imagen_url: '',
  etiqueta: '',
  boton_texto: '',
  enlace_url: '',
  orden: 0,
  estado_publicacion: 'publicado',
};

/**
 * Paso los banners solos o, si no hay, el FALLBACK. Giran solos cada 5 segundos.
 * @param banners Lista que manda el API
 * @returns El carrusel alineado con el resto del portal
 */
export function PortalCarousel({ banners }: Props) {
  // Me quedo solo con los que tienen foto o título (los vacíos no sirven).
  const slides = banners.filter((b) => b.imagen_url || b.titulo);
  // Si el API no mandó nada, uso FALLBACK para no dejar un hueco.
  const capas = slides.length > 0 ? slides : [FALLBACK];
  // indice = el que se ve. debajo = el que dejo opaco atrás al cambiar.
  const [indice, setIndice] = useState(0);
  const [debajo, setDebajo] = useState(0);
  // reinicio: si la persona pulsa flecha, vuelvo a contar los 5 segundos.
  const [reinicio, setReinicio] = useState(0);
  // Ref: el intervalo lee el índice actual sin quedarse con un número viejo.
  const indiceRef = useRef(0);

  /**
   * Dejo el banner de ahora debajo y pongo el nuevo encima (así no se ve el fondo).
   * @param i A cuál banner voy
   */
  const aplicarIndice = (i: number) => {
    setDebajo(indiceRef.current);
    indiceRef.current = i;
    setIndice(i);
  };

  useEffect(() => {
    // Con un solo banner no hay nada que girar.
    if (capas.length < 2) return undefined;
    const id = globalThis.setInterval(() => {
      aplicarIndice(siguienteIndiceCarrusel(indiceRef.current, capas.length));
    }, CARRUSEL_INTERVALO_MS);
    return () => globalThis.clearInterval(id);
  }, [capas.length, reinicio]);

  /**
   * Si la persona usa flechas o puntos, reinicio el reloj de 5 segundos.
   * @param i A cuál banner voy
   */
  const irA = (i: number) => {
    aplicarIndice(i);
    setReinicio((n) => n + 1);
  };

  return (
    // Mismo ancho que las tarjetas de abajo (max-w-6xl + padding).
    <div className="mx-auto max-w-6xl px-4 pt-6">
      {/* Fondo negro: si algo se transparenta, no se ve verde. */}
      <section
        className="relative h-64 overflow-hidden rounded-xl bg-black shadow-sm sm:h-80 lg:h-[22rem]"
        aria-roledescription="carrusel"
        aria-label="Carrusel"
      >
        {capas.map((slide, i) => (
          <PortalCarouselSlide
            key={slide.id || i}
            slide={slide}
            activa={i === indice}
            debajo={i === debajo && i !== indice}
          />
        ))}
        <PortalCarouselControles
          total={capas.length}
          indice={indice}
          onIrA={irA}
          onAnterior={() => irA(indiceAnteriorCarrusel(indice, capas.length))}
          onSiguiente={() => irA(siguienteIndiceCarrusel(indice, capas.length))}
        />
      </section>
    </div>
  );
}
