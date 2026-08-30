/**
 * Aquí miro si cada campo del registro está bien (correo, documento, contraseña, etc.).
 * Lo usa el asistente al salir de un campo y al pulsar Siguiente.
 * Un string vacío significa “está bien”.
 * @author Cristian Deysdayr Jiménez
 */
import type { RegisterPayload } from '../../services/registerApi';

export const CAMPOS_POR_PASO: readonly (readonly (keyof RegisterPayload)[])[] = [
  ['tipo_documento', 'numero_documento', 'fecha_nacimiento', 'genero'],
  ['primer_nombre', 'primer_apellido'],
  ['celular', 'telefono', 'email'],
  ['pais_id', 'departamento_id', 'municipio_id'],
  ['parametro_id', 'password', 'password_confirm'],
];

type Validador = (p: RegisterPayload) => string;

const porCampo: Partial<Record<keyof RegisterPayload, Validador>> = {
  tipo_documento: (p) => (p.tipo_documento ? '' : 'Seleccione el tipo de documento'),
  numero_documento: (p) => textoSinSeparadores(p.numero_documento, 'el número de documento'),
  fecha_nacimiento: (p) => mensajeEdad(p.fecha_nacimiento),
  genero: (p) => (p.genero ? '' : 'Seleccione el género'),
  primer_nombre: (p) => (p.primer_nombre.trim() ? '' : 'Indique el primer nombre'),
  primer_apellido: (p) => (p.primer_apellido.trim() ? '' : 'Indique el primer apellido'),
  celular: (p) => textoSinSeparadores(p.celular, 'el celular'),
  telefono: (p) => (p.telefono.trim() ? textoSinSeparadores(p.telefono, 'el teléfono') : ''),
  email: (p) => mensajeEmail(p.email),
  pais_id: (p) => (p.pais_id ? '' : 'Seleccione el país'),
  departamento_id: (p) => (p.departamento_id ? '' : 'Seleccione el departamento'),
  municipio_id: (p) => (p.municipio_id ? '' : 'Seleccione el municipio'),
  parametro_id: (p) => (p.parametro_id ? '' : 'Marque al menos una caracterización'),
  password: (p) => mensajeClave(p.password),
  password_confirm: (p) => (p.password === p.password_confirm ? '' : 'Las contraseñas no coinciden'),
};

/** Primer texto no vacío de una lista. */
function primerMensaje(msgs: readonly string[]): string {
  return msgs.find(Boolean) ?? '';
}

/**
 * Error de un campo al salir de él, o vacío si es válido.
 * @param p Formulario completo
 * @param k Campo que acaban de tocar
 * @returns Mensaje para pintar en rojo, o ''
 */
export function mensajeCampoRegistro(p: RegisterPayload, k: keyof RegisterPayload): string {
  return porCampo[k]?.(p) ?? '';
}

export function mensajePasoInvalido(paso: number, p: RegisterPayload): string {
  const campos = CAMPOS_POR_PASO[paso];
  if (!campos) return '';
  return primerMensaje(campos.map((k) => mensajeCampoRegistro(p, k)));
}

export function mensajeRegistroInvalido(p: RegisterPayload): string {
  return primerMensaje(CAMPOS_POR_PASO.map((_, i) => mensajePasoInvalido(i, p)));
}

function textoSinSeparadores(v: string, etiqueta: string): string {
  const t = v.trim();
  if (!t) return `Indique ${etiqueta}`;
  if (/[\s.-]/.test(t)) return 'Escríbalo sin puntos, guiones ni espacios';
  return '';
}

function mensajeEmail(v: string): string {
  const t = v.trim();
  if (!t) return 'Indique el correo electrónico';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? '' : 'Revise el formato del correo';
}

function mensajeClave(v: string): string {
  if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(v) || !/\d/.test(v)) {
    return 'La contraseña debe incluir letras y números';
  }
  return '';
}

function mensajeEdad(fecha: string): string {
  if (!fecha) return 'Indique la fecha de nacimiento';
  const nac = new Date(`${fecha}T00:00:00`);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 14);
  if (Number.isNaN(nac.getTime()) || nac > limite) {
    return 'Debe tener al menos 14 años para registrarse';
  }
  return '';
}
