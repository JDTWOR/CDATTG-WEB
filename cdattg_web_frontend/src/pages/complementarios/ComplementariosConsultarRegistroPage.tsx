import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { complementariosPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type {
  CredencialSofiaEstado,
  ProgresoLoteResponse,
  VerificarAspiranteResponse,
  VerificarLoteResponse,
} from '../../types';
import {
  documentosRegistradosParaFase2,
  guardarHandoffFase1,
} from './fase1Handoff';
import { tipoSofiaACodigo } from './sofiaTipo';

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
  REGISTRADO: 'Registrado',
  NO_REGISTRADO: 'No registrado',
  NO_VERIFICADO: 'No verificado',
};

const ROL_FASE1 = 'Encargado de ingreso centro formación';

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

function csvEscape(v: string) {
  return `"${String(v).replaceAll('"', '""')}"`;
}

export const ComplementariosConsultarRegistroPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DocumentMagnifyingGlassIcon className="w-7 h-7" aria-hidden /> Sofía · Fase 1 · Consultar Registro
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Verifica si la persona está inscrita en SENA Sofía Plus (rol Encargado de ingreso → SGS → Consultar Registro).
          Los registrados pueden continuar a la Fase 2 (programas de formación) con el tipo ya detectado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CredencialesPanel />
          <ConsultaIndividualPanel />
          <CargaMasivaPanel />
        </div>
        <aside className="space-y-4">
          <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cómo funciona</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Login Sofía con credenciales guardadas.</li>
              <li>
                Rol <strong>Encargado de ingreso centro formación</strong>.
              </li>
              <li>
                Menú <strong>SGS → Consultar Registro</strong>.
              </li>
              <li>
                Tipo de usuario <strong>Persona</strong>; prueba tipos de identificación y número completo.
              </li>
              <li>
                Si está registrado: tipo, número, nombres y apellidos → opción <strong>Continuar Fase 2</strong>.
              </li>
              <li>Si no está en el sistema: se omite para Fase 2.</li>
            </ol>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              Cada consulta usa navegador automatizado (puede tardar 30 s–2 min por documento).
            </p>
          </div>
        </aside>
      </div>
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
  const [docUnlocked, setDocUnlocked] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await apiService.getCredencialSofia();
      const docOk = Boolean(res.tiene && res.usuario && soloDigitos(res.usuario) && !esEmail(res.usuario));
      setEstado(docOk ? res : { tiene: false });
      setEditando(!docOk);
      setUsuario('');
      setPassword('');
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
      setError('Solo el número de documento de Sofía Plus (dígitos).');
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
        rol: ROL_FASE1,
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
      setEditando(true);
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
        <p className="text-sm text-green-700 dark:text-green-400">
          Documento operador: <strong>{estado.usuario}</strong>
          {estado.tipo_documento ? ` · ${estado.tipo_documento}` : ''}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Fase 1 usa el rol Encargado de ingreso automáticamente (aunque la credencial se haya guardado desde Fase 2).
        </p>
        {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={() => setEditando(true)}>
            <PencilSquareIcon className="w-4 h-4" aria-hidden /> Cambiar
          </button>
          <button type="button" className="btn-secondary inline-flex items-center gap-1 text-red-700" onClick={eliminar} disabled={loading}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sofia-tipo-f1" className="block text-sm font-medium mb-1">
            Tipo documento operador
          </label>
          <select id="sofia-tipo-f1" className="input-field" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sofia-doc-f1" className="block text-sm font-medium mb-1">
            Número documento SENA *
          </label>
          <input
            id="sofia-doc-f1"
            className="input-field"
            value={docUnlocked ? usuario : ''}
            onFocus={() => setDocUnlocked(true)}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="off"
            inputMode="numeric"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sofia-pass-f1" className="block text-sm font-medium mb-1">
            Contraseña Sofía *
          </label>
          <input
            id="sofia-pass-f1"
            type="password"
            className="input-field max-w-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar credenciales'}
      </button>
    </form>
  );
};

