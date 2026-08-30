/**
 * Aquí pruebo que el registro acepte un formulario completo y rechace edad,
 * correo mal escrito, documento con puntos y claves distintas.
 * Prueba registroValidate.ts.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { mensajeCampoRegistro, mensajePasoInvalido, mensajeRegistroInvalido } from './registroValidate';
import type { RegisterPayload } from '../../services/registerApi';
import { registroVacio } from './registroForm';

function base(): RegisterPayload {
  return {
    ...registroVacio,
    tipo_documento: 1, numero_documento: '123', primer_nombre: 'ANA',
    primer_apellido: 'LOPEZ', fecha_nacimiento: '2000-01-15',
    genero: 1, celular: '3001234567', email: 'ana@sena.edu.co',
    pais_id: 1, departamento_id: 1, municipio_id: 1, parametro_id: 1,
    password: 'Clave1234', password_confirm: 'Clave1234',
  };
}

describe('mensajeRegistroInvalido', () => {
  it('acepta un payload completo', () => {
    expect(mensajeRegistroInvalido(base())).toBe('');
  });

  it('rechaza menor de 14', () => {
    expect(mensajeRegistroInvalido({ ...base(), fecha_nacimiento: '2020-01-01' })).toContain('14');
  });

  it('rechaza contraseñas distintas', () => {
    expect(mensajeRegistroInvalido({ ...base(), password_confirm: 'x' })).toContain('coinciden');
  });

  it('exige país en el paso de ubicación', () => {
    expect(mensajePasoInvalido(3, { ...base(), pais_id: 0 })).toContain('país');
  });
});

describe('mensajeCampoRegistro', () => {
  it('pide documento sin puntos ni espacios', () => {
    expect(mensajeCampoRegistro({ ...base(), numero_documento: '1.234' }, 'numero_documento')).toContain('espacios');
  });

  it('acepta campo opcional vacío', () => {
    expect(mensajeCampoRegistro({ ...base(), telefono: '' }, 'telefono')).toBe('');
  });

  it('rechaza correo sin formato', () => {
    expect(mensajeCampoRegistro({ ...base(), email: 'ana' }, 'email')).toContain('formato');
  });
});
