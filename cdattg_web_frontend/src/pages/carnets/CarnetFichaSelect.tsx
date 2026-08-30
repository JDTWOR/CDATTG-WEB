/**
 * El aprendiz elige la ficha (regular, media o complementaria) del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { agruparFichasPorTipo } from './carnetFichaGrupo';
import type { CarnetFichaOpcion } from '../../types/carnet';

type Props = Readonly<{
  fichas: CarnetFichaOpcion[];
  fichaId: number;
  onChange: (id: number) => void;
}>;

/**
 * Pinto el select agrupado por tipo de formación.
 */
export function CarnetFichaSelect({ fichas, fichaId, onChange }: Props) {
  const grupos = agruparFichasPorTipo(fichas);
  if (fichas.length === 0) return null;
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      <span className="block">Ficha / programa</span>
      <select className="input-field mt-1" value={fichaId} onChange={(e) => onChange(Number(e.target.value))}>
        {grupos.map((g) => (
          <optgroup key={g.tipo} label={g.label}>
            {g.fichas.map((f) => (
              <option key={f.id} value={f.id}>{f.numero} — {f.programa}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
