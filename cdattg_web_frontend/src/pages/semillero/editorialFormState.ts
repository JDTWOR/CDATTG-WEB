/**
 * Este es el formulario vacío de un contenido (revista, boletín, etc.).
 * Lo hice para no repetir los campos en blanco cada vez que el admin crea uno.
 * editorialARequest quita el id antes de mandarlo al API (el id lo pone el servidor).
 * @author Cristian Deysdayr Jiménez
 */
import type { BiogjgasItem } from '../../types/biogjgas';

// Plantilla al pulsar “Nuevo”: id 0 = todavía no existe en base de datos.
export const editorialVacio: BiogjgasItem = {
  id: 0,
  titulo: '',
  orden: 0,
  // Lo dejo publicado para que, si guarda así, salga en el portal de una.
  estado_publicacion: 'publicado',
};

/**
 * Armo el JSON para crear o actualizar. El id no va: en crear no existe y
 * en actualizar ya va en la URL.
 * @param form Lo que el admin llenó en pantalla
 * @returns El cuerpo sin id
 */
export function editorialARequest(form: BiogjgasItem): Partial<BiogjgasItem> {
  // _id lo descarto a propósito; el resto (título, fechas, urls…) sí se manda.
  const { id: _id, ...rest } = form;
  return rest;
}
