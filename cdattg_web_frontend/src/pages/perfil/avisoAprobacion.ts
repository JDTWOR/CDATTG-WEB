/**
 * Aviso de aprobación pendiente para el módulo de perfil.
 * Lo hice para indicar al visitante que debe acercarse a portería
 * cuando sus datos o su foto quedaron pendientes de validación.
 * Lo usa Perfil y PerfilFotoCamara.
 * @author Cristian Deysdayr Jiménez
 */
import { mostrarToastApp } from '../../utils/appToast';

export type CambioPendienteTipo = 'datos' | 'foto';

type TextoAprobacion = Readonly<{ titulo: string; texto: string }>;

/**
 * Arma el aviso según el tipo de cambio enviado.
 * @param tipo qué se envió a aprobación (datos o foto)
 * @returns título y texto del aviso
 * @example construirAvisoAprobacion('datos').titulo
 */
export function construirAvisoAprobacion(tipo: CambioPendienteTipo): TextoAprobacion {
  if (tipo === 'foto') {
    return {
      titulo: 'Foto enviada para aprobación',
      texto: 'Su foto ha sido enviada para aprobación. Acérquese a portería para validar sus datos.',
    };
  }
  return {
    titulo: 'Cambios enviados para aprobación',
    texto: 'Sus cambios han sido enviados para aprobación. Acérquese a portería para actualizar sus datos.',
  };
}

/**
 * Muestra el toast de aprobación pendiente con el texto según el tipo.
 * @param tipo qué se envió a aprobación (datos o foto)
 */
export function avisoAprobacionPorteria(tipo: CambioPendienteTipo): void {
  const aviso = construirAvisoAprobacion(tipo);
  mostrarToastApp({ icon: 'success', titulo: aviso.titulo, texto: aviso.texto });
}