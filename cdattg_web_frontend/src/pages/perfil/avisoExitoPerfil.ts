/**
 * Avisos de éxito del módulo de perfil.
 * Lo hice para notificar con un toast cuando el perfil o la foto se guardan
 * directo (sin cambio pendiente de portería).
 * Lo usan Perfil y PerfilFotoCamara.
 * @author Cristian Deysdayr Jiménez
 */
import { mostrarToastApp } from '../../utils/appToast';

/**
 * Muestra el toast de éxito al guardar los datos del perfil directo.
 */
export function avisoPerfilGuardado(): void {
  mostrarToastApp({
    icon: 'success',
    titulo: 'Perfil actualizado',
    texto: 'Sus datos se guardaron correctamente.',
    timer: 3000,
  });
}

/**
 * Muestra el toast de éxito al guardar la foto de perfil directo.
 */
export function avisoFotoGuardada(): void {
  mostrarToastApp({
    icon: 'success',
    titulo: 'Foto guardada',
    texto: 'Su foto de perfil se guardó correctamente.',
    timer: 3000,
  });
}