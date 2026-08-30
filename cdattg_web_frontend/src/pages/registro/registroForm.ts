/**
 * Aquí está el formulario de registro vacío y cuántos pasos tiene (cinco).
 * Lo usa useRegistroWizard para empezar de cero y RegistroProgreso para los títulos.
 * @author Cristian Deysdayr Jiménez
 */
import type { Dispatch, SetStateAction } from 'react';
import type { RegisterPayload } from '../../services/registerApi';

// setForm cambia varios campos a la vez (ej. país + limpiar departamento).
export type RegistroSetForm = Dispatch<SetStateAction<RegisterPayload>>;

// set cambia un solo campo (nombre, celular, etc.).
export type RegistroSetCampo = (k: keyof RegisterPayload, v: string | number) => void;

// errores: un mensaje por campo, solo si falló la validación.
export type RegistroErrores = Partial<Record<keyof RegisterPayload, string>>;

// Lo que cada paso necesita para pintar el error y validar al salir.
export type RegistroCampoBind = Readonly<{
  errores: RegistroErrores;
  tocar: (k: keyof RegisterPayload) => void;
}>;

// Plantilla al entrar o al limpiar el borrador. direccion queda vacío a propósito.
export const registroVacio: RegisterPayload = {
  tipo_documento: 0, numero_documento: '', primer_nombre: '', segundo_nombre: '',
  primer_apellido: '', segundo_apellido: '', fecha_nacimiento: '', genero: 0,
  telefono: '', celular: '', email: '', pais_id: 0, departamento_id: 0, municipio_id: 0,
  direccion: '', parametro_id: 0, password: '', password_confirm: '',
};

// Orden de la barra: Identidad → Nombre → Contacto → Ubicación → Cuenta.
export const REGISTRO_TITULOS = ['Identidad', 'Nombre', 'Contacto', 'Ubicación', 'Cuenta'] as const;

export const TOTAL_PASOS = REGISTRO_TITULOS.length;
