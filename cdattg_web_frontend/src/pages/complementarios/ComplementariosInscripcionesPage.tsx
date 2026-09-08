import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import ExcelJS from 'exceljs';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type {
  ConsultarInscripcionesLoteResponse,
  ConsultarInscripcionesResponse,
  CredencialSofiaEstado,
  LoteIniciadoResponse,
  ProgresoLoteResponse,
} from '../../types';
import {
  leerHandoffFase1,
  limpiarHandoffFase1,
  type Fase1HandoffDoc,
} from './fase1Handoff';

/**
 * Orquesta un lote con progreso en vivo: arranca el lote (devuelve lote_id al
 * instante), hace polling cada 2 s a /progreso/:id y, al terminar, consulta
 * /resultados/:id. Compartido por los paneles de carga masiva de Fase 2.
 */
function useLoteConProgreso<T>(
  iniciar: () => Promise<LoteIniciadoResponse>,
  consultarProgreso: (loteId: string) => Promise<ProgresoLoteResponse>,
  consultarResultados: (loteId: string) => Promise<T>,
) {
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState<ProgresoLoteResponse | null>(null);
  const [error, setError] = useState('');
  const [res, setRes] = useState<T | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detenerPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Limpieza al desmontar: nunca dejar un intervalo vivo.
  useEffect(() => detenerPolling, [detenerPolling]);

  const ejecutar = useCallback(async () => {
    setProcesando(true);
    setError('');
    setRes(null);
    setProgreso(null);
    try {
      const iniciado = await iniciar();
      setProgreso({ lote_id: iniciado.lote_id, total: iniciado.total, procesados: 0, terminado: false });

      pollingRef.current = setInterval(async () => {
        try {
          const p = await consultarProgreso(iniciado.lote_id);
          setProgreso(p);
          if (p.terminado) {
            detenerPolling();
            const r = await consultarResultados(iniciado.lote_id);
            setRes(r);
            setProcesando(false);
            setProgreso(null);
          }
        } catch (err: unknown) {
          detenerPolling();
          setProcesando(false);
          setProgreso(null);
          setError(axiosErrorMessage(err, 'No se pudo consultar el avance del escaneo.'));
        }
      }, 2000);
    } catch (err: unknown) {
      setProcesando(false);
      setError(axiosErrorMessage(err, 'No se pudo procesar el archivo.'));
    }
  }, [iniciar, consultarProgreso, consultarResultados, detenerPolling]);

  // Reintento: mismo polling, pero conserva los resultados previos y los une al
  // terminar (merge) en lugar de reemplazarlos; cada fila se actualiza en posición.
  const reintentar = useCallback(
    async (lanzar: () => Promise<LoteIniciadoResponse>, merge: (prev: T | null, nuevos: T) => T) => {
      setProcesando(true);
      setError('');
      setProgreso(null);
      try {
        const iniciado = await lanzar();
        setProgreso({ lote_id: iniciado.lote_id, total: iniciado.total, procesados: 0, terminado: false });

        pollingRef.current = setInterval(async () => {
          try {
            const p = await consultarProgreso(iniciado.lote_id);
            setProgreso(p);
            if (p.terminado) {
              detenerPolling();
              const r = await consultarResultados(iniciado.lote_id);
              setRes((prev) => merge(prev, r));
              setProcesando(false);
              setProgreso(null);
            }
          } catch (err: unknown) {
            detenerPolling();
            setProcesando(false);
            setProgreso(null);
            setError(axiosErrorMessage(err, 'No se pudo consultar el avance del escaneo.'));
          }
        }, 2000);
      } catch (err: unknown) {
        setProcesando(false);
        setError(axiosErrorMessage(err, 'No se pudo lanzar el reintento.'));
      }
    },
    [consultarProgreso, consultarResultados, detenerPolling],
  );

  return { procesando, progreso, error, res, ejecutar, reintentar, setError, setRes };
}

/** Barra de avance + documento en curso (visible mientras procesa un lote). */
function ProgresoLoteBar({ progreso }: Readonly<{ progreso: ProgresoLoteResponse | null }>) {
  if (!progreso) return null;
  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{
            width:
              progreso.total > 0 ? `${Math.round((progreso.procesados / progreso.total) * 100)}%` : '0%',
          }}
        />
      </div>
      {progreso.actual_doc && (
        <p className="text-xs text-gray-500">
          Consultando {progreso.actual_doc}
          {progreso.estado_actual ? ` · ${progreso.estado_actual}` : ''}…
        </p>
      )}
    </div>
  );
}

