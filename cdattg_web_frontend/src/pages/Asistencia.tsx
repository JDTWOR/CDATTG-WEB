import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowLeftIcon, DocumentTextIcon, UserPlusIcon, CheckIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, PencilSquareIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { EscanerQR } from '../components/EscanerQR';
import { useAuth } from '../context/AuthContext';
import type {
  FichaCaracterizacionResponse,
  InstructorFichaResponse,
  AsistenciaResponse,
  AprendizResponse,
  AsistenciaAprendizResponse,
} from '../types';

export const Asistencia = () => {
  const { roles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fichaFromUrl = searchParams.get('ficha');
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [fichasLoading, setFichasLoading] = useState(true);
  const [fichaId, setFichaId] = useState<number | ''>(() => {
    const id = fichaFromUrl ? parseInt(fichaFromUrl, 10) : NaN;
    return Number.isFinite(id) ? id : '';
  });
  const [, _setInstructoresFicha] = useState<InstructorFichaResponse[]>([]);
  const [, setAsistencias] = useState<AsistenciaResponse[]>([]);
  const [sesionActual, setSesionActual] = useState<AsistenciaResponse | null>(null);
  const [aprendicesFicha, setAprendicesFicha] = useState<AprendizResponse[]>([]);
  const [aprendicesEnSesion, setAprendicesEnSesion] = useState<AsistenciaAprendizResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [instructorFichaSeleccionado, _setInstructorFichaSeleccionado] = useState<number | ''>('');
  const [, setMostrarNuevaSesion] = useState(false);
  const [fechaSesion, _setFechaSesion] = useState(() => new Date().toISOString().slice(0, 10));
  const [, setErrorSesion] = useState('');
  const [documentoManual, setDocumentoManual] = useState('');
  const [errorRegistroManual, setErrorRegistroManual] = useState('');
  const [mensajeRegistroManual, setMensajeRegistroManual] = useState('');
  const [registrandoManual, setRegistrandoManual] = useState(false);
  const [observacionesModal, setObservacionesModal] = useState<{ asistenciaId: number; aprendizId: number; nombre: string; observaciones: string } | null>(null);
  const [observacionesGuardando, setObservacionesGuardando] = useState(false);

  // Siempre pedir "mis fichas" (instructor asignado). Superadmin/otros reciben lista vacía.
  const fetchFichas = async () => {
    setFichasLoading(true);
    try {
      const res = await apiService.getFichasCaracterizacion(1, 200, undefined, true);
      setFichas(res.data);
    } catch (_) {
      setFichas([]);
    } finally {
      setFichasLoading(false);
    }
  };

  useEffect(() => {
    fetchFichas();
  }, []);

  useEffect(() => {
    if (fichaFromUrl) {
      const id = parseInt(fichaFromUrl, 10);
      if (Number.isFinite(id)) setFichaId(id);
    }
  }, [fichaFromUrl]);

  useEffect(() => {
    if (!fichaId) {
      setSesionActual(null);
      setAprendicesEnSesion([]);
    }
  }, [fichaId]);

  const loadAprendicesYSesion = async (asistenciaId: number, fichaIdParam?: number) => {
    const fid = fichaIdParam ?? fichaId;
    if (!fid) return;
    try {
      const [aprendices, enSesion] = await Promise.all([
        apiService.getFichaAprendices(fid),
        apiService.getAsistenciaAprendices(asistenciaId),
      ]);
      setAprendicesFicha(aprendices.filter((a) => a.estado));
      setAprendicesEnSesion(enSesion);
    } catch (_) {}
  };

  useEffect(() => {
    if (sesionActual && fichaId) loadAprendicesYSesion(sesionActual.id, fichaId);
    else setAprendicesEnSesion([]);
  }, [sesionActual?.id, fichaId]);

  const handleTomarAsistencia = async (id: number) => {
    setError('');
    setLoading(true);
    try {
      const sesion = await apiService.entrarTomarAsistencia(id);
      setFichaId(id);
      setSearchParams({ ficha: String(id) });
      setSesionActual(sesion);
      if (id) loadAprendicesYSesion(sesion.id, id);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'No está asignado como instructor de esta ficha.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVolverAFichas = () => {
    setSesionActual(null);
    setFichaId('');
    setSearchParams({});
    setAprendicesEnSesion([]);
  };

  const _handleCrearSesion = async () => {
    if (!instructorFichaSeleccionado) return;
    setErrorSesion('');
    setLoading(true);
    try {
      const sesion = await apiService.createAsistenciaSesion({
        instructor_ficha_id: instructorFichaSeleccionado,
        fecha: fechaSesion,
      });
      setMostrarNuevaSesion(false);
      setAsistencias((prev) => [sesion, ...prev]);
      setSesionActual(sesion);
      if (fichaId) loadAprendicesYSesion(sesion.id);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Error al crear sesión';
      setErrorSesion(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async () => {
    if (!sesionActual) return;
    if (!confirm('¿Finalizar esta sesión de asistencia?')) return;
    try {
      await apiService.finalizarAsistencia(sesionActual.id);
      setSesionActual(null);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al finalizar');
    }
  };

  const handleRegistrarIngreso = async (aprendizId: number) => {
    if (!sesionActual) return;
    try {
      await apiService.registrarIngresoAsistencia({
        asistencia_id: sesionActual.id,
        aprendiz_id: aprendizId,
      });
      loadAprendicesYSesion(sesionActual.id);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al registrar ingreso');
    }
  };

  const handleRegistrarSalida = async (asistenciaAprendizId: number) => {
    try {
      await apiService.registrarSalidaAsistencia(asistenciaAprendizId);
      if (sesionActual) loadAprendicesYSesion(sesionActual.id);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al registrar salida');
    }
  };

  const handleGuardarObservaciones = async () => {
    if (!observacionesModal || !sesionActual) return;
    setObservacionesGuardando(true);
    try {
      await apiService.crearOActualizarObservacionesAsistencia(observacionesModal.asistenciaId, observacionesModal.aprendizId, observacionesModal.observaciones);
      setObservacionesModal(null);
      loadAprendicesYSesion(sesionActual.id);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al guardar observaciones');
    } finally {
      setObservacionesGuardando(false);
    }
  };

  const handleRegistrarPorDocumento = async (numeroDocumento: string) => {
    if (!sesionActual || !numeroDocumento.trim()) return;
    setErrorRegistroManual('');
    setMensajeRegistroManual('');
    setRegistrandoManual(true);
    try {
      const data = await apiService.registrarIngresoAsistenciaPorDocumento(sesionActual.id, numeroDocumento.trim());
      setDocumentoManual('');
      loadAprendicesYSesion(sesionActual.id);
      setMensajeRegistroManual(data.mensaje || (data.tipo_registro === 'ingreso' ? 'Ingreso registrado' : data.tipo_registro === 'salida' ? 'Salida registrada' : 'Asistencia completa'));
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Error al registrar asistencia';
      setErrorRegistroManual(msg);
    } finally {
      setRegistrandoManual(false);
    }
  };

  const handleRegistroManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegistrarPorDocumento(documentoManual);
  };

  const handleQREscaneado = (numeroDocumento: string) => {
    handleRegistrarPorDocumento(numeroDocumento);
  };

  // Referencia para evitar noUnusedLocals; uso futuro en la UI (crear sesión)
  void [_setInstructoresFicha, _setInstructorFichaSeleccionado, _setFechaSesion, _handleCrearSesion];

  const registroPorAprendizId = new Map(aprendicesEnSesion.map((aa) => [aa.aprendiz_id, aa]));

  // Sin fichas asignadas: superadmin o instructor sin asignaciones
  if (!fichasLoading && fichas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Asistencia</h1>
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tienes fichas asignadas</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            No se encontraron fichas de formación asignadas a tu cuenta.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
            Contacta al administrador para que te asigne las fichas correspondientes.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Con fichas: cards y (si hay ficha seleccionada) bloque de sesiones
  const fichaSeleccionada = fichaId ? fichas.find((f) => f.id === fichaId) : null;

  // Vista única de tomar asistencia: pantalla completa (no debajo de las cards)
  if (sesionActual && !sesionActual.is_finished && fichaSeleccionada) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tomar asistencia</h1>
            <p className="mt-1 text-gray-600">Ficha {fichaSeleccionada.ficha} · {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}</p>
          </div>
          <button type="button" onClick={handleVolverAFichas} className="btn-secondary">
            Volver a fichas
          </button>
        </div>
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,auto]">
            {/* Panel izquierdo: información de la ficha y sesión */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase text-gray-900">
                    {fichaSeleccionada.programa_formacion_nombre || 'Sin programa'}
                  </h2>
                  <p className="text-gray-600">Ficha {fichaSeleccionada.ficha}</p>
                </div>
                {fichaSeleccionada.modalidad_formacion_nombre && (
                  <span className="rounded bg-primary-600 px-2.5 py-1 text-xs font-medium text-white">
                    {fichaSeleccionada.modalidad_formacion_nombre}
                  </span>
                )}
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Información del programa</p>
                  <p className="text-sm text-gray-700">N° Ficha: {fichaSeleccionada.ficha}</p>
                  <p className="text-sm text-gray-700">Instructor líder: {fichaSeleccionada.instructor_nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Estado de la sesión</p>
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Asistencia: Activa
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-600">
                  {aprendicesEnSesion.length} de {aprendicesFicha.length} con registro en sesión
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVolverAFichas}
                    className="btn-secondary text-sm"
                  >
                    Volver a fichas
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizar}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-3 min-h-[44px] text-sm font-medium text-white hover:bg-primary-700 touch-manipulation"
                  >
                    <CheckIcon className="h-5 w-5" />
                    Finalizar asistencia
                  </button>
                </div>
              </div>
            </div>

            {/* Panel derecho: escáner QR */}
            <EscanerQR
              key={sesionActual.id}
              activo={!!sesionActual}
              onEscaneado={handleQREscaneado}
              className="lg:w-[340px]"
              readerId={`qr-sesion-${sesionActual.id}`}
            />
          </div>

          {/* Listado de aprendices: registro manual + tabla */}
          <div className="card">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Listado de aprendices</h3>
            <p className="mb-4 text-sm text-gray-600">Entradas y salidas por sesión</p>

            {/* Registro manual por documento */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-gray-700">
                <DocumentTextIcon className="h-5 w-5" />
                Registro manual
              </p>
              <form onSubmit={handleRegistroManualSubmit} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[280px] flex-1">
                  <input
                    type="text"
                    value={documentoManual}
                    onChange={(e) => { setDocumentoManual(e.target.value); setErrorRegistroManual(''); setMensajeRegistroManual(''); }}
                    placeholder="Ingrese número de documento del aprendiz..."
                    className="input-field w-full"
                    disabled={registrandoManual}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registrandoManual || !documentoManual.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 min-h-[44px] text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 touch-manipulation"
                >
                  <UserPlusIcon className="h-5 w-5" />
                  Registrar Asistencia
                </button>
              </form>
              {errorRegistroManual && (
                <p className="mt-2 text-sm text-red-600">{errorRegistroManual}</p>
              )}
              {mensajeRegistroManual && (
                <p className="mt-2 text-sm text-green-700 font-medium">{mensajeRegistroManual}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Seleccione aprendices con checkbox o use esta opción para registro manual por documento. También puede escanear el QR del aprendiz.
              </p>
            </div>

            {/* Listado de aprendices: en móvil tarjetas, en desktop tabla */}
            {aprendicesFicha.length === 0 ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-4 py-8 text-center text-gray-500 text-sm">
                No hay aprendices en esta ficha.
              </div>
            ) : (
              <>
                {/* Vista móvil: tarjetas por aprendiz */}
                <div className="md:hidden space-y-3">
                  {aprendicesFicha.map((aprendiz, idx) => {
                    const aa = registroPorAprendizId.get(aprendiz.id);
                    return (
                      <div
                        key={aprendiz.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {aprendiz.persona_nombre ?? '–'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Doc: {aprendiz.persona_documento ?? '–'} · #{idx + 1}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">
                            {aa?.hora_ingreso
                              ? new Date(aa.hora_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                              : '–'}
                            {aa?.hora_salida != null && (
                              <> → {new Date(aa.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</>
                            )}
                          </span>
                        </div>
                        {aa?.observaciones ? (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2" title={aa.observaciones}>
                            {aa.observaciones}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          {!aa || !aa.hora_ingreso ? (
                            <button
                              type="button"
                              onClick={() => handleRegistrarIngreso(aprendiz.id)}
                              className="flex-1 min-w-[120px] min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 active:bg-primary-800 touch-manipulation"
                              aria-label="Registrar entrada"
                            >
                              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                              Entrada
                            </button>
                          ) : !aa.hora_salida ? (
                            <button
                              type="button"
                              onClick={() => handleRegistrarSalida(aa.id)}
                              className="flex-1 min-w-[120px] min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 active:bg-primary-800 touch-manipulation"
                              aria-label="Registrar salida"
                            >
                              <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" />
                              Salida
                            </button>
                          ) : (
                            <span className="flex-1 min-h-[44px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                              Registrado
                            </span>
                          )}
                          {sesionActual ? (
                            <button
                              type="button"
                              onClick={() =>
                                setObservacionesModal({
                                  asistenciaId: sesionActual.id,
                                  aprendizId: aprendiz.id,
                                  nombre: aprendiz.persona_nombre ?? 'Aprendiz',
                                  observaciones: aa?.observaciones ?? '',
                                })
                              }
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 touch-manipulation"
                              aria-label="Observaciones"
                              title="Observaciones"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vista desktop: tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">#</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Documento</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Nombre del aprendiz</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Hora Ingreso</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Hora Salida</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Observaciones</th>
                        <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aprendicesFicha.map((aprendiz, idx) => {
                        const aa = registroPorAprendizId.get(aprendiz.id);
                        return (
                          <tr key={aprendiz.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-600 dark:text-gray-400">{idx + 1}</td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">{aprendiz.persona_documento ?? '-'}</td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 font-medium">{aprendiz.persona_nombre ?? '-'}</td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                              {aa?.hora_ingreso ? new Date(aa.hora_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '–'}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                              {aa?.hora_salida ? new Date(aa.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '–'}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-500 dark:text-gray-400">{aa?.observaciones || '–'}</td>
                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                              <div className="flex items-center gap-2">
                                {!aa || !aa.hora_ingreso ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRegistrarIngreso(aprendiz.id)}
                                    className="min-w-[52px] min-h-[52px] flex items-center justify-center rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-500 dark:hover:text-green-400 dark:hover:bg-green-900/30 touch-manipulation transition-colors"
                                    title="Registrar entrada"
                                    aria-label="Registrar entrada"
                                  >
                                    <ArrowRightOnRectangleIcon className="h-7 w-7" />
                                  </button>
                                ) : !aa.hora_salida ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRegistrarSalida(aa.id)}
                                    className="min-w-[52px] min-h-[52px] flex items-center justify-center rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 touch-manipulation transition-colors"
                                    title="Registrar salida"
                                    aria-label="Registrar salida"
                                  >
                                    <ArrowLeftOnRectangleIcon className="h-7 w-7" />
                                  </button>
                                ) : (
                                  <span className="min-w-[52px] min-h-[52px] inline-block" aria-hidden />
                                )}
                                {sesionActual ? (
                                  <button
                                    type="button"
                                    onClick={() => setObservacionesModal({ asistenciaId: sesionActual.id, aprendizId: aprendiz.id, nombre: aprendiz.persona_nombre ?? 'Aprendiz', observaciones: aa?.observaciones ?? '' })}
                                    className="min-w-[52px] min-h-[52px] flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 touch-manipulation transition-colors"
                                    title="Observaciones"
                                    aria-label="Registrar observaciones"
                                  >
                                    <PencilSquareIcon className="h-7 w-7" />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal observaciones */}
        {observacionesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-observaciones-title">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
              <h3 id="modal-observaciones-title" className="mb-3 text-lg font-semibold text-gray-900">Observaciones — {observacionesModal.nombre}</h3>
              <textarea
                value={observacionesModal.observaciones}
                onChange={(e) => setObservacionesModal((prev) => prev ? { ...prev, observaciones: e.target.value } : null)}
                placeholder="Escriba aquí las observaciones del aprendiz..."
                rows={4}
                className="input-field mb-4 w-full resize-y"
                disabled={observacionesGuardando}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setObservacionesModal(null)}
                  className="btn-secondary"
                  disabled={observacionesGuardando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarObservaciones}
                  disabled={observacionesGuardando}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {observacionesGuardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Listado de fichas (cards)
  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asistencia</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Tomar asistencia por ficha e instructor</p>
        </div>
        {isSuperAdmin && (
          <Link
            to="/asistencia/dashboard"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ChartBarIcon className="w-5 h-5" />
            Dashboard en tiempo real
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fichas.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="font-bold text-gray-900 uppercase text-sm leading-tight">
                  {item.programa_formacion_nombre || 'Sin programa'}
                </h3>
                {item.modalidad_formacion_nombre && (
                  <span className="shrink-0 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                    {item.modalidad_formacion_nombre}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">Ficha {item.ficha}</p>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-1">
                    Información académica
                  </p>
                  <div className="text-sm text-gray-700">Jornada: {item.jornada_nombre || '-'}</div>
                  <div className="text-sm text-gray-700">Sede / Ambiente: {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '-'}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Instructor líder</p>
                  <div className="text-sm text-gray-700">{item.instructor_nombre || '-'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">{item.cantidad_aprendices} Aprendices</span>
                <button
                  type="button"
                  onClick={() => handleTomarAsistencia(item.id)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Entrando...' : 'Tomar asistencia'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
