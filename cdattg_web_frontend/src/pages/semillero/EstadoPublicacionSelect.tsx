/**
 * Este es el desplegable de estado: borrador, publicado o archivado.
 * Lo puse en los formularios de semillero y de revista para no copiarlo.
 * Publicado es lo que ve la gente en el portal; borrador y archivado no.
 * @author Cristian Deysdayr Jiménez
 */
import type { PortalEstado } from '../../types/portal';

// value = lo que ya está guardado; onChange = lo que el admin acaba de elegir.
type Props = Readonly<{ value: PortalEstado; onChange: (v: PortalEstado) => void }>;

/**
 * Pinto las tres opciones de publicación del área BIOGIGAS.
 * @param value Estado actual (borrador, publicado o archivado)
 * @param onChange Lo llamo cuando el admin cambia la opción
 * @returns El select de estado
 */
export function EstadoPublicacionSelect({ value, onChange }: Props) {
  return (
    // input-field: mismo estilo que el resto de formularios del sistema.
    <select
      className="input-field"
      value={value}
      // El API espera PortalEstado; el value del option ya es ese texto.
      onChange={(e) => onChange(e.target.value as PortalEstado)}
    >
      {/* Borrador: el admin lo ve; el público no. */}
      <option value="borrador">Borrador</option>
      {/* Publicado: sale en el portal si el resto de reglas lo permiten. */}
      <option value="publicado">Publicado</option>
      {/* Archivado: ya no se muestra, pero no lo borro. */}
      <option value="archivado">Archivado</option>
    </select>
  );
}
