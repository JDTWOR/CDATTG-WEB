import axios from 'axios';
import type { AsistenciaAprendizResponse } from '../../types';
import { axiosErrorMessage } from '../../utils/httpError';

export type ClaseMensajeRegistro = 'exito' | 'aviso' | 'error';

export interface MensajeRegistroInterpretado {
  clase: ClaseMensajeRegistro;
  titulo: string;
  detalle: string;
}

type ReglaMensaje = Readonly<{
  patron: RegExp;
  titulo: string;
  detalle: string;
  clase?: ClaseMensajeRegistro;
}>;

const REGLAS: ReglaMensaje[] = [
  {
    patron: /ya registrad|registro duplicado|no se guard|evitar un registro duplicado|muy poco|mismo qr/i,
    titulo: 'Entrada ya existía',
    detalle:
      'La entrada de este aprendiz ya estaba guardada. No se creó un registro nuevo. Espere unos segundos antes de escanear el mismo QR otra vez.',
    clase: 'aviso',
  },
  {
    patron: /esperar al menos|1 minuto|segundos más/i,
    titulo: 'Salida aún no disponible',
    detalle: 'Ya hay una entrada registrada. Para marcar salida con el mismo QR debe pasar al menos 1 minuto desde la entrada.',
    clase: 'aviso',
  },
  {
    patron: /entrada sin salida/i,
    titulo: 'Entrada pendiente de salida',
    detalle: 'El aprendiz ya tiene una entrada abierta. Escanee de nuevo para registrar la salida cuando corresponda.',
    clase: 'aviso',
  },
  {
    patron: /no se encontró ninguna persona|documento no encontrado/i,
    titulo: 'Documento no encontrado',
    detalle: 'No existe una persona registrada con el número de documento leído. Verifique el QR o use el registro manual.',
    clase: 'error',
  },
  {
    patron: /no corresponde a un aprendiz de esta ficha/i,
    titulo: 'Aprendiz de otra ficha',
    detalle: 'Ese documento pertenece a una persona que no está matriculada como aprendiz en esta ficha.',
    clase: 'error',
  },
  {
    patron: /oculto de la toma de asistencia/i,
    titulo: 'Aprendiz no habilitado',
    detalle: 'Este aprendiz está oculto en la toma de asistencia de la ficha. Un administrador debe habilitarlo.',
    clase: 'error',
  },
  {
    patron: /sesión ya está finalizada|sesion ya esta finalizada/i,
    titulo: 'Sesión cerrada',
    detalle: 'La sesión de asistencia ya fue finalizada. No se pueden registrar más entradas ni salidas.',
    clase: 'error',
  },
  {
    patron: /sesión de asistencia no encontrada|sesion de asistencia no encontrada/i,
    titulo: 'Sesión no disponible',
    detalle: 'No se encontró la sesión de asistencia activa. Recargue la página o vuelva a abrir la sesión.',
    clase: 'error',
  },
  {
    patron: /ingreso sin salida registrado hoy/i,
    titulo: 'Entrada abierta en otra sesión',
    detalle: 'El aprendiz ya tiene una entrada sin salida hoy en esta ficha. Registre primero la salida pendiente.',
    clase: 'error',
  },
  {
    patron: /fuera del horario|horario de la jornada/i,
    titulo: 'Fuera de horario',
    detalle: 'Solo se puede tomar asistencia dentro del horario de jornada configurado para la ficha.',
    clase: 'error',
  },
  {
    patron: /otro instructor|no está creado como instructor/i,
    titulo: 'Sin permiso en esta sesión',
    detalle: 'No tiene permiso para registrar asistencia en la sesión de otro instructor o en esta ficha.',
    clase: 'error',
  },
  {
    patron: /ya tiene hora de salida/i,
    titulo: 'Salida ya registrada',
    detalle: 'Este tramo de asistencia ya tiene salida registrada. No se puede volver a marcar.',
    clase: 'aviso',
  },
];

function esMensajeExitoGuardado(mensaje: string): boolean {
  const m = mensaje.trim().toLowerCase();
  return m === 'ingreso registrado' || m === 'salida registrada';
}

