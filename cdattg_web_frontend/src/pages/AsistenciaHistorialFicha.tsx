import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowDownTrayIcon, CalendarDaysIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type {
  FichaCaracterizacionResponse,
  AprendizResponse,
  AsistenciaResponse,
  AsistenciaAprendizResponse,
} from '../types';

type BadgeColorAsistencia = 'green' | 'yellow' | 'gray';

type FilaHistorial = {
  aprendiz: AprendizResponse;
  asistio: boolean;
  horaIngreso: string | null;
  horaSalida: string | null;
  observaciones: string;
  tiposObservacion: string[];
  estado?: string;
  badgeColor: BadgeColorAsistencia;
  badgeText: string;
};

const TOLERANCIA_MINUTOS_TARDE = 15;
const UMBRAL_POCAS_HORAS = 0.8;

/** Menor de dos fechas ISO YYYY-MM-DD (orden lexicográfico válido para ese formato). */
function minIsoDateString(a: string, b: string): string {
  return a <= b ? a : b;
}

function formatoFechaColumna(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
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

function mergeNombresTiposObservacion(
  prev: string[] | undefined,
  tipos: AsistenciaAprendizResponse['tipos_observacion'],
): string[] {
  const acc = new Set<string>(prev ?? []);
  for (const tipo of tipos ?? []) {
    if (tipo?.nombre) acc.add(tipo.nombre);
  }
  return Array.from(acc);
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

    const registrosSesion = registros.filter((aa) => aa.asistencia_id === sesion.id);
    for (const aa of registrosSesion) {
      const { efectivos, tarde } = minutosEfectivosYTardePorRegistro(aa, inicioSesion, finSesion);
      minutosEfectivos += efectivos;
      minutosTarde += tarde;
    }
  }

  return { minutosSesion, minutosEfectivos, minutosTarde };
}

const HISTORIAL_FECHA_INPUT_ID = 'asistencia-historial-ficha-fecha';
const MODAL_SEMANA_TITLE_ID = 'modal-semana-title';
const MODAL_MES_SEMANA_ID = 'modal-semana-mes';
const MODAL_SEMANA_SELECT_ID = 'modal-semana-numero';

function claseBadgeAsistencia(color: BadgeColorAsistencia): string {
  if (color === 'green') {
    return 'inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700 px-2 py-0.5 text-xs font-medium';
  }
  if (color === 'yellow') {
    return 'inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 px-2 py-0.5 text-xs font-medium';
  }
  return 'inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-2 py-0.5 text-xs font-medium';
}

/** Color de celda Excel (ARGB) según badge de asistencia. */
function argbColorBadgeExcel(badgeColor: BadgeColorAsistencia | undefined): string {
  if (badgeColor === 'green') return 'FF15803D';
  if (badgeColor === 'yellow') return 'FF92400E';
  return 'FF6B7280';
}

