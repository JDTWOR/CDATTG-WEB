/**
 * Desplegable de tipo de sangre. Lo puse aquí para usarlo en editar perfil
 * sin copiar las opciones en el modal grande.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { RH_TIPOS } from './rhTipos';

type RhSelectProps = Readonly<{
  id: string;
  value?: string;
  onChange: (rh: string) => void;
}>;

/**
 * Pinto el select de RH.
 * @param id id del campo
 * @param value grupo actual
 * @param onChange aviso el cambio
 */
export function RhSelect({ id, value, onChange }: RhSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tipo de sangre (RH)
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      >
        <option value="">Sin registrar</option>
        {RH_TIPOS.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>
    </div>
  );
}