function esTextoRebote(texto: string): boolean {
  const m = texto.toLowerCase();
  return (
    m.includes('ya registrad') ||
    m.includes('no se guard') ||
    m.includes('duplicado') ||
    m.includes('muy poco') ||
    m.includes('mismo qr') ||
    m.includes('esperar al menos') ||
    m.includes('segundos más') ||
    m.includes('entrada sin salida')
  );
}

function esMensajeSinNuevoRegistro(mensaje: string): boolean {
  if (!mensaje.trim() || esMensajeExitoGuardado(mensaje)) return false;
  return esTextoRebote(mensaje);
}

const PREFIJOS_ERROR_BACKEND = [
  /^error al registrar ingreso:\s*/i,
  /^error al registrar:\s*/i,
];

/** Quita envoltorios técnicos del backend Go (fmt.Errorf). */
export function normalizarMensajeBackend(raw: string): string {
  let texto = raw.trim();
  for (const prefijo of PREFIJOS_ERROR_BACKEND) {
    texto = texto.replace(prefijo, '');
  }
  return texto.trim() || raw.trim();
}

/** Extrae el motivo real de un fallo al registrar por documento/QR. */
export function extraerMensajeErrorRegistroAsistencia(e: unknown): string {
  const bruto = normalizarMensajeBackend(
    axiosErrorMessage(e, ''),
  );

  if (bruto) return bruto;

  if (axios.isAxiosError(e)) {
    const status = e.response?.status;
    if (status === 401) {
      return 'Sesión expirada. Vuelva a iniciar sesión e intente de nuevo.';
    }
    if (status === 403) {
      return 'No tiene permiso para registrar asistencia en esta sesión.';
    }
    if (status === 0 || e.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifique su conexión o que la API esté en ejecución.';
    }
    if (status) {
      return `El servidor rechazó el registro (HTTP ${status}).`;
    }
  }

  return 'No se recibió una explicación del servidor. Intente de nuevo o use el registro manual.';
}

function detalleConSegundosSalida(detalle: string, segundos?: number): string {
  if ((segundos ?? 0) <= 0) return detalle;
  if (/\d+\s*segundos?/i.test(detalle)) return detalle;
  return `${detalle} Faltan aproximadamente ${segundos} s.`;
}

export function interpretarMensajeRegistroAsistencia(
  raw: string,
  segundosRestantesSalida?: number,
): MensajeRegistroInterpretado {
  const texto = normalizarMensajeBackend(raw);
  if (!texto) {
    return {
      clase: 'error',
      titulo: 'No se pudo registrar',
      detalle: 'Ocurrió un error desconocido al guardar la asistencia.',
    };
  }

  if ((segundosRestantesSalida ?? 0) > 0 || esTextoRebote(texto)) {
    const regla = REGLAS.find((r) => r.patron.test(texto)) ?? REGLAS[1];
    return {
      clase: 'aviso',
      titulo: regla.titulo,
      detalle: detalleConSegundosSalida(texto.length > 20 ? texto : regla.detalle, segundosRestantesSalida),
    };
  }

  for (const regla of REGLAS) {
    if (regla.patron.test(texto)) {
      return {
        clase: regla.clase ?? 'error',
        titulo: regla.titulo,
        detalle: texto.length > 30 ? texto : regla.detalle,
      };
    }
  }

  return {
    clase: 'error',
    titulo: 'No se pudo registrar',
    detalle: texto,
  };
}

export function interpretarRespuestaRegistroAsistencia(
  data: AsistenciaAprendizResponse,
): MensajeRegistroInterpretado {
  const segundos = data.segundos_restantes_salida ?? 0;
  const mensaje = normalizarMensajeBackend(data.mensaje ?? '');

  if (segundos > 0 || esMensajeSinNuevoRegistro(mensaje)) {
    return interpretarMensajeRegistroAsistencia(
      mensaje || 'El mismo QR se leyó de nuevo antes de tiempo.',
      segundos,
    );
  }

  if (data.tipo_registro === 'salida') {
    return {
      clase: 'exito',
      titulo: 'Salida registrada',
      detalle: mensaje || 'Se guardó la salida del aprendiz.',
    };
  }

  return {
    clase: 'exito',
    titulo: 'Entrada registrada',
    detalle: mensaje || 'Se guardó la entrada del aprendiz.',
  };
}

export function esMensajeReboteTexto(mensaje: string): boolean {
  return esTextoRebote(mensaje);
}
