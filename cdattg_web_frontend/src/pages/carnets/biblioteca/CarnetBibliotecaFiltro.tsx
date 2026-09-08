/**
 * Filtro del catálogo de fichas regulares para biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetBibliotecaFicha } from '../../../types/carnet';

type Props = Readonly<{
  fichas: CarnetBibliotecaFicha[];
  fichaId: number;
  onChange: (id: number) => void;
}>;

/**
 * Pinto el select de fichas. Cero significa todas.
 */
export function CarnetBibliotecaFiltro({ fichas, fichaId, onChange }: Props) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-200">
      <span className="block">Ficha</span>
      <select
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
        value={fichaId}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>Todas las fichas regulares</option>
        {fichas.map((f) => (
          <option key={f.id} value={f.id}>
            {f.numero} · {f.programa}
          </option>
        ))}
      </select>
    </label>
  );
}
