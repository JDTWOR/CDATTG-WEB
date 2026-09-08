/**
 * Fila de un aprendiz con carnet regular aprobado, solo para mirar.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { urlFotoBiblioteca } from '../../../services/carnetApi';
import type { CarnetBibliotecaItem } from '../../../types/carnet';
import { CarnetPendienteFoto } from '../shared/CarnetPendienteFoto';

type Props = Readonly<{
  item: CarnetBibliotecaItem;
  onVerFoto: (item: CarnetBibliotecaItem) => void;
}>;

/**
 * Muestro foto, datos y el botón para ver la foto grande.
 */
export function CarnetBibliotecaFila({ item, onVerFoto }: Props) {
  return (
    <article className="flex flex-wrap items-center gap-4">
      <CarnetPendienteFoto id={item.id} fotoUrl={urlFotoBiblioteca(item.id)} />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {item.nombres} {item.apellidos}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          CC {item.numero_documento} · RH {item.rh || '—'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Grupo No. {item.ficha_numero} · {item.programa}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Instructor líder. {item.instructor_lider || '—'}</p>
      </div>
      <button type="button" className="btn-secondary" onClick={() => onVerFoto(item)}>
        Ver
      </button>
    </article>
  );
}
