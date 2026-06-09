import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useBreadcrumbOverride } from '../navigation/breadcrumb';
import { asistenciaPaths, fichasPaths } from '../routes/paths';
import { ArrowLeftIcon, ArrowDownTrayIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { FichaCaracterizacionCard } from '../components/FichaCaracterizacionCard';
import {
  exportarExcelAnio,
  exportarExcelDetalleDia,
  exportarExcelMatrizRango,
  minIsoDateString,
  nombreArchivoMes,
  nombreArchivoSemana,
  obtenerCodigoFichaParaArchivo,
  rangoFechasPorMes,
  rangoFechasPorSemanaDelMes,
  type TipoExportHistorial,
} from './asistencia/asistenciaHistorialExport';
import type {
  FichaCaracterizacionResponse,
  AprendizResponse,
  AsistenciaResponse,
  AsistenciaAprendizResponse,
  TipoObservacionAsistenciaItem,
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

const TOLERANCIA_MINUTOS_TARDE = 60;
const UMBRAL_POCAS_HORAS = 0.8;

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

const HISTORIAL_FECHA_INPUT_ID = 'asistencia-historial-ficha-fecha';
const MODAL_EXPORT_TITLE_ID = 'modal-export-historial-title';
const MODAL_EXPORT_TIPO_ID = 'modal-export-historial-tipo';
const MODAL_MES_SEMANA_ID = 'modal-export-mes-semana';
const MODAL_SEMANA_SELECT_ID = 'modal-export-semana-numero';
const MODAL_EXPORT_MES_ID = 'modal-export-mes';
const MODAL_EXPORT_ANIO_ID = 'modal-export-anio';
const HISTORIAL_MODAL_TIPO_OBS_ID = 'historial-modal-tipo-observacion';
const HISTORIAL_MODAL_OBS_ID = 'historial-modal-observacion';
const PLAZO_EDICION_OBSERVACION_DIAS = 5;

function claseBadgeAsistencia(color: BadgeColorAsistencia): string {
  if (color === 'green') {
    return 'inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700 px-2 py-0.5 text-xs font-medium';
  }
  if (color === 'yellow') {
    return 'inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 px-2 py-0.5 text-xs font-medium';
  }
  return 'inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-2 py-0.5 text-xs font-medium';
}

type ObservacionesModalState = {
  asistenciaId: number;
  aprendizId: number;
  nombre: string;
  observaciones: string;
  tipoObservacionIds: number[];
  editableHasta: string;
};

type ObservacionesSesionesDiaProps = Readonly<{
  sesiones: AsistenciaResponse[];
  sesionesConObservaciones: AsistenciaResponse[];
}>;

function ObservacionesSesionesDiaContenido({ sesiones, sesionesConObservaciones }: ObservacionesSesionesDiaProps) {
  if (sesiones.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No hubo sesiones de asistencia registradas para esta fecha.
      </p>
    );
  }
  if (sesionesConObservaciones.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Las sesiones registradas este día no tienen observaciones.
      </p>
    );
  }
  return (
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
  );
}

type TiposObservacionSeleccionadosProps = Readonly<{
  ids: number[];
  catalogo: TipoObservacionAsistenciaItem[];
  disabled: boolean;
  onQuitar: (tipoId: number) => void;
}>;

function TiposObservacionSeleccionados({ ids, catalogo, disabled, onQuitar }: TiposObservacionSeleccionadosProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {ids.map((id) => {
        const tipo = catalogo.find((t) => t.id === id);
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
          >
            {tipo?.nombre ?? id}
            <button
              type="button"
              onClick={() => onQuitar(id)}
              className="rounded px-1 hover:bg-gray-200 dark:hover:bg-gray-600"
              disabled={disabled}
              aria-label="Quitar tipo"
            >
              ×
            </button>
          </span>
        );
      })}
    </div>
  );
}

type HistorialObservacionesModalProps = Readonly<{
  modal: ObservacionesModalState;
  catalogo: TipoObservacionAsistenciaItem[];
  guardando: boolean;
  onCerrar: () => void;
  onGuardar: () => void;
  onChangeObservaciones: (texto: string) => void;
  onAgregarTipo: (tipoId: number) => void;
  onQuitarTipo: (tipoId: number) => void;
}>;

