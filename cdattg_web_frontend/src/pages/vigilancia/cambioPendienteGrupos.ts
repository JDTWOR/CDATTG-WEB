/**
 * Agrupo los cambios pendientes por persona para que el vigilante vea una
 * carpeta por visitante en vez de una lista larga de tarjetas sueltas.
 * También sé filtrar por nombre o documento. Lo separé para probarlo sin UI.
 * @author Cristian Deysdayr Jiménez
 */
import type { CambioPendiente } from './CambioPendienteCard';

/** Una carpeta con todos los cambios pendientes de la misma persona. */
export interface CambioPendienteGrupo {
  personaId: number;
  nombre: string;
  documento: string;
  cambios: CambioPendiente[];
}

/** Quita tildes, pasa a minúsculas y junta espacios para una búsqueda flexible. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nombre legible de la persona o un respaldo si no trae datos. */
function nombrePersona(cambio: CambioPendiente): string {
  if (!cambio.persona) return `Persona #${cambio.persona_id}`;
  const nombre = `${cambio.persona.primer_nombre ?? ''} ${cambio.persona.primer_apellido ?? ''}`.trim();
  return nombre === '' ? `Persona #${cambio.persona_id}` : nombre;
}

/**
 * Junta los cambios de la misma persona conservando el orden de llegada.
 * @param cambios lista que entrega el backend
 * @returns carpetas con una persona cada una
 */
export function agruparPorPersona(cambios: CambioPendiente[]): CambioPendienteGrupo[] {
  const grupos: CambioPendienteGrupo[] = [];
  const indice = new Map<number, CambioPendienteGrupo>();
  for (const cambio of cambios) {
    let grupo = indice.get(cambio.persona_id);
    if (!grupo) {
      grupo = {
        personaId: cambio.persona_id,
        nombre: nombrePersona(cambio),
        documento: cambio.persona?.numero_documento ?? '',
        cambios: [],
      };
      indice.set(cambio.persona_id, grupo);
      grupos.push(grupo);
    }
    grupo.cambios.push(cambio);
  }
  return grupos;
}

/**
 * Deja solo las carpetas cuyo nombre o documento coinciden con el texto.
 * @param grupos carpetas agrupadas
 * @param texto criterio de búsqueda (vacío devuelve todo)
 * @returns carpetas que coinciden
 */
export function filtrarGrupos(grupos: CambioPendienteGrupo[], texto: string): CambioPendienteGrupo[] {
  const criterio = normalizarTexto(texto);
  if (criterio === '') return grupos;
  return grupos.filter(
    (g) => normalizarTexto(g.nombre).includes(criterio) || normalizarTexto(g.documento).includes(criterio),
  );
}