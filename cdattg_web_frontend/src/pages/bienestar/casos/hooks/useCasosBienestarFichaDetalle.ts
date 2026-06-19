import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { apiService } from '../../../../services/api';
import { axiosErrorMessage } from '../../../../utils/httpError';
import { useAuth } from '../../../../context/AuthContext';
import { canViewCasosBienestar, MENSAJE_SIN_PERMISO_CASOS_BIENESTAR } from '../casosBienestarPermissions';
import { generarReportePdfAprendiz } from '../casosBienestarReportePdf';
import { casosDeFicha, filtrarCasosAprendiz } from '../casosBienestarUtils';
import type { CasoBienestarItem, InasistenciaDetalleItem } from '../../../../types';
import { useCasosBienestar } from './useCasosBienestar';

export function useCasosBienestarFichaDetalle() {
  const { roles } = useAuth();
  const { fichaNumero } = useParams<{ fichaNumero: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const canView = canViewCasosBienestar(roles);

  const diasParam = Number(searchParams.get('dias') || '');
  const minFallasParam = Number(searchParams.get('min_fallas') || '');
  const dias = Number.isFinite(diasParam) && diasParam > 0 ? diasParam : 30;
  const minFallas = Number.isFinite(minFallasParam) && minFallasParam > 0 ? minFallasParam : 3;
  const sedeNombreParam = searchParams.get('sede') || '';

  const setDias = useCallback(
    (value: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('dias', String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setMinFallas = useCallback(
    (value: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('min_fallas', String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [aprendizDetalle, setAprendizDetalle] = useState<CasoBienestarItem | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [detalleInasistencias, setDetalleInasistencias] = useState<InasistenciaDetalleItem[]>([]);
  const [detallePeriodo, setDetallePeriodo] = useState<{ fecha_inicio: string; fecha_fin: string } | null>(
    null,
  );
  const [pdfDescargandoId, setPdfDescargandoId] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState('');

  const { data, loading, error, setError, setLoading } = useCasosBienestar({
    enabled: canView && Boolean(fichaNumero),
    dias,
    minFallas,
  });

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      setError(MENSAJE_SIN_PERMISO_CASOS_BIENESTAR);
      return;
    }
    if (!fichaNumero) {
      setLoading(false);
      setError('Ficha no especificada.');
    }
  }, [canView, fichaNumero, setError, setLoading]);

  const casosFichaRaw = useMemo(
    () =>
      fichaNumero && data?.casos
        ? casosDeFicha(data.casos, fichaNumero, sedeNombreParam)
        : [],
    [data, fichaNumero, sedeNombreParam],
  );

  const casosFicha = useMemo(
    () => filtrarCasosAprendiz(casosFichaRaw, searchQuery),
    [casosFichaRaw, searchQuery],
  );

  const sedeNombre =
    sedeNombreParam || (casosFichaRaw.length > 0 ? casosFichaRaw[0].sede_nombre : '');

  const totalSesiones = casosFichaRaw.reduce((sum, c) => sum + c.total_sesiones, 0);
  const totalInasistencias = casosFichaRaw.reduce((sum, c) => sum + c.inasistencias, 0);
  const busquedaActiva = Boolean(searchQuery.trim());

  const abrirDetalleAprendiz = useCallback(
    async (aprendiz: CasoBienestarItem) => {
      if (!fichaNumero) return;
      setAprendizDetalle(aprendiz);
      setDetalleLoading(true);
      setDetalleError('');
      setDetalleInasistencias([]);
      setDetallePeriodo(null);
      try {
        const res = await apiService.getCasoBienestarAprendizDetalle(fichaNumero, aprendiz.aprendiz_id, {
          dias,
          sede: sedeNombreParam || undefined,
        });
        setDetalleInasistencias(res.inasistencias ?? []);
        setDetallePeriodo({ fecha_inicio: res.fecha_inicio, fecha_fin: res.fecha_fin });
      } catch (e: unknown) {
        setDetalleError(axiosErrorMessage(e, 'No se pudo cargar el detalle de inasistencias.'));
      } finally {
        setDetalleLoading(false);
      }
    },
    [fichaNumero, dias, sedeNombreParam],
  );

  const cerrarDetalleAprendiz = useCallback(() => {
    setAprendizDetalle(null);
    setDetallePeriodo(null);
  }, []);

  const descargarReportePdfAprendiz = useCallback(
    async (
      aprendiz: CasoBienestarItem,
      datosCache?: {
        inasistencias: InasistenciaDetalleItem[];
        periodo: { fecha_inicio: string; fecha_fin: string } | null;
      },
    ) => {
      if (!fichaNumero || pdfDescargandoId != null) return;
      setPdfError('');
      setPdfDescargandoId(aprendiz.aprendiz_id);
      try {
        let inasistencias = datosCache?.inasistencias;
        let periodo = datosCache?.periodo ?? null;

        if (!inasistencias) {
          const res = await apiService.getCasoBienestarAprendizDetalle(fichaNumero, aprendiz.aprendiz_id, {
            dias,
            sede: sedeNombreParam || undefined,
          });
          inasistencias = res.inasistencias ?? [];
          periodo = { fecha_inicio: res.fecha_inicio, fecha_fin: res.fecha_fin };
        }

        generarReportePdfAprendiz({
          aprendiz,
          inasistencias,
          dias,
          minFallas,
          periodo,
        });
      } catch (e: unknown) {
        setPdfError(
          axiosErrorMessage(e, 'No fue posible generar el reporte PDF. Intente nuevamente.'),
        );
      } finally {
        setPdfDescargandoId(null);
      }
    },
    [fichaNumero, dias, minFallas, sedeNombreParam, pdfDescargandoId],
  );

  return {
    canView,
    permissionError: MENSAJE_SIN_PERMISO_CASOS_BIENESTAR,
    fichaNumero,
    dias,
    setDias,
    minFallas,
    setMinFallas,
    sedeNombre,
    searchQuery,
    setSearchQuery,
    data,
    loading,
    error,
    casosFicha,
    casosFichaTotal: casosFichaRaw.length,
    busquedaActiva,
    totalSesiones,
    totalInasistencias,
    aprendizDetalle,
    detalleLoading,
    detalleError,
    detalleInasistencias,
    detallePeriodo,
    abrirDetalleAprendiz,
    cerrarDetalleAprendiz,
    descargarReportePdfAprendiz,
    pdfDescargandoId,
    pdfError,
  };
}

export type CasosBienestarFichaDetallePageState = ReturnType<typeof useCasosBienestarFichaDetalle>;