/** Evita FormEvent deprecado en tipados React recientes (Sonar S1874). */
type FormSubmitEvent = { preventDefault: () => void };

const TIPOS_DOC = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PEP', label: 'Permiso especial de permanencia' },
  { value: 'PPT', label: 'Permiso por Protección Temporal' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'DNI', label: 'DNI' },
  { value: 'NCS', label: 'Número Ciego SENA' },
];

const ESTADO_LABEL: Record<string, string> = {
  ENCONTRADO: 'Encontrado',
  NO_ENCONTRADO: 'No encontrado',
  NO_VERIFICADO: 'No verificado',
};

const ESTADO_BADGE: Record<string, string> = {
  ENCONTRADO:
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  NO_ENCONTRADO:
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  NO_VERIFICADO:
    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
};

function pillTotal(n: number) {
  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
      Total: {n}
    </span>
  );
}

function pillsResumen(res: { total: number; encontrados: number; no_encontrados: number; no_verificados: number }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {pillTotal(res.total)}
      <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
        Encontrados: {res.encontrados}
      </span>
      <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-950 dark:bg-amber-900/40 dark:text-amber-200">
        No encontrados: {res.no_encontrados}
      </span>
      <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">
        No verificados: {res.no_verificados}
      </span>
    </div>
  );
}

