import ExcelJS from 'exceljs';
import { apiService } from '../../services/api';
import { formatFechaVista } from '../../utils/formatFecha';
import type { AprendizResponse, AsistenciaAprendizResponse, AsistenciaResponse } from '../../types';

export type BadgeColorAsistencia = 'green' | 'yellow' | 'gray';
export type TipoExportHistorial = 'dia' | 'semana' | 'mes' | 'anio';

export type FilaHistorialExport = {
  aprendiz: AprendizResponse;
  asistio: boolean;
  horaIngreso: string | null;
  horaSalida: string | null;
  observaciones: string;
  badgeColor: BadgeColorAsistencia;
};

const UMBRAL_POCAS_HORAS = 0.8;
const TOLERANCIA_MINUTOS_TARDE = 60;

export const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SEMANAS_ORDINAL_ES = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta'];

export function minIsoDateString(a: string, b: string): string {
  return a <= b ? a : b;
}

export function formatoFechaColumna(iso: string): string {
  return formatFechaVista(iso);
}

export function fechasEnRango(inicio: string, fin: string, maxFecha?: string): string[] {
  const limite = maxFecha ?? new Date().toISOString().slice(0, 10);
  const fechas: string[] = [];
  const cursor = new Date(`${inicio}T12:00:00`);
  const finDate = new Date(`${fin}T12:00:00`);
  while (cursor <= finDate) {
    const iso = cursor.toISOString().slice(0, 10);
    if (iso <= limite) fechas.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return fechas;
}

export function rangoFechasPorSemanaDelMes(anioMes: string, semana: number): { inicio: string; fin: string } {
  const [anio, mes] = anioMes.split('-').map(Number);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const iniciosSemana = [1, 8, 15, 22, 29];
  const finesSemana = [7, 14, 21, 28];
  const idx = Math.min(Math.max(semana - 1, 0), 4);
  const inicioDia = iniciosSemana[idx];
  const finDia = semana === 5 ? ultimoDia : finesSemana[idx];
  const inicio = `${anioMes}-${String(Math.min(inicioDia, ultimoDia)).padStart(2, '0')}`;
  const fin = `${anioMes}-${String(Math.min(finDia, ultimoDia)).padStart(2, '0')}`;
  return { inicio, fin };
}

export function rangoFechasPorMes(anioMes: string): { inicio: string; fin: string } {
  const [anio, mes] = anioMes.split('-').map(Number);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  return {
    inicio: `${anioMes}-01`,
    fin: `${anioMes}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

export function mesesCalendarioEnAnio(anio: number, hoyIso: string): string[] {
  const anioHoy = Number(hoyIso.slice(0, 4));
  const mesMax = anioHoy === anio ? Number(hoyIso.slice(5, 7)) : 12;
  return Array.from({ length: mesMax }, (_, i) => `${anio}-${String(i + 1).padStart(2, '0')}`);
}

export function nombreArchivoFechaDia(fechaIso: string): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  const mes = MESES_ES[(m ?? 1) - 1] ?? 'enero';
  return `${String(d).padStart(2, '0')}_${mes}_${y}`;
}

export function nombreArchivoSemana(anioMes: string, semanaDelMes: number): string {
  const [anio, mesStr] = anioMes.split('-').map(Number);
  const mes = MESES_ES[(mesStr ?? 1) - 1] ?? 'enero';
  const ordinal = SEMANAS_ORDINAL_ES[Math.min(semanaDelMes - 1, 4)] ?? 'quinta';
  return `${ordinal}_semana_${mes}_${anio}`;
}

export function nombreArchivoMes(anioMes: string): string {
  const [anio, mesStr] = anioMes.split('-').map(Number);
  const mes = MESES_ES[(mesStr ?? 1) - 1] ?? 'enero';
  return `mes_${mes}_${anio}`;
}

export function nombreArchivoAnio(anio: number): string {
  return `anio_${anio}`;
}

function argbColorBadgeExcel(badgeColor: BadgeColorAsistencia | undefined): string {
  if (badgeColor === 'green') return 'FF15803D';
  if (badgeColor === 'yellow') return 'FF92400E';
  return 'FF6B7280';
}

function intervaloSolapadoIngresoSalida(
  ingreso: Date,
  salida: Date,
  inicioSesion: Date,
  finSesion: Date,
): { desde: Date; hasta: Date } {
  return {
    desde: new Date(Math.max(ingreso.getTime(), inicioSesion.getTime())),
    hasta: new Date(Math.min(salida.getTime(), finSesion.getTime())),
  };
}

function minutosEfectivosYTardePorRegistro(
  aa: AsistenciaAprendizResponse,
  inicioSesion: Date,
  finSesion: Date,
): { efectivos: number; tarde: number } {
  const parseHora = (iso?: string | null) => (iso ? new Date(iso) : null);
  const diffMinutos = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
  const ingreso = parseHora(aa.hora_ingreso);
  const salida = parseHora(aa.hora_salida);
  if (!ingreso || !salida) return { efectivos: 0, tarde: 0 };
  const { desde, hasta } = intervaloSolapadoIngresoSalida(ingreso, salida, inicioSesion, finSesion);
  const efectivos = hasta > desde ? diffMinutos(desde, hasta) : 0;
  const limiteTarde = new Date(inicioSesion.getTime() + TOLERANCIA_MINUTOS_TARDE * 60000);
  const tarde = ingreso > limiteTarde ? diffMinutos(limiteTarde, ingreso) : 0;
  return { efectivos, tarde };
}

function calcularMinutosSesionYAsistencia(
  sesionesDia: AsistenciaResponse[],
  registros: AsistenciaAprendizResponse[],
): { minutosSesion: number; minutosEfectivos: number; minutosTarde: number } {
  const diffMinutos = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
  let minutosSesion = 0;
  let minutosEfectivos = 0;
  let minutosTarde = 0;

  for (const sesion of sesionesDia) {
    const inicioSesion = sesion.hora_inicio ? new Date(sesion.hora_inicio) : null;
    const finSesion = sesion.hora_fin ? new Date(sesion.hora_fin) : null;
    if (!inicioSesion || !finSesion) continue;
    minutosSesion += diffMinutos(inicioSesion, finSesion);
    for (const aa of registros.filter((r) => r.asistencia_id === sesion.id)) {
      const { efectivos, tarde } = minutosEfectivosYTardePorRegistro(aa, inicioSesion, finSesion);
      minutosEfectivos += efectivos;
      minutosTarde += tarde;
    }
  }
  return { minutosSesion, minutosEfectivos, minutosTarde };
}

function badgeAsistenciaDesdeRegistros(
  registrosAprendiz: AsistenciaAprendizResponse[],
  sesionesDelDia: AsistenciaResponse[],
): { badgeText: string; badgeColor: BadgeColorAsistencia } {
  const { minutosSesion, minutosEfectivos, minutosTarde } = calcularMinutosSesionYAsistencia(
    sesionesDelDia,
    registrosAprendiz,
  );
  const ratio = minutosSesion > 0 ? minutosEfectivos / minutosSesion : 0;
  if (registrosAprendiz.length > 0 && minutosEfectivos > 0) {
    if (ratio >= UMBRAL_POCAS_HORAS && minutosTarde === 0) {
      return { badgeText: 'Sí', badgeColor: 'green' };
    }
    return { badgeText: ratio > 0 ? 'Pocas horas' : 'Tarde', badgeColor: 'yellow' };
  }
  return { badgeText: 'No', badgeColor: 'gray' };
}

async function construirMatrizAsistencia(
  fichaId: number,
  inicio: string,
  fin: string,
  hoyIso: string,
): Promise<{
  aprendicesActivos: AprendizResponse[];
  fechasEnRango: string[];
  asistenciaPorAprendizYFecha: Map<number, Map<string, { badgeText: string; badgeColor: BadgeColorAsistencia }>>;
}> {
  const aprendicesRes = await apiService.getFichaAprendices(fichaId);
  const aprendicesActivos = aprendicesRes.filter((a) => a.estado);
  const fechas = fechasEnRango(inicio, fin, hoyIso);
  if (fechas.length === 0) {
    return { aprendicesActivos, fechasEnRango: fechas, asistenciaPorAprendizYFecha: new Map() };
  }

  const sesionesRes = await apiService.getAsistenciasByFichaAndFechas(fichaId, inicio, fin);
  const sesionesPorFecha = new Map<string, AsistenciaResponse[]>();
  for (const sesion of sesionesRes) {
    const fechaStr = sesion.fecha.slice(0, 10);
    const lista = sesionesPorFecha.get(fechaStr);
    if (lista) lista.push(sesion);
    else sesionesPorFecha.set(fechaStr, [sesion]);
  }

  const asistenciaPorAprendizYFecha = new Map<
    number,
    Map<string, { badgeText: string; badgeColor: BadgeColorAsistencia }>
  >();

  for (const fechaStr of fechas) {
    const sesionesDelDia = sesionesPorFecha.get(fechaStr) ?? [];
    const registrosDia: AsistenciaAprendizResponse[] = [];
    for (const sesion of sesionesDelDia) {
      registrosDia.push(...(await apiService.getAsistenciaAprendices(sesion.id)));
    }
    for (const ap of aprendicesActivos) {
      const registrosAprendiz = registrosDia.filter((aa) => aa.aprendiz_id === ap.id);
      const badge = badgeAsistenciaDesdeRegistros(registrosAprendiz, sesionesDelDia);
      const porFecha = asistenciaPorAprendizYFecha.get(ap.id) ?? new Map();
      porFecha.set(fechaStr, badge);
      asistenciaPorAprendizYFecha.set(ap.id, porFecha);
    }
  }

  return { aprendicesActivos, fechasEnRango: fechas, asistenciaPorAprendizYFecha };
}

function agregarHojaMatriz(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  aprendicesActivos: AprendizResponse[],
  fechas: string[],
  asistenciaPorAprendizYFecha: Map<number, Map<string, { badgeText: string; badgeColor: BadgeColorAsistencia }>>,
): void {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [{ width: 20 }, { width: 40 }, ...fechas.map(() => ({ width: 12 }))];
  const headerRow = sheet.addRow(['Documento', 'Nombre', ...fechas.map((f) => formatoFechaColumna(f))]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  aprendicesActivos.forEach((ap, index) => {
    const porFecha = asistenciaPorAprendizYFecha.get(ap.id);
    const row = sheet.addRow([
      ap.persona_documento ?? '',
      ap.persona_nombre ?? '',
      ...fechas.map((fechaStr) => porFecha?.get(fechaStr)?.badgeText ?? 'No'),
    ]);
    const isPar = index % 2 === 0;
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPar ? 'FFF8FAFC' : 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      if (colNumber >= 3) {
        const info = porFecha?.get(fechas[colNumber - 3]);
        cell.font = { color: { argb: argbColorBadgeExcel(info?.badgeColor) } };
      }
    });
  });
}

async function descargarWorkbook(workbook: ExcelJS.Workbook, nombreArchivo: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportarExcelDetalleDia(
  filas: FilaHistorialExport[],
  fechaIso: string,
  codigoFicha: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Asistencia', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [{ width: 20 }, { width: 40 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 55 }];
  const headerRow = sheet.addRow(['Documento', 'Nombre', '¿Asistió?', 'Hora ingreso', 'Hora salida', 'Observaciones']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  filas.forEach((f, index) => {
    const row = sheet.addRow([
      f.aprendiz.persona_documento ?? '',
      f.aprendiz.persona_nombre ?? '',
      f.asistio ? 'Sí' : 'No',
      f.horaIngreso ?? '',
      f.horaSalida ?? '',
      f.observaciones ?? '',
    ]);
    const isPar = index % 2 === 0;
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPar ? 'FFF8FAFC' : 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', wrapText: true };
    row.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      if (colNumber === 3) {
        cell.font = { color: { argb: f.asistio ? 'FF15803D' : 'FF6B7280' } };
      }
    });
  });

  await descargarWorkbook(workbook, `asistencia_${codigoFicha}_${nombreArchivoFechaDia(fechaIso)}.xlsx`);
}

export async function exportarExcelMatrizRango(
  fichaId: number,
  inicio: string,
  fin: string,
  codigoFicha: string,
  nombreArchivo: string,
  nombreHoja: string,
  hoyIso: string,
): Promise<void> {
  const { aprendicesActivos, fechasEnRango: fechas, asistenciaPorAprendizYFecha } = await construirMatrizAsistencia(
    fichaId,
    inicio,
    fin,
    hoyIso,
  );
  const workbook = new ExcelJS.Workbook();
  agregarHojaMatriz(workbook, nombreHoja, aprendicesActivos, fechas, asistenciaPorAprendizYFecha);
  await descargarWorkbook(workbook, `asistencia_${codigoFicha}_${nombreArchivo}.xlsx`);
}

export async function exportarExcelAnio(
  fichaId: number,
  anio: number,
  codigoFicha: string,
  hoyIso: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const meses = mesesCalendarioEnAnio(anio, hoyIso);

  for (const anioMes of meses) {
    const { inicio, fin } = rangoFechasPorMes(anioMes);
    const finAjustado = minIsoDateString(fin, hoyIso);
    const { aprendicesActivos, fechasEnRango: fechas, asistenciaPorAprendizYFecha } = await construirMatrizAsistencia(
      fichaId,
      inicio,
      finAjustado,
      hoyIso,
    );
    if (fechas.length === 0) continue;
    const [, mesStr] = anioMes.split('-');
    const mesNombre = MESES_ES[(Number(mesStr) || 1) - 1] ?? 'mes';
    agregarHojaMatriz(workbook, `${mesNombre}-${anio}`, aprendicesActivos, fechas, asistenciaPorAprendizYFecha);
  }

  if (workbook.worksheets.length === 0) {
    throw new Error('No hay fechas disponibles para exportar en el año seleccionado.');
  }

  await descargarWorkbook(workbook, `asistencia_${codigoFicha}_${nombreArchivoAnio(anio)}.xlsx`);
}

async function codigoFichaDesdeApi(fichaId: number): Promise<string> {
  try {
    return await apiService.getFichaCodigo(fichaId);
  } catch {
    return '';
  }
}

export async function obtenerCodigoFichaParaArchivo(
  fichaId: number,
  codigoDesdeFicha = '',
): Promise<string> {
  const codigo = codigoDesdeFicha || (await codigoFichaDesdeApi(fichaId));
  const saneado = codigo.replaceAll(/\s+/g, '_').replaceAll(/[^a-zA-Z0-9_-]/g, '');
  return saneado || 'ficha';
}
