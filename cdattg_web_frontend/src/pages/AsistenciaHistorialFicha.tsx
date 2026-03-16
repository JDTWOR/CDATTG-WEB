import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowDownTrayIcon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { apiService } from '../services/api';
import type {
  FichaCaracterizacionResponse,
  AprendizResponse,
  AsistenciaResponse,
  AsistenciaAprendizResponse,
} from '../types';

type FilaHistorial = {
  aprendiz: AprendizResponse;
  asistio: boolean;
  horaIngreso: string | null;
  horaSalida: string | null;
  observaciones: string;
  estado?: string;
  badgeColor: 'green' | 'yellow' | 'gray';
  badgeText: string;
};

export const AsistenciaHistorialFicha = () => {
  const { fichaId: fichaIdParam } = useParams<{ fichaId: string }>();
  const fichaId = fichaIdParam ? parseInt(fichaIdParam, 10) : null;

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
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cargar el historial.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fichaId, fecha, fechaValida]);

  const TOLERANCIA_MINUTOS_TARDE = 15;
  const UMBRAL_POCAS_HORAS = 0.8; // 80 % de la sesión

  const filas: FilaHistorial[] = useMemo(() => {
    type Reg = {
      horaIngreso: string | null;
      horaSalida: string | null;
      observaciones: string;
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
          const inicio = inicioSesion;
          const fin = finSesion;
          const desde = ingresoDate > inicio ? ingresoDate : inicio;
          const hasta = salidaDate < fin ? salidaDate : fin;
          if (hasta > desde) {
            minutosSesion = diffMinutos(inicio, fin);
            minutosEfectivos = diffMinutos(desde, hasta);
          }

          const limiteTarde = new Date(inicio.getTime() + TOLERANCIA_MINUTOS_TARDE * 60000);
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

      let badgeColor: 'green' | 'yellow' | 'gray' = 'gray';
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
        estado: reg?.estado,
        badgeColor,
        badgeText,
      };
    });
  }, [aprendices, aprendicesPorSesion, sesiones]);

  const fechaMaxHoy = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const descargarExcel = async () => {
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
    const saneado = codigo.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
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
    const inicioDia = semana === 1 ? 1 : semana === 2 ? 8 : semana === 3 ? 15 : semana === 4 ? 22 : 29;
    const finDia = semana === 1 ? 7 : semana === 2 ? 14 : semana === 3 ? 21 : semana === 4 ? 28 : ultimoDia;
    const inicio = `${anioMes}-${String(Math.min(inicioDia, ultimoDia)).padStart(2, '0')}`;
    const fin = `${anioMes}-${String(Math.min(finDia, ultimoDia)).padStart(2, '0')}`;
    return { inicio, fin };
  }

  function formatoFechaColumna(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function calcularMinutosSesionYAsistencia(
    sesionesDia: AsistenciaResponse[],
    registros: AsistenciaAprendizResponse[],
  ): { minutosSesion: number; minutosEfectivos: number; minutosTarde: number } {
    const parseHora = (iso?: string | null) => (iso ? new Date(iso) : null);
    const diffMinutos = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));

    let minutosSesion = 0;
    let minutosEfectivos = 0;
    let minutosTarde = 0;

    sesionesDia.forEach((sesion) => {
      const inicioSesion = sesion.hora_inicio ? new Date(sesion.hora_inicio) : null;
      const finSesion = sesion.hora_fin ? new Date(sesion.hora_fin) : null;
      if (!inicioSesion || !finSesion) return;

      minutosSesion += diffMinutos(inicioSesion, finSesion);

      registros
        .filter((aa) => aa.asistencia_id === sesion.id)
        .forEach((aa) => {
          const ingreso = parseHora(aa.hora_ingreso);
          const salida = parseHora(aa.hora_salida);
          if (!ingreso || !salida) return;
          const desde = ingreso > inicioSesion ? ingreso : inicioSesion;
          const hasta = salida < finSesion ? salida : finSesion;
          if (hasta > desde) {
            minutosEfectivos += diffMinutos(desde, hasta);
          }
          const limiteTarde = new Date(inicioSesion.getTime() + TOLERANCIA_MINUTOS_TARDE * 60000);
          if (ingreso > limiteTarde) {
            minutosTarde += diffMinutos(limiteTarde, ingreso);
          }
        });
    });

    return { minutosSesion, minutosEfectivos, minutosTarde };
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
      let d = new Date(inicio);
      const finDate = new Date(fin);
      while (d <= finDate) {
        const ds = d.toISOString().slice(0, 10);
        if (ds <= hoyStr) fechasEnRango.push(ds);
        d.setDate(d.getDate() + 1);
      }
      const asistenciaPorAprendizYFecha = new Map<number, Map<string, { badgeText: string; badgeColor: 'green' | 'yellow' | 'gray' }>>();
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
          let badgeColor: 'green' | 'yellow' | 'gray' = 'gray';
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
            const color =
              info?.badgeColor === 'green'
                ? 'FF15803D'
                : info?.badgeColor === 'yellow'
                ? 'FF92400E'
                : 'FF6B7280';
            cell.font = { color: { argb: color } };
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
    } finally {
      setDescargandoSemana(false);
    }
  };

  if (fichaId == null || !Number.isFinite(fichaId)) {
    return (
      <div className="space-y-4">
        <Link to="/asistencia/historial" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <ArrowLeftIcon className="w-5 h-5" />
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
            <ArrowLeftIcon className="w-5 h-5" />
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
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha:</span>
          <input
            type="date"
            value={fecha}
            max={fechaMaxHoy}
            onChange={(e) => {
              const v = e.target.value;
              setFecha(v > fechaMaxHoy ? fechaMaxHoy : v);
            }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
          />
        </label>
        {!loading && (
          <>
            {filas.length > 0 && (
              <button
                type="button"
                onClick={descargarExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Descargar Excel
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalSemanaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Descargar por semana
            </button>
          </>
        )}
      </div>

      {/* Modal selección semana del mes */}
      {modalSemanaAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-semana-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="modal-semana-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Descargar asistencia por semana del mes
              </h2>
              <button
                type="button"
                onClick={() => !descargandoSemana && setModalSemanaAbierto(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cerrar"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Elija el mes y la semana. Se generará un Excel con todos los días de esa semana (solo hasta la fecha actual).
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes</span>
                <input
                  type="month"
                  value={mesSemana}
                  max={new Date().toISOString().slice(0, 7)}
                  onChange={(e) => setMesSemana(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semana del mes</span>
                <select
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
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rango: {rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).inicio} al {rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).fin}
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
                onClick={descargarExcelSemana}
                disabled={descargandoSemana || rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).inicio > new Date().toISOString().slice(0, 10)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {descargandoSemana ? 'Generando…' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando…</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
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
                        <span
                          className={
                            fila.badgeColor === 'green'
                              ? 'inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700 px-2 py-0.5 text-xs font-medium'
                              : fila.badgeColor === 'yellow'
                              ? 'inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 px-2 py-0.5 text-xs font-medium'
                              : 'inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-2 py-0.5 text-xs font-medium'
                          }
                        >
                          {fila.badgeText}
                        </span>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.horaIngreso ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        {fila.horaSalida ?? '–'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={fila.observaciones || undefined}>
                        {fila.observaciones || '–'}
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
