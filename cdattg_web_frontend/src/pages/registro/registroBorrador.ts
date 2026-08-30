/**
 * Aquí guardo lo que la persona ya escribió al registrarse, para que no se pierda si cierra la página.
 * Nunca guardo la contraseña. La clave es cdattg.registro.borrador.
 * @author Cristian Deysdayr Jiménez
 */
import type { RegisterPayload } from '../../services/registerApi';
import { registroVacio, TOTAL_PASOS } from './registroForm';

export const REGISTRO_BORRADOR_KEY = 'cdattg.registro.borrador';

export type RegistroBorrador = Readonly<{
  form: RegisterPayload;
  paso: number;
  ids: number[];
}>;

/**
 * Guarda el avance sin clave de acceso.
 * @param form Lo escrito hasta ahora
 * @param paso En qué paso quedó
 * @param ids Casillas de caracterización
 */
export function guardarBorrador(form: RegisterPayload, paso: number, ids: readonly number[]): void {
  const store = almacenamiento();
  if (!store) return;
  const limpio: RegisterPayload = { ...form, password: '', password_confirm: '' };
  store.setItem(REGISTRO_BORRADOR_KEY, JSON.stringify({ form: limpio, paso, ids: [...ids] }));
}

/**
 * Recupera un borrador válido o null (JSON roto, o no hay nada).
 */
export function leerBorrador(): RegistroBorrador | null {
  const store = almacenamiento();
  if (!store) return null;
  try {
    const raw = store.getItem(REGISTRO_BORRADOR_KEY);
    if (!raw) return null;
    return parsearBorrador(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Lo borro cuando el registro ya salió bien, para no rellenar con datos viejos. */
export function borrarBorrador(): void {
  almacenamiento()?.removeItem(REGISTRO_BORRADOR_KEY);
}

/** Si alguien editó el JSON a mano, descarto lo que no cuadre. */
function parsearBorrador(raw: unknown): RegistroBorrador | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { form?: unknown; paso?: unknown; ids?: unknown };
  if (!o.form || typeof o.form !== 'object') return null;
  const f = o.form as Record<string, unknown>;
  const paso = typeof o.paso === 'number' && o.paso >= 0 && o.paso < TOTAL_PASOS ? o.paso : 0;
  const ids = Array.isArray(o.ids) ? o.ids.filter((n): n is number => typeof n === 'number') : [];
  return {
    paso,
    ids,
    form: {
      ...registroVacio,
      ...tomarTextos(f),
      ...tomarIds(f),
      password: '',
      password_confirm: '',
    },
  };
}

function tomarTextos(f: Record<string, unknown>): Partial<RegisterPayload> {
  return {
    numero_documento: str(f.numero_documento), primer_nombre: str(f.primer_nombre),
    segundo_nombre: str(f.segundo_nombre), primer_apellido: str(f.primer_apellido),
    segundo_apellido: str(f.segundo_apellido), fecha_nacimiento: str(f.fecha_nacimiento),
    telefono: str(f.telefono), celular: str(f.celular), email: str(f.email),
  };
}

function tomarIds(f: Record<string, unknown>): Partial<RegisterPayload> {
  return {
    tipo_documento: num(f.tipo_documento), genero: num(f.genero), pais_id: num(f.pais_id),
    departamento_id: num(f.departamento_id), municipio_id: num(f.municipio_id),
    parametro_id: num(f.parametro_id), direccion: '',
  };
}

function str(v: unknown): string { return typeof v === 'string' ? v : ''; }
function num(v: unknown): number { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }

/** En pruebas o SSR no hay window; no exploto. */
function almacenamiento(): Storage | null {
  try {
    return globalThis.window === undefined ? null : globalThis.window.localStorage;
  } catch {
    return null;
  }
}