export const AsistenciaHistorialFicha = () => {
  const { fichaId: fichaIdParam } = useParams<{ fichaId: string }>();
  const fichaId = fichaIdParam ? Number.parseInt(fichaIdParam, 10) : null;

  const [ficha, setFicha] = useState<FichaCaracterizacionResponse | null>(null);
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aprendices, setAprendices] = useState<AprendizResponse[]>([]);
  const [sesiones, setSesiones] = useState<AsistenciaResponse[]>([]);
  const [aprendicesPorSesion, setAprendicesPorSesion] = useState<Map<number, AsistenciaAprendizResponse[]>>(new Map());

  const [modalSemanaAbierto, setModalSemanaAbierto] = useState(false);
  const [mesSemana, setMesSemana] = useState(() => new Date().toISOString().slice(0, 7));
  const [semanaDelMes, setSemanaDelMes] = useState<number>(1);
  const [descargandoSemana, setDescargandoSemana] = useState(false);

  const fechaValida = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(fecha), [fecha]);

  useEffect(() => {
    if (!fichaId || !Number.isFinite(fichaId)) return;
    const loadFicha = async () => {
      try {
        const data = await apiService.getFichaCaracterizacionById(fichaId);
        setFicha(data);
      } catch {
        setFicha(null);
      }
    };
    loadFicha();
  }, [fichaId]);

  useEffect(() => {
    if (!fichaId || !Number.isFinite(fichaId) || !fechaValida) {
      setAprendices([]);
      setSesiones([]);
      setAprendicesPorSesion(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const [aprendicesRes, sesionesRes] = await Promise.all([
          apiService.getFichaAprendices(fichaId),
          apiService.getAsistenciasByFichaAndFechas(fichaId, fecha, fecha),
        ]);

        if (cancelled) return;
        setAprendices(aprendicesRes.filter((a) => a.estado));
        setSesiones(sesionesRes);

        const map = new Map<number, AsistenciaAprendizResponse[]>();
        await Promise.all(
          sesionesRes.map(async (sesion) => {
            const list = await apiService.getAsistenciaAprendices(sesion.id);
            if (!cancelled) map.set(sesion.id, list);
          })
        );
        if (!cancelled) setAprendicesPorSesion(map);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(axiosErrorMessage(e, 'Error al cargar el historial.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fichaId, fecha, fechaValida]);

  const filas: FilaHistorial[] = useMemo(() => {
    type Reg = {
      horaIngreso: string | null;
      horaSalida: string | null;
      observaciones: string;
      tiposObservacion: string[];
      estado?: string;
      hasIngreso: boolean;
      minutosSesion: number;
      minutosEfectivos: number;
      minutosTarde: number;
    };
    const byAprendizId = new Map<number, Reg>();

    const parseHora = (iso?: string | null) => (iso ? new Date(iso) : null);

    const diffMinutos = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));

    const obtenerSesionPorId = (id: number): AsistenciaResponse | undefined =>
      sesiones.find((s) => s.id === id);

    aprendicesPorSesion.forEach((list, asistenciaId) => {
      const sesion = obtenerSesionPorId(asistenciaId);
      const inicioSesion = sesion?.hora_inicio ? new Date(sesion.hora_inicio) : null;
      const finSesion = sesion?.hora_fin ? new Date(sesion.hora_fin) : null;

      list.forEach((aa) => {
        const ingresoDate = parseHora(aa.hora_ingreso);
        const salidaDate = parseHora(aa.hora_salida);

        const ing = ingresoDate
          ? ingresoDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          : null;
        const sal = salidaDate
          ? salidaDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          : null;

        const hasIngreso = !!ingresoDate;

        let minutosSesion = 0;
        let minutosEfectivos = 0;
        let minutosTarde = 0;

        if (inicioSesion && finSesion && ingresoDate && salidaDate) {
          const { desde, hasta } = intervaloSolapadoIngresoSalida(
            ingresoDate,
            salidaDate,
            inicioSesion,
            finSesion,
          );
          if (hasta > desde) {
            minutosSesion = diffMinutos(inicioSesion, finSesion);
            minutosEfectivos = diffMinutos(desde, hasta);
          }

          const limiteTarde = new Date(inicioSesion.getTime() + TOLERANCIA_MINUTOS_TARDE * 60000);
          if (ingresoDate > limiteTarde) {
            minutosTarde = diffMinutos(limiteTarde, ingresoDate);
          }
        }

        const existing = byAprendizId.get(aa.aprendiz_id);
        const acumuladoSesion = existing?.minutosSesion ?? 0;
        const acumuladoEfectivos = existing?.minutosEfectivos ?? 0;
        const acumuladoTarde = existing?.minutosTarde ?? 0;

        const reg: Reg = {
          horaIngreso: ing ?? existing?.horaIngreso ?? null,
          horaSalida: sal ?? existing?.horaSalida ?? null,
          observaciones: existing ? `${existing.observaciones} ${aa.observaciones ?? ''}`.trim() : aa.observaciones ?? '',
          tiposObservacion: mergeNombresTiposObservacion(existing?.tiposObservacion, aa.tipos_observacion),
          estado: aa.estado || existing?.estado,
          hasIngreso: existing ? existing.hasIngreso || hasIngreso : hasIngreso,
          minutosSesion: acumuladoSesion + minutosSesion,
          minutosEfectivos: acumuladoEfectivos + minutosEfectivos,
          minutosTarde: acumuladoTarde + minutosTarde,
        };
        byAprendizId.set(aa.aprendiz_id, reg);
      });
    });

    return aprendices.map((ap) => {
      const reg = byAprendizId.get(ap.id);
      const minutosSesion = reg?.minutosSesion ?? 0;
      const minutosEfectivos = reg?.minutosEfectivos ?? 0;
      const minutosTarde = reg?.minutosTarde ?? 0;
      const ratio = minutosSesion > 0 ? minutosEfectivos / minutosSesion : 0;

      let badgeColor: BadgeColorAsistencia = 'gray';
      let badgeText = 'No';

      if (reg?.hasIngreso) {
        if (ratio >= UMBRAL_POCAS_HORAS && minutosTarde === 0) {
          badgeColor = 'green';
          badgeText = 'Sí';
        } else {
          badgeColor = 'yellow';
          badgeText = ratio > 0 ? 'Pocas horas' : 'Tarde';
        }
      }

      return {
        aprendiz: ap,
        asistio: reg?.hasIngreso ?? false,
        horaIngreso: reg?.horaIngreso ?? null,
        horaSalida: reg?.horaSalida ?? null,
        observaciones: reg?.observaciones ?? '',
        tiposObservacion: reg?.tiposObservacion ?? [],
        estado: reg?.estado,
        badgeColor,
        badgeText,
      };
    });
  }, [aprendices, aprendicesPorSesion, sesiones]);

  const fechaMaxHoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const sesionesConObservaciones = useMemo(
    () => sesiones.filter((s) => (s.observaciones ?? '').trim().length > 0),
    [sesiones]
  );

  const moverFecha = (dias: number) => {
    const base = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + dias);
    const nueva = base.toISOString().slice(0, 10);
    setFecha(minIsoDateString(nueva, fechaMaxHoy));
  };

  const descargarExcel = async () => {
    try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia', { views: [{ state: 'frozen', ySplit: 1 }] });

    // Anchos de columna (más anchas para que se vean bien)
    sheet.columns = [
      { width: 20 }, // Documento
      { width: 40 }, // Nombre
      { width: 12 }, // ¿Asistió?
      { width: 14 }, // Hora ingreso
      { width: 14 }, // Hora salida
      { width: 55 }, // Observaciones
    ];

    // Fila de encabezados con color y negrita
    const headerRow = sheet.addRow(['Documento', 'Nombre', '¿Asistió?', 'Hora ingreso', 'Hora salida', 'Observaciones']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Filas de datos con colores alternados y bordes
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
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isPar ? 'FFF8FAFC' : 'FFFFFFFF' },
      };
      row.alignment = { vertical: 'middle', wrapText: true };
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber === 3) {
          cell.font = { color: { argb: f.asistio ? 'FF15803D' : 'FF6B7280' } };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const codigo = await obtenerCodigoParaArchivo();
    a.download = `asistencia_${codigo}_${nombreArchivoFechaDia(fecha)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al generar el Excel.'));
    }
  };

  const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const SEMANAS_ORDINAL_ES = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta'];

  async function obtenerCodigoParaArchivo(): Promise<string> {
    let codigo = ficha?.ficha ?? '';
    if (!codigo && fichaId != null && Number.isFinite(fichaId)) {
      try {
        codigo = await apiService.getFichaCodigo(fichaId);
      } catch {
        codigo = '';
      }
    }
    const saneado = codigo.replaceAll(/\s+/g, '_').replaceAll(/[^a-zA-Z0-9_-]/g, '');
    return saneado || 'ficha';
  }

  function nombreArchivoFechaDia(fechaIso: string): string {
    const [y, m, d] = fechaIso.split('-').map(Number);
    const mes = MESES_ES[(m ?? 1) - 1] ?? 'enero';
    return `${String(d).padStart(2, '0')}_${mes}_${y}`;
  }

  function nombreArchivoSemana(anioMes: string, semanaDelMes: number): string {
    const [anio, mesStr] = anioMes.split('-').map(Number);
    const mes = MESES_ES[(mesStr ?? 1) - 1] ?? 'enero';
    const ordinal = SEMANAS_ORDINAL_ES[Math.min(semanaDelMes - 1, 4)] ?? 'quinta';
    return `${ordinal}_semana_${mes}_${anio}`;
  }

  function rangoFechasPorSemanaDelMes(anioMes: string, semana: number): { inicio: string; fin: string } {
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

  const descargarExcelSemana = async () => {
    if (!fichaId || !Number.isFinite(fichaId)) return;
    const { inicio, fin } = rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes);
    const hoyStr = new Date().toISOString().slice(0, 10);
    if (inicio > hoyStr) {
      return;
    }
    setDescargandoSemana(true);
    try {
      const aprendicesRes = await apiService.getFichaAprendices(fichaId);
      const aprendicesActivos = aprendicesRes.filter((a) => a.estado);
      const sesionesRes = await apiService.getAsistenciasByFichaAndFechas(fichaId, inicio, fin);
      const sesionesPorFecha = new Map<string, AsistenciaResponse[]>();
      sesionesRes.forEach((s) => {
        const fechaStr = s.fecha.slice(0, 10);
        if (!sesionesPorFecha.has(fechaStr)) sesionesPorFecha.set(fechaStr, []);
        sesionesPorFecha.get(fechaStr)!.push(s);
      });
      const fechasEnRango: string[] = [];
      const d = new Date(inicio);
      const finDate = new Date(fin);
      while (d <= finDate) {
        const ds = d.toISOString().slice(0, 10);
        if (ds <= hoyStr) fechasEnRango.push(ds);
        d.setDate(d.getDate() + 1);
      }
      const asistenciaPorAprendizYFecha = new Map<number, Map<string, { badgeText: string; badgeColor: BadgeColorAsistencia }>>();
      for (const fechaStr of fechasEnRango) {
        const sesionesDelDia = sesionesPorFecha.get(fechaStr) ?? [];
        const registrosDia: AsistenciaAprendizResponse[] = [];
        for (const sesion of sesionesDelDia) {
          const list = await apiService.getAsistenciaAprendices(sesion.id);
          registrosDia.push(...list);
        }
        aprendicesActivos.forEach((ap) => {
          const registrosAprendiz = registrosDia.filter((aa) => aa.aprendiz_id === ap.id);
          const { minutosSesion, minutosEfectivos, minutosTarde } = calcularMinutosSesionYAsistencia(
            sesionesDelDia,
            registrosAprendiz,
          );
          const ratio = minutosSesion > 0 ? minutosEfectivos / minutosSesion : 0;
          let badgeColor: BadgeColorAsistencia = 'gray';
          let badgeText = 'No';
          if (registrosAprendiz.length > 0 && minutosEfectivos > 0) {
            if (ratio >= UMBRAL_POCAS_HORAS && minutosTarde === 0) {
              badgeColor = 'green';
              badgeText = 'Sí';
            } else {
              badgeColor = 'yellow';
              badgeText = ratio > 0 ? 'Pocas horas' : 'Tarde';
            }
          }
          if (!asistenciaPorAprendizYFecha.has(ap.id)) {
            asistenciaPorAprendizYFecha.set(ap.id, new Map());
          }
          asistenciaPorAprendizYFecha.get(ap.id)!.set(fechaStr, { badgeText, badgeColor });
        });
      }
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Asistencia por semana', { views: [{ state: 'frozen', ySplit: 1 }] });
      sheet.columns = [
        { width: 20 },
        { width: 40 },
        ...fechasEnRango.map(() => ({ width: 12 })),
      ];
      const headerCells = ['Documento', 'Nombre', ...fechasEnRango.map((f) => formatoFechaColumna(f))];
      const headerRow = sheet.addRow(headerCells);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      aprendicesActivos.forEach((ap, index) => {
        const porFecha = asistenciaPorAprendizYFecha.get(ap.id);
        const cells = [
          ap.persona_documento ?? '',
          ap.persona_nombre ?? '',
          ...fechasEnRango.map((fechaStr) => porFecha?.get(fechaStr)?.badgeText ?? 'No'),
        ];
        const row = sheet.addRow(cells);
        const isPar = index % 2 === 0;
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPar ? 'FFF8FAFC' : 'FFFFFFFF' } };
        row.alignment = { vertical: 'middle', wrapText: true };
        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (colNumber >= 3) {
            const info = porFecha?.get(fechasEnRango[colNumber - 3]);
            cell.font = { color: { argb: argbColorBadgeExcel(info?.badgeColor) } };
          }
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const codigo = await obtenerCodigoParaArchivo();
      a.download = `asistencia_${codigo}_${nombreArchivoSemana(mesSemana, semanaDelMes)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setModalSemanaAbierto(false);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al generar el Excel semanal.'));
    } finally {
      setDescargandoSemana(false);
    }
  };

  if (fichaId == null || !Number.isFinite(fichaId)) {
    return (
      <div className="space-y-4">
        <Link to="/asistencia/historial" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <ArrowLeftIcon className="w-5 h-5" aria-hidden />
          Volver al historial
        </Link>
        <p className="text-gray-600 dark:text-gray-400">Ficha no válida.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/asistencia/historial"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
            Volver al historial
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial — Ficha {ficha?.ficha ?? fichaId}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Aprendices que asistieron o no en la fecha seleccionada.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor={HISTORIAL_FECHA_INPUT_ID} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha:
          </label>
          <button
            type="button"
            onClick={() => moverFecha(-1)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Día anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" aria-hidden />
          </button>
          <input
            id={HISTORIAL_FECHA_INPUT_ID}
            type="date"
            value={fecha}
            max={fechaMaxHoy}
            onChange={(e) => {
              const v = e.target.value;
              setFecha(minIsoDateString(v, fechaMaxHoy));
            }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => moverFecha(1)}
            disabled={fecha >= fechaMaxHoy}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            aria-label="Día siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" aria-hidden />
          </button>
        </div>
        {!loading && (
          <>
            {filas.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  void descargarExcel();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="w-5 h-5" aria-hidden />
                Descargar Excel
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalSemanaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <CalendarDaysIcon className="w-5 h-5" aria-hidden />
              Descargar por semana
            </button>
          </>
        )}
      </div>

      {!loading && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Observaciones de sesiones del día</h2>
          {sesiones.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hubo sesiones de asistencia registradas para esta fecha.
            </p>
          ) : sesionesConObservaciones.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Las sesiones registradas este día no tienen observaciones.
            </p>
          ) : (
            <ul className="space-y-2">
              {sesionesConObservaciones.map((sesion) => (
                <li key={sesion.id} className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2">
                  <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Sesión #{sesion.id}
                    {sesion.hora_inicio
                      ? ` · ${new Date(sesion.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{sesion.observaciones}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modalSemanaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar diálogo"
            onClick={() => !descargandoSemana && setModalSemanaAbierto(false)}
          />
          <dialog
            open
            className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-xl"
            aria-labelledby={MODAL_SEMANA_TITLE_ID}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id={MODAL_SEMANA_TITLE_ID} className="text-lg font-semibold text-gray-900 dark:text-white">
                Descargar asistencia por semana del mes
              </h2>
              <button
                type="button"
                onClick={() => !descargandoSemana && setModalSemanaAbierto(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cerrar"
              >
                <XMarkIcon className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Elija el mes y la semana. Se generará un Excel con todos los días de esa semana (solo hasta la fecha actual).
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor={MODAL_MES_SEMANA_ID} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mes
                </label>
                <input
                  id={MODAL_MES_SEMANA_ID}
                  type="month"
                  value={mesSemana}
                  max={new Date().toISOString().slice(0, 7)}
                  onChange={(e) => setMesSemana(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor={MODAL_SEMANA_SELECT_ID} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semana del mes
                </label>
                <select
                  id={MODAL_SEMANA_SELECT_ID}
                  value={semanaDelMes}
                  onChange={(e) => setSemanaDelMes(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                >
                  <option value={1}>Semana 1 (días 1-7)</option>
                  <option value={2}>Semana 2 (días 8-14)</option>
                  <option value={3}>Semana 3 (días 15-21)</option>
                  <option value={4}>Semana 4 (días 22-28)</option>
                  <option value={5}>Semana 5 (días 29-fin)</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rango: {rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).inicio} al{' '}
                {rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).fin}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalSemanaAbierto(false)}
                disabled={descargandoSemana}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  void descargarExcelSemana();
                }}
                disabled={
                  descargandoSemana ||
                  rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).inicio > new Date().toISOString().slice(0, 10)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {descargandoSemana ? 'Generando…' : 'Descargar Excel'}
              </button>
            </div>
          </dialog>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando…
        </div>
      )}
      {!loading && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Asistencia del día por aprendiz para la ficha seleccionada
              </caption>
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Documento
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Nombre
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    ¿Asistió?
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Hora ingreso
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Hora salida
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-gray-200 dark:border-gray-600 px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                      No hay aprendices en la ficha o no se pudo cargar el listado.
                    </td>
                  </tr>
                ) : (
                  filas.map((fila) => (
                    <tr
                      key={fila.aprendiz.id}
                      className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.aprendiz.persona_documento ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.aprendiz.persona_nombre ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        <span className={claseBadgeAsistencia(fila.badgeColor)}>{fila.badgeText}</span>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.horaIngreso ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.horaSalida ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={fila.observaciones || undefined}>
                        <div className="space-y-1">
                          {fila.tiposObservacion.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {fila.tiposObservacion.map((tipo) => (
                                <span
                                  key={tipo}
                                  className="inline-flex items-center rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                                >
                                  {tipo}
                                </span>
                              ))}
                            </div>
                          )}
                          <span>{fila.observaciones || (fila.tiposObservacion.length === 0 ? '–' : '')}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
