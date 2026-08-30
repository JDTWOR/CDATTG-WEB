/**
 * Este archivo es el mensaje de “no hay nada” en el portal (lupa y texto).
 * Lo hice para no copiar el mismo recuadro vacío en cada listado.
 * Lo uso en semilleros públicos y en otras listas de investigación.
 * @author Cristian Deysdayr Jiménez
 */
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// titulo = frase grande; detalle = la explicación de abajo.
type Props = Readonly<{ titulo: string; detalle: string }>;

/**
 * Pinto el título y el detalle cuando no hay resultados.
 * @param titulo Frase grande (ej. “Aún no hay semilleros publicados”)
 * @param detalle Explicación corta debajo
 * @returns El recuadro vacío centrado
 */
export function PortalEmptyState({ titulo, detalle }: Props) {
  return (
    // Centro el recuadro para que se note que la lista está vacía.
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {/* Círculo con lupa: así se ve que busqué y no encontré nada. */}
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-gray-700">
        <MagnifyingGlassIcon className="h-10 w-10" aria-hidden />
      </span>
      {/* El título lo manda cada página (semilleros, revista, etc.). */}
      <h2 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white">{titulo}</h2>
      {/* El detalle explica cuándo va a aparecer contenido. */}
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{detalle}</p>
    </div>
  );
}
