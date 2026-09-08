/**
 * Cambios que los visitantes quieren aplicar y que el vigilante aprueba o
 * rechaza. Se agrupan por persona en carpetas buscables por nombre o CC.
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { mostrarToastApp } from '../utils/appToast';
import type { AccionCambio, CambioPendiente } from './vigilancia/CambioPendienteCard';
import { CambioPendienteCarpeta } from './vigilancia/CambioPendienteCarpeta';
import { agruparPorPersona, filtrarGrupos } from './vigilancia/cambioPendienteGrupos';

export function VigilanciaCambiosPendientes() {
  const [cambios, setCambios] = useState<CambioPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);
  // Quiénes tienen la carpeta abierta: vive aquí para que no se cierre al
  // aprobar o rechazar un cambio (que recarga la lista).
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<Set<number>>(new Set());
  // Validación doble: primero se presiona el botón y luego se confirma la decisión.
  const [confirmandoAccion, setConfirmandoAccion] = useState<{ id: number; accion: AccionCambio } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await apiService.listarCambiosPendientes();
      setCambios(res.data || []);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar cambios pendientes'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const grupos = useMemo(() => filtrarGrupos(agruparPorPersona(cambios), busqueda), [cambios, busqueda]);

  const finalizarAccion = async (
    id: number,
    accion: AccionCambio,
    ejecutar: () => Promise<void>,
    tituloOk: string,
    textoOk: string,
  ) => {
    setProcesando(id);
    setError('');
    try {
      await ejecutar();
      setConfirmandoAccion(null);
      mostrarToastApp({ icon: 'success', titulo: tituloOk, texto: textoOk, timer: 3000 });
      await cargar();
    } catch (e: unknown) {
      mostrarToastApp({
        icon: 'error',
        titulo: accion === 'aprobar' ? 'No se pudo aprobar' : 'No se pudo rechazar',
        texto: axiosErrorMessage(e, accion === 'aprobar' ? 'Error al aprobar' : 'Error al rechazar'),
        timer: 4000,
      });
    } finally {
      setProcesando(null);
    }
  };

  const alConfirmar = (id: number, accion: AccionCambio) =>
    void (accion === 'aprobar'
      ? finalizarAccion(
          id,
          'aprobar',
          () => apiService.aprobarCambioPendiente(id),
          'Cambio aprobado',
          'Los cambios fueron aprobados y ya están vigentes.',
        )
      : finalizarAccion(
          id,
          'rechazar',
          () => apiService.rechazarCambioPendiente(id),
          'Cambio rechazado',
          'Los cambios fueron rechazados y no se aplican.',
        ));

  const alternarCarpeta = (personaId: number) => {
    setCarpetasAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(personaId)) siguiente.delete(personaId);
      else siguiente.add(personaId);
      return siguiente;
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cambios pendientes de aprobación</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Los cambios realizados por visitantes requieren aprobación del vigilante antes de aplicarse.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o CC"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <span className="btn-sena pointer-events-none flex items-center justify-center">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : grupos.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <ClockIcon className="h-5 w-5" />
          {busqueda.trim() ? 'No se encontraron personas con ese nombre o CC.' : 'No hay cambios pendientes de aprobación.'}
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => (
            <CambioPendienteCarpeta
              key={grupo.personaId}
              grupo={grupo}
              abierta={carpetasAbiertas.has(grupo.personaId)}
              onToggleAbierta={() => alternarCarpeta(grupo.personaId)}
              procesandoId={procesando}
              confirmandoAccion={confirmandoAccion}
              onIniciarConfirmacion={(id, accion) => setConfirmandoAccion({ id, accion })}
              onCancelarConfirmacion={() => setConfirmandoAccion(null)}
              onConfirmar={alConfirmar}
            />
          ))}
        </div>
      )}
    </div>
  );
}