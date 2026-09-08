/**
 * Este archivo guarda el texto oficial de términos de uso de la plataforma.
 * Lo hice en un archivo aparte para que el texto sea único, central y fácil
 * de leer, sin mezclarlo con la pantalla de registro.
 * Lo uso desde el modal de términos en el registro de personas.
 * @author Cristian Deysdayr Jiménez
 */

export const TERMINOS_USO_TITULO = 'Términos de uso del servicio';

export const TERMINOS_USO_SECCIONES: ReadonlyArray<{ titulo: string; parrafos: string[] }> = [
  {
    titulo: 'Aceptación de los términos',
    parrafos: [
      'Al registrar o actualizar los datos en este sistema, usted declara que la información suministrada es verídica, real y corresponde a sus datos personales.',
      'La aceptación de estos términos es obligatoria para poder realizar la gestión de sus datos dentro del servicio.',
    ],
  },
  {
    titulo: 'Uso responsable de la plataforma',
    parrafos: [
      'El usuario y la contraseña asignados son de carácter intransferible, personal y modificables únicamente por su titular.',
      'La suplantación de identidad o el ingreso de información falsa constituye un fraude, lo cual puede generar sanciones e inhabilidades.',
      'Es responsabilidad del titular mantener actualizados sus datos: identificación, nombres, datos de contacto y correo electrónico.',
      'Como usuario hará buen uso de la información a la que tenga acceso, siguiendo las recomendaciones de seguridad divulgadas por la institución.',
    ],
  },
  {
    titulo: 'Datos que se recolectan y su finalidad',
    parrafos: [
      'Para el correcto funcionamiento del servicio se almacenan datos básicos de identificación (nombres, apellidos, documento), grupo sanguíneo y RH, fotografía, datos de contacto y registros de acceso e ingreso.',
      'Estos datos se utilizan exclusivamente con fines educativos, académicos, de control de acceso y seguridad de las instalaciones.',
      'La información se guarda en un servidor de la institución con medidas de seguridad técnicas y organizativas para evitar su pérdida, alteración o uso no autorizado.',
    ],
  },
  {
    titulo: 'Derechos del titular de la información',
    parrafos: [
      'Como titular de los datos usted tiene derecho a solicitar prueba de la autorización, ser informado del uso de sus datos y acceder de forma gratuita a los mismos.',
      'Puede solicitar la actualización, rectificación o supresión de sus datos cuando lo considere necesario, a través de los canales institucionales.',
      'Puede presentar reclamaciones ante la autoridad competente por el incumplimiento de las normas de protección de datos personales.',
    ],
  },
  {
    titulo: 'Aceptación y vigencia',
    parrafos: [
      'Al marcar la casilla de aceptación durante el registro, se deja constancia de que usted acepta estos términos junto con la fecha de aceptación.',
      'Estos términos pueden ser actualizados por la institución; los cambios serán informados en el servicio.',
    ],
  },
];