function HistorialObservacionesModal({
  modal,
  catalogo,
  guardando,
  onCerrar,
  onGuardar,
  onChangeObservaciones,
  onAgregarTipo,
  onQuitarTipo,
}: HistorialObservacionesModalProps) {
  const handleSelectTipo = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (!id || modal.tipoObservacionIds.includes(id)) return;
    e.target.value = '';
    onAgregarTipo(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar edición de observación"
        onClick={() => !guardando && onCerrar()}
      />
      <dialog
        open
        className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-6 shadow-xl"
        aria-labelledby="modal-observacion-title"
      >
        <h2 id="modal-observacion-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Observación — {modal.nombre}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Editable hasta: {modal.editableHasta}
        </p>
        <div className="mb-3">
          <label htmlFor={HISTORIAL_MODAL_TIPO_OBS_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipos de observación
          </label>
          <select
            id={HISTORIAL_MODAL_TIPO_OBS_ID}
            value=""
            onChange={handleSelectTipo}
            className="input-field w-full"
            disabled={guardando}
          >
            <option value="">Agregar tipo…</option>
            {catalogo
              .filter((t) => !modal.tipoObservacionIds.includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
          </select>
          {modal.tipoObservacionIds.length > 0 && (
            <TiposObservacionSeleccionados
              ids={modal.tipoObservacionIds}
              catalogo={catalogo}
              disabled={guardando}
              onQuitar={onQuitarTipo}
            />
          )}
        </div>
        <div className="mb-4">
          <label htmlFor={HISTORIAL_MODAL_OBS_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observación libre
          </label>
          <textarea
            id={HISTORIAL_MODAL_OBS_ID}
            value={modal.observaciones}
            onChange={(e) => onChangeObservaciones(e.target.value)}
            rows={4}
            className="input-field w-full resize-y"
            placeholder="Ej: Entregó excusa dentro del plazo de 5 días."
            disabled={guardando}
            maxLength={1000}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </dialog>
    </div>
  );
}

export const AsistenciaHistorialFicha = () => {
  const { pathname } = useLocation();
  const { setLabel, clearLabel } = useBreadcrumbOverride();
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

  const [modalExportAbierto, setModalExportAbierto] = useState(false);
  const [tipoExport, setTipoExport] = useState<TipoExportHistorial>('mes');
  const [mesSemana, setMesSemana] = useState(() => new Date().toISOString().slice(0, 7));
  const [semanaDelMes, setSemanaDelMes] = useState<number>(1);
  const [mesExport, setMesExport] = useState(() => new Date().toISOString().slice(0, 7));
  const [anioExport, setAnioExport] = useState(() => String(new Date().getFullYear()));
  const [descargandoExport, setDescargandoExport] = useState(false);
  const [tiposObservacionCatalogo, setTiposObservacionCatalogo] = useState<TipoObservacionAsistenciaItem[]>([]);
  const [observacionesModal, setObservacionesModal] = useState<ObservacionesModalState | null>(null);
  const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);

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
    const numero = ficha?.ficha?.trim();
    if (!numero) {
      clearLabel(pathname);
      return;
    }
    setLabel(pathname, `Ficha ${numero}`);
    return () => clearLabel(pathname);
  }, [ficha?.ficha, pathname, setLabel, clearLabel]);

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

  useEffect(() => {
    apiService.getTiposObservacionAsistencia()
      .then((data) => setTiposObservacionCatalogo(data))
      .catch(() => setTiposObservacionCatalogo([]));
  }, []);

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

  const editableHastaPorSesionId = useMemo(() => {
    const map = new Map<number, string>();
    for (const sesion of sesiones) {
      const base = new Date(`${sesion.fecha.slice(0, 10)}T00:00:00`);
      if (Number.isNaN(base.getTime())) continue;
      base.setDate(base.getDate() + PLAZO_EDICION_OBSERVACION_DIAS);
      map.set(sesion.id, base.toISOString().slice(0, 10));
    }
    return map;
  }, [sesiones]);

  const sesionEditablePorAprendizId = useMemo(() => {
    const map = new Map<number, {
      asistenciaId: number;
      observaciones: string;
      tipoObservacionIds: number[];
      editableHasta: string;
      puedeEditar: boolean;
    }>();
    const hoy = new Date().toISOString().slice(0, 10);
    const sesionesOrdenadas = [...sesiones].sort((a, b) => {
      const ta = a.hora_inicio ? new Date(a.hora_inicio).getTime() : a.id;
      const tb = b.hora_inicio ? new Date(b.hora_inicio).getTime() : b.id;
      return ta - tb;
    });
    const sesionBase = sesionesOrdenadas.at(-1);
    if (sesionBase) {
      const editableHastaBase = editableHastaPorSesionId.get(sesionBase.id);
      if (editableHastaBase) {
        const puedeEditarBase = hoy <= editableHastaBase;
        for (const aprendiz of aprendices) {
          map.set(aprendiz.id, {
            asistenciaId: sesionBase.id,
            observaciones: '',
            tipoObservacionIds: [],
            editableHasta: editableHastaBase,
            puedeEditar: puedeEditarBase,
          });
        }
      }
    }
    for (const sesion of sesionesOrdenadas) {
      const editableHasta = editableHastaPorSesionId.get(sesion.id);
      if (!editableHasta) continue;
      const puedeEditar = hoy <= editableHasta;
      const registros = aprendicesPorSesion.get(sesion.id) ?? [];
      for (const reg of registros) {
        map.set(reg.aprendiz_id, {
          asistenciaId: sesion.id,
          observaciones: reg.observaciones ?? '',
          tipoObservacionIds: (reg.tipos_observacion ?? []).map((t) => t.id),
          editableHasta,
          puedeEditar,
        });
      }
    }
    return map;
  }, [aprendices, aprendicesPorSesion, editableHastaPorSesionId, sesiones]);

  const abrirModalObservaciones = (aprendiz: AprendizResponse) => {
    const data = sesionEditablePorAprendizId.get(aprendiz.id);
    if (!data) return;
    if (!data.puedeEditar) {
      setError(`El plazo para actualizar observaciones de ${aprendiz.persona_nombre ?? 'este aprendiz'} venció el ${data.editableHasta}.`);
      return;
    }
    setObservacionesModal({
      asistenciaId: data.asistenciaId,
      aprendizId: aprendiz.id,
      nombre: aprendiz.persona_nombre ?? 'Aprendiz',
      observaciones: data.observaciones,
      tipoObservacionIds: data.tipoObservacionIds,
      editableHasta: data.editableHasta,
    });
  };

  const cerrarObservacionesModal = () => setObservacionesModal(null);

  const agregarTipoObservacionModal = (tipoId: number) => {
    setObservacionesModal((prev) =>
      prev && !prev.tipoObservacionIds.includes(tipoId)
        ? { ...prev, tipoObservacionIds: [...prev.tipoObservacionIds, tipoId] }
        : prev,
    );
  };

  const quitarTipoObservacionModal = (tipoId: number) => {
    setObservacionesModal((prev) =>
      prev ? { ...prev, tipoObservacionIds: prev.tipoObservacionIds.filter((x) => x !== tipoId) } : null,
    );
  };

  const actualizarTextoObservacionModal = (texto: string) => {
    setObservacionesModal((prev) => (prev ? { ...prev, observaciones: texto } : null));
  };

  const guardarObservaciones = async () => {
    if (!observacionesModal) return;
    setGuardandoObservaciones(true);
    setError('');
    try {
      await apiService.crearOActualizarObservacionesAsistencia(
        observacionesModal.asistenciaId,
        observacionesModal.aprendizId,
        observacionesModal.observaciones,
        observacionesModal.tipoObservacionIds
      );
      setObservacionesModal(null);
      if (fichaId && Number.isFinite(fichaId) && fechaValida) {
        setLoading(true);
        const [aprendicesRes, sesionesRes] = await Promise.all([
          apiService.getFichaAprendices(fichaId),
          apiService.getAsistenciasByFichaAndFechas(fichaId, fecha, fecha),
        ]);
        setAprendices(aprendicesRes.filter((a) => a.estado));
        setSesiones(sesionesRes);
        const map = new Map<number, AsistenciaAprendizResponse[]>();
        await Promise.all(
          sesionesRes.map(async (sesion) => {
            const list = await apiService.getAsistenciaAprendices(sesion.id);
            map.set(sesion.id, list);
          })
        );
        setAprendicesPorSesion(map);
      }
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo guardar la observación del aprendiz.'));
    } finally {
      setGuardandoObservaciones(false);
      setLoading(false);
    }
  };

  const moverFecha = (dias: number) => {
    const base = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + dias);
    const nueva = base.toISOString().slice(0, 10);
    setFecha(minIsoDateString(nueva, fechaMaxHoy));
  };

  const ejecutarExportacion = async () => {
    if (!fichaId || !Number.isFinite(fichaId)) return;
    setDescargandoExport(true);
    setError('');
    try {
      const codigo = await obtenerCodigoFichaParaArchivo(fichaId, ficha?.ficha);
      const hoyIso = fechaMaxHoy;

      if (tipoExport === 'dia') {
        await exportarExcelDetalleDia(
          filas.map((f) => ({
            aprendiz: f.aprendiz,
            asistio: f.asistio,
            horaIngreso: f.horaIngreso,
            horaSalida: f.horaSalida,
            observaciones: f.observaciones,
            badgeColor: f.badgeColor,
          })),
          fecha,
          codigo,
        );
      } else if (tipoExport === 'semana') {
        const { inicio, fin } = rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes);
        if (inicio > hoyIso) {
          setError('La semana seleccionada aún no tiene fechas disponibles.');
          return;
        }
        await exportarExcelMatrizRango(
          fichaId,
          inicio,
          minIsoDateString(fin, hoyIso),
          codigo,
          nombreArchivoSemana(mesSemana, semanaDelMes),
          'Asistencia semana',
          hoyIso,
        );
      } else if (tipoExport === 'mes') {
        const { inicio, fin } = rangoFechasPorMes(mesExport);
        if (inicio > hoyIso) {
          setError('El mes seleccionado aún no tiene fechas disponibles.');
          return;
        }
        await exportarExcelMatrizRango(
          fichaId,
          inicio,
          minIsoDateString(fin, hoyIso),
          codigo,
          nombreArchivoMes(mesExport),
          'Asistencia mes',
          hoyIso,
        );
      } else {
        const anio = Number.parseInt(anioExport, 10);
        if (!Number.isFinite(anio)) {
          setError('Año no válido.');
          return;
        }
        await exportarExcelAnio(fichaId, anio, codigo, hoyIso);
      }
      setModalExportAbierto(false);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al generar el Excel.'));
    } finally {
      setDescargandoExport(false);
    }
  };

  const exportacionDeshabilitada = useMemo(() => {
    if (descargandoExport) return true;
    if (tipoExport === 'semana') {
      return rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).inicio > fechaMaxHoy;
    }
    if (tipoExport === 'mes') {
      return rangoFechasPorMes(mesExport).inicio > fechaMaxHoy;
    }
    if (tipoExport === 'anio') {
      const anio = Number.parseInt(anioExport, 10);
      return !Number.isFinite(anio) || anio > Number(fechaMaxHoy.slice(0, 4));
    }
    return false;
  }, [descargandoExport, tipoExport, mesSemana, semanaDelMes, mesExport, anioExport, fechaMaxHoy]);

  if (fichaId == null || !Number.isFinite(fichaId)) {
    return (
      <div className="space-y-4">
        <Link to={asistenciaPaths.historial.index} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400">
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
            to={asistenciaPaths.historial.index}
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
            Volver al historial
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de asistencia
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Aprendices que asistieron o no en la fecha seleccionada.
          </p>
        </div>
      </div>

      {ficha ? (
        <FichaCaracterizacionCard
          ficha={ficha}
          showStatusBadge
          footerLeft={
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {aprendices.length > 0 ? aprendices.length : ficha.cantidad_aprendices} aprendices en la ficha
            </span>
          }
          actions={
            <Link
              to={fichasPaths.detalle(ficha.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700/50"
            >
              <EyeIcon className="h-4 w-4" aria-hidden />
              Ver ficha
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando información de la ficha…</p>
        </div>
      )}

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
          <button
            type="button"
            onClick={() => setModalExportAbierto(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden />
            Exportar Excel
          </button>
        )}
      </div>

      {!loading && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Observaciones de sesiones del día</h2>
          <ObservacionesSesionesDiaContenido sesiones={sesiones} sesionesConObservaciones={sesionesConObservaciones} />
        </div>
      )}

      {modalExportAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar diálogo"
            onClick={() => !descargandoExport && setModalExportAbierto(false)}
          />
          <dialog
            open
            className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby={MODAL_EXPORT_TITLE_ID}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={MODAL_EXPORT_TITLE_ID} className="text-lg font-semibold text-gray-900 dark:text-white">
                Exportar asistencia
              </h2>
              <button
                type="button"
                onClick={() => !descargandoExport && setModalExportAbierto(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Elija el periodo del reporte. Semana, mes y año generan una matriz por día; el día incluye horas y observaciones.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor={MODAL_EXPORT_TIPO_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Periodo
                </label>
                <select
                  id={MODAL_EXPORT_TIPO_ID}
                  value={tipoExport}
                  onChange={(e) => setTipoExport(e.target.value as TipoExportHistorial)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={descargandoExport}
                >
                  <option value="dia">Día (fecha seleccionada arriba)</option>
                  <option value="semana">Semana del mes</option>
                  <option value="mes">Mes completo</option>
                  <option value="anio">Año (una hoja por mes)</option>
                </select>
              </div>

              {tipoExport === 'dia' ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Se exportará el día <strong>{fecha}</strong> con ingreso, salida y observaciones por aprendiz.
                </p>
              ) : null}

              {tipoExport === 'semana' ? (
                <>
                  <div>
                    <label htmlFor={MODAL_MES_SEMANA_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mes
                    </label>
                    <input
                      id={MODAL_MES_SEMANA_ID}
                      type="month"
                      value={mesSemana}
                      max={fechaMaxHoy.slice(0, 7)}
                      onChange={(e) => setMesSemana(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      disabled={descargandoExport}
                    />
                  </div>
                  <div>
                    <label htmlFor={MODAL_SEMANA_SELECT_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Semana del mes
                    </label>
                    <select
                      id={MODAL_SEMANA_SELECT_ID}
                      value={semanaDelMes}
                      onChange={(e) => setSemanaDelMes(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      disabled={descargandoExport}
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
                    {minIsoDateString(rangoFechasPorSemanaDelMes(mesSemana, semanaDelMes).fin, fechaMaxHoy)}
                  </p>
                </>
              ) : null}

              {tipoExport === 'mes' ? (
                <div>
                  <label htmlFor={MODAL_EXPORT_MES_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mes
                  </label>
                  <input
                    id={MODAL_EXPORT_MES_ID}
                    type="month"
                    value={mesExport}
                    max={fechaMaxHoy.slice(0, 7)}
                    onChange={(e) => setMesExport(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={descargandoExport}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Incluye todos los días del mes hasta hoy ({fechaMaxHoy}).
                  </p>
                </div>
              ) : null}

              {tipoExport === 'anio' ? (
                <div>
                  <label htmlFor={MODAL_EXPORT_ANIO_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Año
                  </label>
                  <input
                    id={MODAL_EXPORT_ANIO_ID}
                    type="number"
                    min={2020}
                    max={Number(fechaMaxHoy.slice(0, 4))}
                    value={anioExport}
                    onChange={(e) => setAnioExport(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={descargandoExport}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Genera un archivo con una hoja por mes (enero a {fechaMaxHoy.slice(5, 7)}/{fechaMaxHoy.slice(0, 4)} si es el año en curso).
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalExportAbierto(false)}
                disabled={descargandoExport}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  void ejecutarExportacion();
                }}
                disabled={exportacionDeshabilitada}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {descargandoExport ? 'Generando…' : 'Descargar Excel'}
              </button>
            </div>
          </dialog>
        </div>
      )}

      {observacionesModal && (
        <HistorialObservacionesModal
          modal={observacionesModal}
          catalogo={tiposObservacionCatalogo}
          guardando={guardandoObservaciones}
          onCerrar={cerrarObservacionesModal}
          onGuardar={() => {
            void guardarObservaciones();
          }}
          onChangeObservaciones={actualizarTextoObservacionModal}
          onAgregarTipo={agregarTipoObservacionModal}
          onQuitarTipo={quitarTipoObservacionModal}
        />
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
                  <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 dark:border-gray-600 px-3 py-6 text-center text-gray-500 dark:text-gray-400">
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
                      <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => abrirModalObservaciones(fila.aprendiz)}
                          className="btn-secondary text-xs"
                          disabled={!sesionEditablePorAprendizId.get(fila.aprendiz.id)?.puedeEditar}
                          title={
                            sesionEditablePorAprendizId.get(fila.aprendiz.id)?.puedeEditar
                              ? 'Editar observación'
                              : `Plazo vencido (${sesionEditablePorAprendizId.get(fila.aprendiz.id)?.editableHasta ?? 'sin fecha'})`
                          }
                        >
                          Editar observación
                        </button>
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