// Une los resultados de un lote (inicial o reintento) conservando el orden de
// las filas originales (clave documento+programa): cada fila se actualiza en su
// misma posición y las filas fuera de la lista nueva se conservan intactas.
function renuevaResultadosInscripciones(
  prev: ConsultarInscripcionesLoteResponse | null,
  nuevos: ConsultarInscripcionesLoteResponse,
): ConsultarInscripcionesLoteResponse {
  const clave = (r: { numero_documento: string; programa_consultado: string }) =>
    `${r.numero_documento}\u0000${r.programa_consultado}`;
  const base = prev?.resultados ?? [];
  const porClave = new Map(nuevos.resultados.map((r) => [clave(r), r]));
  const combinados = base.map((r) => porClave.get(clave(r)) ?? r);
  for (const r of nuevos.resultados) {
    if (!base.some((b) => clave(b) === clave(r))) {
      combinados.push(r);
    }
  }
  const out: ConsultarInscripcionesLoteResponse = {
    total: combinados.length,
    encontrados: 0,
    no_encontrados: 0,
    no_verificados: 0,
    resultados: combinados,
  };
  for (const r of combinados) {
    if (r.estado === 'ENCONTRADO') out.encontrados += 1;
    else if (r.estado === 'NO_ENCONTRADO') out.no_encontrados += 1;
    else out.no_verificados += 1;
  }
  return out;
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function esEmail(v: string) {
  return v.includes('@');
}

function soloDigitos(v: string) {
  return /^\d+$/.test(v.trim());
}

export const ComplementariosInscripcionesPage = () => {
  const [docsFase1, setDocsFase1] = useState<Fase1HandoffDoc[]>(() => leerHandoffFase1()?.documentos ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AcademicCapIcon className="w-7 h-7" aria-hidden /> Sofía · Fase 2 · Programas de formación
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Consulta en SENA Sofía Plus las inscripciones y filtra por nombre del programa. Si viene de Fase 1, el tipo de
          documento ya está detectado (no se vuelve a probar).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {docsFase1.length > 0 && (
            <ContinuacionFase1Panel
              documentos={docsFase1}
              onDescartar={() => {
                limpiarHandoffFase1();
                setDocsFase1([]);
              }}
            />
          )}
          <CredencialesPanel />
          <ConsultaPanel prefijoFase1={docsFase1.length === 1 ? docsFase1[0] : null} />
          <CargaMasivaPanel />
        </div>
        <aside className="space-y-4">
          <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cómo funciona</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Guarde el <strong>número de documento SENA</strong> y contraseña Sofía (no el correo del sistema).
              </li>
              <li>
                El bot inicia sesión, elige <strong>Usuario SENA</strong> y abre Consultar Inscripciones.
              </li>
              <li>Recorre páginas con <strong>Siguiente</strong> y filtra por programa de formación.</li>
              <li>
                Si llegó desde Fase 1, usa el <strong>tipo ya detectado</strong> (sin re-escaneo de tipos).
              </li>
            </ol>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              Cada consulta usa navegador automatizado (puede tardar 30 s–2 min).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ContinuacionFase1Panel = ({
  documentos,
  onDescartar,
}: {
  documentos: Fase1HandoffDoc[];
  onDescartar: () => void;
}) => {
  const [programa, setPrograma] = useState('');
  const { procesando, progreso, error, res, ejecutar, reintentar } =
    useLoteConProgreso<ConsultarInscripcionesLoteResponse>(
    async () => {
      const p = programa.trim();
      if (!p) {
        throw new Error('Indique el nombre del programa de formación.');
      }
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('lote');
      ws.addRow(['numero_documento', 'programa', 'tipo_documento']);
      for (const d of documentos) {
        ws.addRow([d.numero_documento, p, d.tipo_documento]);
      }
      const buffer = await wb.xlsx.writeBuffer();
      const file = new File([buffer], 'fase1_continuacion.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      return apiService.consultarInscripcionesLoteSofia(file);
    },
    (loteId) => apiService.progresoInscripcionesLote(loteId),
    (loteId) => apiService.resultadosInscripcionesLote(loteId),
  );

  const procesar = () => void ejecutar();

  // Reintenta solo los NO_VERIFICADO (por ejemplo si la red se cayó a mitad de
  // la búsqueda de esa persona); los ENCONTRADO y NO_ENCONTRADO son definitivos
  // y se conservan intactos en su fila.
  const noVerificados = (res?.resultados ?? []).filter((r) => r.estado === 'NO_VERIFICADO').length;

  const handleReintentarNoVerificados = async () => {
    const pendientes = (res?.resultados ?? []).filter((r) => r.estado === 'NO_VERIFICADO');
    if (!pendientes.length) return;
    await reintentar(
      () =>
        apiService.reintentarInscripcionesLote(
          pendientes.map((r) => ({ numero_documento: r.numero_documento, programa: r.programa_consultado })),
        ),
      renuevaResultadosInscripciones,
    );
  };

  return (
    <div className="card space-y-4 border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Continuar desde Fase 1</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {documentos.length} persona(s) registrada(s) en Sofía con tipo ya detectado. Indique el programa y consulte sin
        volver a probar tipos de documento.
      </p>
      <div className="overflow-x-auto max-h-40">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
              <th className="py-1 pr-3">Tipo</th>
              <th className="py-1 pr-3">Documento</th>
              <th className="py-1">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => (
              <tr
                key={`${d.tipo_documento}-${d.numero_documento}`}
                className="border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              >
                <td className="py-1 pr-3 font-medium text-emerald-800 dark:text-emerald-300">{d.tipo_documento}</td>
                <td className="py-1 pr-3 font-medium">{d.numero_documento}</td>
                <td className="py-1 text-gray-800 dark:text-gray-200">
                  {d.nombre || [d.nombres, d.primer_apellido, d.segundo_apellido].filter(Boolean).join(' ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <label htmlFor="programa-fase1" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Programa de formación *
        </label>
        <input
          id="programa-fase1"
          className="input-field"
          value={programa}
          onChange={(e) => setPrograma(e.target.value)}
          placeholder="Nombre exacto o parcial del programa en Sofía"
          disabled={procesando}
        />
      </div>
      {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={procesar} disabled={procesando}>
          {procesando ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando programas…{' '}
              {progreso ? `${progreso.procesados}/${progreso.total}` : ''}
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consultar programa (Fase 2)
            </>
          )}
        </button>
        <button type="button" className="btn-secondary" onClick={onDescartar} disabled={procesando}>
          Descartar lista Fase 1
        </button>
      </div>
      <ProgresoLoteBar progreso={progreso} />
      {res && (
        <div className="space-y-3 text-sm">
          {pillsResumen(res)}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-1"
              onClick={handleReintentarNoVerificados}
              disabled={procesando || noVerificados === 0}
            >
              <ArrowPathIcon className={procesando ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden />
              Reintentar no verificados ({noVerificados})
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Reintenta solo los «No verificados» (ej. caída de red). «Encontrado» y «No encontrado» son definitivos.
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-600">
                  <th className="py-2 px-3">Documento</th>
                  <th className="py-2 px-3">Resultado</th>
                  <th className="py-2 px-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {res.resultados.map((r) => (
                  <tr
                    key={`${r.numero_documento}-${r.programa_consultado}`}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{r.numero_documento}</td>
                    <td className="py-2.5 px-3">
                      <span className={ESTADO_BADGE[r.estado] ?? ESTADO_BADGE.NO_VERIFICADO}>
                        {ESTADO_LABEL[r.estado] ?? r.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200 leading-snug">
                      {r.registros?.length
                        ? r.registros.map((x) => `${x.ficha} · ${x.programa} (${x.estado})`).join(' · ')
                        : r.mensaje ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const CredencialesPanel = () => {
  const [estado, setEstado] = useState<CredencialSofiaEstado | null>(null);
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState('CC');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  // Evita que el navegador autocompletes con el correo del login de CDATTG.
  const [docUnlocked, setDocUnlocked] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await apiService.getCredencialSofia();
      // Backend ya descarta correos inválidos; nunca precargar email del sistema.
      const docOk = Boolean(res.tiene && res.usuario && soloDigitos(res.usuario) && !esEmail(res.usuario));
      setEstado(docOk ? res : { tiene: false });
      setEditando(!docOk);
      setUsuario('');
      setPassword('');
      if (!docOk && res.tiene && res.usuario && (esEmail(res.usuario) || !soloDigitos(res.usuario))) {
        setError('Se eliminó una credencial inválida (parece correo del sistema). Ingrese el documento SENA.');
      }
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo cargar el estado de credenciales.'));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const doc = usuario.trim();
    if (!doc || !password) {
      setError('Documento SENA y contraseña son obligatorios.');
      return;
    }
    if (esEmail(doc) || !soloDigitos(doc)) {
      setError('No use el correo de CDATTG. Solo el número de documento de Sofía Plus (dígitos).');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const tipoLabel = TIPOS_DOC.find((t) => t.value === tipo)?.label ?? 'Cédula de Ciudadanía';
      const res = await apiService.guardarCredencialSofia({
        tipo_documento: tipoLabel,
        usuario: doc,
        password,
        rol: 'Usuario SENA',
      });
      setEstado(res);
      setUsuario('');
      setPassword('');
      setEditando(false);
      setDocUnlocked(false);
      setMsg('Credenciales Sofía guardadas.');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudieron guardar las credenciales.'));
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await apiService.eliminarCredencialSofia();
      setEstado({ tiene: false });
      setUsuario('');
      setPassword('');
      setEditando(true);
      setDocUnlocked(false);
      setMsg('Credenciales eliminadas.');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudieron eliminar las credenciales.'));
    } finally {
      setLoading(false);
    }
  };

  if (estado?.tiene && !editando) {
    return (
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyIcon className="w-5 h-5" aria-hidden /> Credenciales SENA Sofía
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Guarda en <code className="text-xs">sofia_credenciales</code> (tabla aparte). No es el usuario con el que
          entró a CDATTG.
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          Documento Sofía activo: <strong>{estado.usuario}</strong>
          {estado.actualizada_en ? ` · actualizada ${estado.actualizada_en}` : ''}
        </p>
        {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1"
            onClick={() => {
              setEditando(true);
              setUsuario('');
              setPassword('');
              setDocUnlocked(false);
              setMsg('');
              setError('');
            }}
            disabled={loading}
          >
            <PencilSquareIcon className="w-4 h-4" aria-hidden /> Actualizar
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1"
            onClick={eliminar}
            disabled={loading}
          >
            <TrashIcon className="w-4 h-4" aria-hidden /> Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="card space-y-4" autoComplete="off">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <KeyIcon className="w-5 h-5" aria-hidden /> Credenciales SENA Sofía
      </h2>
      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-1">
        <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
        Campos vacíos a propósito. Escriba el <strong>documento SENA</strong> (no el correo{' '}
        <em>superadmin@…</em> del sistema).
      </p>

      {/* Señuelos para absorber autocomplete del navegador */}
      <input type="text" name="prevent_user" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden />
      <input
        type="password"
        name="prevent_pass"
        autoComplete="current-password"
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sofia-tipo-doc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de documento SENA
          </label>
          <select
            id="sofia-tipo-doc"
            name="sofia_tipo_doc_operador"
            className="input-field"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            autoComplete="off"
          >
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sofia-doc-operador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de documento SENA
          </label>
          <input
            id="sofia-doc-operador"
            name="sofia_doc_operador_sena"
            type="text"
            inputMode="numeric"
            className="input-field"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.replace(/\D/g, ''))}
            onFocus={() => setDocUnlocked(true)}
            readOnly={!docUnlocked}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            placeholder="Solo dígitos, ej. 1121958542"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sofia-clave-operador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña Sofía Plus
          </label>
          <input
            id="sofia-clave-operador"
            name="sofia_clave_operador_sena"
            type="password"
            className="input-field max-w-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar credenciales'}
        </button>
        {estado?.tiene && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEditando(false);
              setError('');
              setUsuario('');
              setPassword('');
              setDocUnlocked(false);
            }}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

const ConsultaPanel = ({ prefijoFase1 }: Readonly<{ prefijoFase1: Fase1HandoffDoc | null }>) => {
  const [programa, setPrograma] = useState('');
  const [numero, setNumero] = useState(prefijoFase1?.numero_documento ?? '');
  const [tipo, setTipo] = useState(prefijoFase1?.tipo_documento || 'CC');
  const [autoTipo, setAutoTipo] = useState(!prefijoFase1?.tipo_documento);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ConsultarInscripcionesResponse | null>(null);

  useEffect(() => {
    if (!prefijoFase1) return;
    setNumero(prefijoFase1.numero_documento);
    if (prefijoFase1.tipo_documento) {
      setTipo(prefijoFase1.tipo_documento);
      setAutoTipo(false);
    }
  }, [prefijoFase1]);

  const consultar = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const p = programa.trim();
    const n = numero.trim();
    if (!p || !n) {
      setError('Programa de formación y número de documento son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await apiService.consultarInscripcionesSofia({
        programa: p,
        numero_documento: n,
        tipo_documento: autoTipo ? '' : tipo,
      });
      setResultado(res);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo completar la consulta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={consultar} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consulta individual
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="programa-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Programa de formación *
          </label>
          <input
            id="programa-insc"
            type="text"
            className="input-field"
            placeholder="Ej. TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="numero-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de identificación del aprendiz *
          </label>
          <input
            id="numero-insc"
            type="text"
            inputMode="numeric"
            className="input-field"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tipo-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de identificación
          </label>
          <select
            id="tipo-insc"
            className="input-field"
            value={tipo}
            disabled={autoTipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoTipo}
              onChange={(e) => setAutoTipo(e.target.checked)}
            />
            <span>Probar tipos automáticamente</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando Sofía…
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consultar
          </>
        )}
      </button>

      {resultado && <ResultadoInscripciones res={resultado} />}
    </form>
  );
};

const CargaMasivaPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [descargando, setDescargando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { procesando, progreso, error, res, ejecutar, reintentar, setError, setRes } =
    useLoteConProgreso<ConsultarInscripcionesLoteResponse>(
      async () => {
        if (!file) {
          throw new Error('Seleccione el Excel con documento y programa de formación.');
        }
        return apiService.consultarInscripcionesLoteSofia(file);
      },
      (loteId) => apiService.progresoInscripcionesLote(loteId),
      (loteId) => apiService.resultadosInscripcionesLote(loteId),
    );

  // Une los resultados de un lote (inicial o reintento) conservando el orden de
  // las filas originales (clave documento+programa): cada fila se actualiza en
  // su misma posición.
  // (renuevaResultadosInscripciones es compartida con el panel de continuación.)

  // Reintenta solo los NO_VERIFICADO / NO_ENCONTRADO (los ENCONTRADO se dejan
  // intactos en su fila). Al terminar, cada fila se actualiza en su posición.
  const handleReintentarPendientes = async () => {
    const pendientes = (res?.resultados ?? []).filter(
      (r) => r.estado === 'NO_VERIFICADO' || r.estado === 'NO_ENCONTRADO',
    );
    if (!pendientes.length) return;
    await reintentar(
      () =>
        apiService.reintentarInscripcionesLote(
          pendientes.map((r) => ({ numero_documento: r.numero_documento, programa: r.programa_consultado })),
        ),
      renuevaResultadosInscripciones,
    );
  };

  const handleDescargarPlantilla = async () => {
    setDescargando(true);
    setError('');
    try {
      const blob = await apiService.descargarPlantillaInscripciones();
      descargarBlob(blob, 'plantilla_consulta_inscripciones.xlsx');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo descargar la plantilla.'));
    } finally {
      setDescargando(false);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError('');
    setRes(null);
  };

  const handleProcesar = () => void ejecutar();

  const handleExportarCSV = () => {
    if (!res) return;
    const filas = [
      ['numero_documento', 'programa_consultado', 'estado', 'ficha', 'programa', 'estado_inscripcion', 'mensaje'],
      ...res.resultados.flatMap((r) => {
        if (!r.registros?.length) {
          return [[
            r.numero_documento,
            r.programa_consultado,
            ESTADO_LABEL[r.estado] ?? r.estado,
            '',
            '',
            '',
            r.mensaje ?? '',
          ]];
        }
        return r.registros.map((reg) => [
          r.numero_documento,
          r.programa_consultado,
          ESTADO_LABEL[r.estado] ?? r.estado,
          reg.ficha,
          reg.programa,
          reg.estado,
          r.mensaje ?? '',
        ]);
      }),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    descargarBlob(
      new Blob([String.fromCodePoint(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }),
      'resultados_inscripciones_sofia.csv',
    );
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Carga masiva por Excel
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Columnas: <strong>numero_documento</strong>, <strong>programa</strong>, <strong>tipo_documento</strong>{' '}
        (opcional). Un solo login Sofía; las filas se consultan en secuencia.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-secondary flex items-center gap-1"
          onClick={handleDescargarPlantilla}
          disabled={descargando}
        >
          <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar plantilla
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          disabled={procesando}
          className="text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button
        type="button"
        className="btn-primary flex items-center gap-2"
        onClick={handleProcesar}
        disabled={procesando || !file}
      >
        {procesando ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando lote en Sofía…{' '}
            {progreso ? `${progreso.procesados}/${progreso.total}` : ''}
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Procesar archivo
          </>
        )}
      </button>
      <ProgresoLoteBar progreso={progreso} />

      {res && (
        <div className="space-y-3">
          {pillsResumen(res)}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary flex items-center gap-1"
              onClick={handleReintentarPendientes}
              disabled={procesando || !res.resultados.some((r) => r.estado === 'NO_VERIFICADO' || r.estado === 'NO_ENCONTRADO')}
            >
              <ArrowPathIcon className={procesando ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden />
              Reintentar pendientes (
              {res.resultados.filter((r) => r.estado === 'NO_VERIFICADO' || r.estado === 'NO_ENCONTRADO').length})
            </button>
            <button type="button" className="btn-secondary flex items-center gap-1" onClick={handleExportarCSV}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar resultados (CSV)
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-600">
                  <th className="py-2 px-3">Documento</th>
                  <th className="py-2 px-3">Programa consultado</th>
                  <th className="py-2 px-3">Resultado</th>
                  <th className="py-2 px-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {res.resultados.map((r) => (
                  <tr
                    key={`${r.numero_documento}-${r.programa_consultado}`}
                    className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{r.numero_documento}</td>
                    <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100">{r.programa_consultado}</td>
                    <td className="py-2.5 px-3">
                      <span className={ESTADO_BADGE[r.estado] ?? ESTADO_BADGE.NO_VERIFICADO}>
                        {ESTADO_LABEL[r.estado] ?? r.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200 leading-snug">
                      {r.registros?.length
                        ? r.registros.map((x) => `${x.ficha} · ${x.programa} (${x.estado})`).join(' · ')
                        : r.mensaje ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultadoInscripciones = ({ res }: Readonly<{ res: ConsultarInscripcionesResponse }>) => {
  let icon = <ExclamationTriangleIcon className="w-6 h-6 text-red-600" aria-hidden />;
  if (res.estado === 'ENCONTRADO') {
    icon = <CheckCircleIcon className="w-6 h-6 text-green-600" aria-hidden />;
  } else if (res.estado === 'NO_ENCONTRADO') {
    icon = <XCircleIcon className="w-6 h-6 text-amber-600" aria-hidden />;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {ESTADO_LABEL[res.estado] ?? res.estado}
            {res.tipo_encontrado ? ` · ${res.tipo_encontrado}` : ''}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Documento {res.numero_documento} · Programa {res.programa_consultado}
          </p>
          {res.mensaje && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{res.mensaje}</p>}
        </div>
      </div>

      {res.registros?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 font-medium">Ficha</th>
                <th className="py-2 pr-4 font-medium">Programa de formación</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {res.registros.map((r, i) => (
                <tr key={`${r.ficha}-${r.estado}-${i}`} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{r.ficha}</td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{r.programa}</td>
                  <td className="py-2 text-gray-900 dark:text-white">{r.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
