/**
 * Aquí dejo el semillero vacío para crear uno nuevo, y cómo mandarlo al API.
 * Lo saqué del formulario para no mezclar la pantalla con los datos.
 * claveFila es solo de la UI; semilleroARequest la quita antes de enviar.
 * @author Cristian Deysdayr Jiménez
 */
import type {
  SemilleroIntegranteItem,
  SemilleroItem,
  SemilleroLineaItem,
  SemilleroProyectoItem,
} from '../../types/portal';

// Plantilla de “Nuevo semillero”. id 0 = todavía no existe en base de datos.
export const semilleroVacio: SemilleroItem = {
  id: 0,
  nombre: '',
  sigla: '',
  slug: '',
  icono: '',
  color_identidad: '#39A900',
  resumen: '',
  descripcion: '',
  mision: '',
  vision: '',
  objetivos: '',
  instructor_lider: '',
  correo_contacto: '',
  imagen_url: '',
  orden: 0,
  estado_publicacion: 'borrador',
  lineas: [],
  integrantes: [],
  proyectos: [],
};

/** Identificador de una fila nueva (React); no se guarda en el servidor. */
export function claveFila(): string {
  return crypto.randomUUID();
}

/**
 * Clave React: uuid local o id de base de datos.
 * @param id Id persistido, si ya existe
 * @param clave Uuid de una fila que acaban de añadir
 */
export function claveHijo(id?: number, clave?: string): string {
  if (clave) return clave;
  return id != null && id > 0 ? `id-${id}` : 'nueva';
}

export function lineaVacia(): SemilleroLineaItem {
  return { clave: claveFila(), nombre: '', descripcion: '', estado_publicacion: 'publicado' };
}

export function integranteVacio(): SemilleroIntegranteItem {
  return { clave: claveFila(), nombre: '', rol: '', correo: '', programa: '', estado_publicacion: 'publicado' };
}

export function proyectoVacio(): SemilleroProyectoItem {
  return {
    clave: claveFila(),
    titulo: '',
    resumen: '',
    anio: new Date().getFullYear(),
    estado_publicacion: 'publicado',
  };
}

/** Quita la clave de UI antes de enviar JSON. */
function sinClave<T extends { clave?: string }>(row: T): Omit<T, 'clave'> {
  const copy = { ...row };
  delete copy.clave;
  return copy;
}

/**
 * Cuerpo JSON para crear o actualizar. Sin id: va en la URL si es edición.
 * @param form Lo que el admin llenó
 */
export function semilleroARequest(form: SemilleroItem) {
  return {
    nombre: form.nombre,
    sigla: form.sigla,
    slug: form.slug,
    icono: form.icono,
    color_identidad: form.color_identidad,
    resumen: form.resumen,
    descripcion: form.descripcion,
    mision: form.mision,
    vision: form.vision,
    objetivos: form.objetivos,
    instructor_lider: form.instructor_lider,
    correo_contacto: form.correo_contacto,
    imagen_url: form.imagen_url,
    orden: form.orden,
    estado_publicacion: form.estado_publicacion,
    lineas: (form.lineas ?? []).map(sinClave),
    integrantes: (form.integrantes ?? []).map(sinClave),
    proyectos: (form.proyectos ?? []).map(sinClave),
  };
}
