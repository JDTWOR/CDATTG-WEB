/**
 * Comparo el valor actual (antes) con el propuesto (después) de un cambio
 * pendiente que revisa el vigilante. Lo puse aparte para no repetir la lógica
 * ni el mapa de nombres de campos en la tarjeta de aprobación.
 * @author Cristian Deysdayr Jiménez
 */

/** Datos mínimos de la persona que el pendiente trae para conocer el "antes". */
export type PersonaCambio = {
  numero_documento?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  rh?: string;
  foto_path?: string;
} & Record<string, unknown>;

/** Un campo con su etiqueta, valor actual y valor propuesto. */
export interface CampoAntesDespues {
  clave: string;
  etiqueta: string;
  antes: string;
  despues: string;
}

/** Nombres legibles de cada campo que puede pedir aprobación. */
export const NOMBRES_CAMPO: Record<string, string> = {
  tipo_documento: 'Tipo de documento',
  primer_nombre: 'Primer nombre',
  segundo_nombre: 'Segundo nombre',
  primer_apellido: 'Primer apellido',
  segundo_apellido: 'Segundo apellido',
  fecha_nacimiento: 'Fecha de nacimiento',
  genero: 'Género',
  telefono: 'Teléfono',
  celular: 'Celular',
  email: 'Email',
  pais_id: 'País',
  departamento_id: 'Departamento',
  municipio_id: 'Municipio',
  direccion: 'Dirección',
  parametro_id: 'Parametro',
  nivel_escolaridad_id: 'Nivel escolaridad',
  rh: 'Rh',
};

/**
 * Le doy el nombre legible a una clave de campo.
 * @param clave nombre del campo en el JSON
 * @returns nombre para mostrar o la pista original
 */
export function nombreCampo(clave: string): string {
  return NOMBRES_CAMPO[clave] ?? clave;
}

/**
 * Convierto el JSON de campos que guarda el pendiente en un objeto seguro.
 * @param camposJson texto con los valores nuevos propuestos
 * @returns objeto con los campos o vacío si está corrupto
 */
export function parsearCampos(camposJson: string): Record<string, unknown> {
  try {
    return JSON.parse(camposJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Convierte a texto legible un valor; si no hay, deja una raya. */
function aTexto(valor: unknown): string {
  const texto = String(valor ?? '').trim();
  return texto === '' ? '—' : texto;
}

/**
 * Armo la lista de campos con su antes y después para la tarjeta del vigilante.
 * @param campos valores nuevos que pide aprobación
 * @param persona persona actual con los valores vigentes
 * @returns lista ordenada de diferencias para mostrar
 */
export function armarCamposAntesDespues(
  campos: Record<string, unknown>,
  persona?: PersonaCambio,
): CampoAntesDespues[] {
  return Object.entries(campos).map(([clave, valor]) => ({
    clave,
    etiqueta: nombreCampo(clave),
    antes: aTexto(persona?.[clave] ?? ''),
    despues: aTexto(valor),
  }));
}