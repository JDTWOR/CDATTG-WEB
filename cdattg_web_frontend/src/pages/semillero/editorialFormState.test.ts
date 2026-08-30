/**
 * Aquí compruebo que al guardar un contenido editorial no se mande el id.
 * Prueba editorialFormState.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { editorialARequest, editorialVacio } from './editorialFormState';

describe('editorialARequest', () => {
  it('quita el id', () => {
    const body = editorialARequest({ ...editorialVacio, id: 9, titulo: 'N1' });
    expect(body).not.toHaveProperty('id');
    expect(body.titulo).toBe('N1');
  });
});