const ConsultaIndividualPanel = () => {
  const navigate = useNavigate();
  const [numero, setNumero] = useState('');
  const [tipo, setTipo] = useState('CC');
  const [autoTipo, setAutoTipo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<VerificarAspiranteResponse | null>(null);

  const consultar = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const n = numero.trim();
    if (!n) {
      setError('Ingrese el número de identificación completo.');
      return;
    }
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await apiService.verificarAspirante({
        numero_documento: n,
        tipo_documento: autoTipo ? '' : tipo,
      });
      setResultado(res);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo completar la verificación.'));
    } finally {
      setLoading(false);
    }
  };

  const continuarFase2 = () => {
    if (resultado?.estado !== 'REGISTRADO') return;
    const docs = documentosRegistradosParaFase2([resultado]);
    if (!docs.length) {
      setError('No se pudo preparar el tipo de documento para Fase 2.');
      return;
    }
    guardarHandoffFase1(docs);
    void navigate(complementariosPaths.inscripciones);
  };

  return (
    <form onSubmit={consultar} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consulta individual
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="numero-f1" className="block text-sm font-medium mb-1">
            Número de identificación *
          </label>
          <input
            id="numero-f1"
            className="input-field"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Completo, sin cortar"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="tipo-f1" className="block text-sm font-medium mb-1">
            Tipo de identificación
          </label>
          <select
            id="tipo-f1"
            className="input-field"
            value={tipo}
            disabled={autoTipo || loading}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoTipo}
              onChange={(e) => setAutoTipo(e.target.checked)}
              disabled={loading}
            />
            <span>Probar tipos automáticamente</span>
          </label>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando Registro…
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Verificar en Sofía
          </>
        )}
      </button>
      {resultado && (
        <div className="space-y-3">
          <ResultadoCard r={resultado} />
          {resultado.estado === 'REGISTRADO' && (
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={continuarFase2}>
              Continuar Fase 2 <ArrowRightIcon className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </form>
  );
};

const CargaMasivaPanel = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [reintentando, setReintentando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState<VerificarLoteResponse | null>(null);
  const [progreso, setProgreso] = useState<ProgresoLoteResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detenerPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Limpieza al desmontar: nunca dejar un intervalo vivo.
  useEffect(() => detenerPolling, [detenerPolling]);

  // Une los resultados de un lote (inicial o reintento) conservando el orden
  // de las filas originales: cada documento se actualiza en su misma posición.
  const renuevaResultados = useCallback(
    (prev: VerificarLoteResponse | null, nuevos: VerificarLoteResponse): VerificarLoteResponse => {
      const base = prev?.resultados ?? [];
      const porDoc = new Map(nuevos.resultados.map((r) => [r.numero_documento, r]));
      const combinados = base.map((r) => porDoc.get(r.numero_documento) ?? r);
      for (const r of nuevos.resultados) {
        if (!base.some((b) => b.numero_documento === r.numero_documento)) {
          combinados.push(r);
        }
      }
      const out: VerificarLoteResponse = {
        total: combinados.length,
        registrados: 0,
        no_registrados: 0,
        no_verificados: 0,
        resultados: combinados,
      };
      for (const r of combinados) {
        if (r.estado === 'REGISTRADO') out.registrados += 1;
        else if (r.estado === 'NO_REGISTRADO') out.no_registrados += 1;
        else out.no_verificados += 1;
      }
      return out;
    },
    [],
  );

  // Polling del avance del lote (2 s) hasta que termina; alTerminar recibe los resultados.
  const iniciarPolling = useCallback(
    (loteId: string, alTerminar: (r: VerificarLoteResponse) => void) => {
      detenerPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const p = await apiService.progresoLote(loteId);
          setProgreso(p);
          if (p.terminado) {
            detenerPolling();
            const r = await apiService.resultadosLote(loteId);
            alTerminar(r);
            setProcesando(false);
            setReintentando(false);
            setProgreso(null);
          }
        } catch (err: unknown) {
          detenerPolling();
          setProcesando(false);
          setReintentando(false);
          setProgreso(null);
          setError(axiosErrorMessage(err, 'No se pudo consultar el avance del escaneo.'));
        }
      }, 2000);
    },
    [detenerPolling],
  );

  const handleDescargarPlantilla = async () => {
    setDescargando(true);
    setError('');
    try {
      const blob = await apiService.descargarPlantillaLote();
      descargarBlob(blob, 'plantilla_consultar_registro_sofia.xlsx');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo descargar la plantilla.'));
    } finally {
      setDescargando(false);
    }
  };

  const handleProcesar = async () => {
    if (!file) {
      setError('Seleccione el Excel con numero_documento.');
      return;
    }
    setProcesando(true);
    setError('');
    setRes(null);
    setProgreso(null);
    try {
      const iniciado = await apiService.verificarLote(file);
      setProgreso({ lote_id: iniciado.lote_id, total: iniciado.total, procesados: 0, terminado: false });
      iniciarPolling(iniciado.lote_id, (r) => setRes(renuevaResultados(null, r)));
    } catch (err: unknown) {
      setProcesando(false);
      setError(axiosErrorMessage(err, 'No se pudo procesar el archivo.'));
    }
  };

  // Reintenta solo los NO_VERIFICADO / NO_REGISTRADO (los REGISTRADO se dejan
  // intactos en su fila). Al terminar, cada fila se actualiza en su posición.
  const handleReintentarPendientes = async () => {
    const pendientes = (res?.resultados ?? []).filter(
      (r) => r.estado === 'NO_VERIFICADO' || r.estado === 'NO_REGISTRADO',
    );
    if (!pendientes.length) return;
    setReintentando(true);
    setProcesando(true);
    setError('');
    setProgreso(null);
    try {
      const iniciado = await apiService.reintentarVerificacionLote(
        pendientes.map((r) => ({ numero_documento: r.numero_documento })),
      );
      setProgreso({ lote_id: iniciado.lote_id, total: iniciado.total, procesados: 0, terminado: false });
      iniciarPolling(iniciado.lote_id, (r) => setRes((prev) => renuevaResultados(prev, r)));
    } catch (err: unknown) {
      setReintentando(false);
      setError(axiosErrorMessage(err, 'No se pudo lanzar el reintento.'));
    }
  };

  const registrados = res?.resultados.filter((r) => r.estado === 'REGISTRADO') ?? [];
  const pendientes =
    res?.resultados.filter((r) => r.estado === 'NO_VERIFICADO' || r.estado === 'NO_REGISTRADO') ?? [];

  const exportarParaFase2 = () => {
    if (!registrados.length) return;
    const filas = [
      ['tipo_documento', 'numero_documento'],
      ...registrados.map((r) => [tipoSofiaACodigo(r.tipo_encontrado), r.numero_documento]),
    ];
    const csv = filas.map((f) => f.map(csvEscape).join(',')).join('\n');
    descargarBlob(
      new Blob([String.fromCodePoint(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }),
      'fase1_para_fase2_tipo_y_documento.csv',
    );
  };

  const exportarResultados = () => {
    if (!res) return;
    const filas = [
      ['numero_documento', 'estado', 'tipo_encontrado', 'nombres', 'primer_apellido', 'segundo_apellido', 'mensaje'],
      ...res.resultados.map((r) => [
        r.numero_documento,
        ESTADO_LABEL[r.estado] ?? r.estado,
        r.tipo_encontrado ?? '',
        r.nombres ?? '',
        r.primer_apellido ?? '',
        r.segundo_apellido ?? '',
        r.mensaje ?? '',
      ]),
    ];
    const csv = filas.map((f) => f.map(csvEscape).join(',')).join('\n');
    descargarBlob(
      new Blob([String.fromCodePoint(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }),
      'resultados_consultar_registro_sofia.csv',
    );
  };

  const continuarFase2 = () => {
    const docs = documentosRegistradosParaFase2(res?.resultados ?? []);
    if (!docs.length) {
      setError('No hay personas registradas para continuar a Fase 2.');
      return;
    }
    guardarHandoffFase1(docs);
    void navigate(complementariosPaths.inscripciones);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Carga masiva (Fase 1)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Columna <strong>numero_documento</strong> (opcional <strong>tipo_documento</strong>). Quienes no estén en Sofía se
        omiten al continuar a Fase 2.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={handleDescargarPlantilla} disabled={descargando}>
          <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Plantilla
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setFile(e.target.files?.[0] ?? null);
            setError('');
            setRes(null);
          }}
          disabled={procesando}
          className="text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={handleProcesar} disabled={procesando || !file}>
        {procesando ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden />{' '}
            {reintentando ? 'Reintentando pendientes en Sofía…' : 'Escaneo completo en Sofía…'}{' '}
            {progreso ? `${progreso.procesados}/${progreso.total}` : ''}
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Ejecutar escaneo completo
          </>
        )}
      </button>

      {procesando && progreso && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-green-600 transition-all duration-500"
              style={{
                width: progreso.total > 0 ? `${Math.round((progreso.procesados / progreso.total) * 100)}%` : '0%',
              }}
            />
          </div>
          {progreso.actual_doc && (
            <p className="text-xs text-gray-500">
              Verificando {progreso.actual_doc}
              {progreso.estado_actual ? ` · ${progreso.estado_actual}` : ''}…
            </p>
          )}
        </div>
      )}

      {res && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">Total: {res.total}</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">Registrados: {res.registrados}</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">No registrados: {res.no_registrados}</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">No verificados: {res.no_verificados}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendientes.length > 0 && (
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-1"
                onClick={handleReintentarPendientes}
                disabled={procesando}
              >
                <ArrowPathIcon className="w-4 h-4" aria-hidden /> Reintentar pendientes ({pendientes.length})
              </button>
            )}
            <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={exportarResultados}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar resultados
            </button>
            {registrados.length > 0 && (
              <>
                <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={exportarParaFase2}>
                  <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar tipo + documento ({registrados.length})
                </button>
                <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={continuarFase2}>
                  Continuar Fase 2 <ArrowRightIcon className="w-4 h-4" aria-hidden />
                </button>
              </>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Documento</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">Nombres</th>
                  <th className="py-2 pr-3">Apellidos</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {res.resultados.map((r) => (
                  <tr key={r.numero_documento} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 font-medium">{r.numero_documento}</td>
                    <td className="py-2 pr-3">{ESTADO_LABEL[r.estado] ?? r.estado}</td>
                    <td className="py-2 pr-3">{r.tipo_encontrado ?? '—'}</td>
                    <td className="py-2 pr-3">{r.nombres || r.nombre || '—'}</td>
                    <td className="py-2 pr-3">
                      {[r.primer_apellido, r.segundo_apellido].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={r.mensaje ?? ''}>
                      {r.mensaje || '—'}
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

const ResultadoCard = ({ r }: { r: VerificarAspiranteResponse }) => {
  let icon = <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" aria-hidden />;
  let box = 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
  let label = 'No verificado';
  if (r.estado === 'REGISTRADO') {
    icon = <CheckCircleIcon className="w-6 h-6 text-green-600" aria-hidden />;
    box = 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    label = 'Registrado en Sofía Plus';
  } else if (r.estado === 'NO_REGISTRADO') {
    icon = <XCircleIcon className="w-6 h-6 text-red-600" aria-hidden />;
    box = 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    label = 'No registrado en el sistema';
  }

  return (
    <div className={`border rounded-lg p-4 ${box}`}>
      <div className="flex items-start gap-2">
        {icon}
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <p>Documento: {r.numero_documento}</p>
          {r.tipo_encontrado && <p>Tipo de identificación: {r.tipo_encontrado}</p>}
          {(r.nombres || r.nombre) && <p>Nombres: {r.nombres || r.nombre}</p>}
          {r.primer_apellido && <p>Primer apellido: {r.primer_apellido}</p>}
          {r.segundo_apellido && <p>Segundo apellido: {r.segundo_apellido}</p>}
          {r.mensaje && <p className="text-gray-600 dark:text-gray-400">{r.mensaje}</p>}
        </div>
      </div>
    </div>
  );
};
