/**
 * Estas son las flechas y los puntitos del carrusel.
 * Lo hice porque la gente pedía pasar el banner a mano, no solo esperar.
 * Si hay un solo banner, no pinto nada. Lo usa PortalCarousel.
 * @author Cristian Deysdayr Jiménez
 */
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{
  total: number;
  indice: number;
  onIrA: (i: number) => void;
  onAnterior: () => void;
  onSiguiente: () => void;
}>;

// Círculo blanco a mitad de altura; left-2 o right-2 lo pone PortalCarouselControles.
const CLASE_FLECHA =
  'absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white';

/**
 * Pinto flecha atrás, flecha adelante y un punto por cada banner.
 * @param total Cuántos banners hay
 * @param indice Cuál se ve ahora
 * @param onIrA Ir a un punto concreto
 * @param onAnterior Banner de atrás
 * @param onSiguiente Banner de adelante
 */
export function PortalCarouselControles({ total, indice, onIrA, onAnterior, onSiguiente }: Props) {
  // Un banner solo: no hay a dónde pasar.
  if (total < 2) return null;
  return (
    <>
      <button type="button" className={`${CLASE_FLECHA} left-2`} aria-label="Banner anterior" onClick={onAnterior}>
        <ChevronLeftIcon className="h-6 w-6" aria-hidden />
      </button>
      <button type="button" className={`${CLASE_FLECHA} right-2`} aria-label="Banner siguiente" onClick={onSiguiente}>
        <ChevronRightIcon className="h-6 w-6" aria-hidden />
      </button>
      {/* Puntos abajo al centro: el blanco es el banner de ahora. */}
      <ol className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {Array.from({ length: total }, (_, i) => (
          <li key={`dot-${i}`}>
            <button
              type="button"
              aria-label={`Diapositiva ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full ${i === indice ? 'bg-white' : 'bg-white/50'}`}
              onClick={() => onIrA(i)}
            />
          </li>
        ))}
      </ol>
    </>
  );
}
