/**
 * Estas son las casillas de caracterización (paso 5, junto con la contraseña).
 * NINGUNA quita las demás: eso lo hace caracterizacionSeleccion, no este archivo.
 * Lo pinta RegistroCampos cuando el paso es 4.
 * @author Cristian Deysdayr Jiménez
 */
import { UserGroupIcon } from '@heroicons/react/24/outline';
import type { ParametroItem } from '../../types';
import { RegistroSeccion } from './RegistroSeccion';

type Props = Readonly<{
  cars: ParametroItem[];
  ids: readonly number[];
  onToggle: (id: number) => void;
  error?: string;
}>;

/**
 * Caracterización: varias marcas a la vez. Si ninguna corresponde, eligen NINGUNA.
 * @param cars Lista del catálogo
 * @param ids Ids ya marcados
 * @param onToggle Lo llama el wizard (alternarCaracterizacion)
 * @param error Si no marcaron nada y el paso lo exige
 * @returns La sección Caracterización
 */
export function RegistroCaracterizacion({ cars, ids, onToggle, error }: Props) {
  return (
    <RegistroSeccion titulo="Caracterización" icono={<UserGroupIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Marque las categorías que apliquen. Si ninguna corresponde, elija NINGUNA.
      </p>
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-2 dark:border-gray-600">
        {cars.map((c) => (
          <label key={c.id} className="flex cursor-pointer items-start gap-2">
            {/* checkbox, no radio: pueden marcar varias, salvo NINGUNA. */}
            <input
              type="checkbox"
              checked={ids.includes(c.id)}
              onChange={() => onToggle(c.id)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">{c.name}</span>
          </label>
        ))}
      </div>
      {error ? <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </RegistroSeccion>
  );
}
