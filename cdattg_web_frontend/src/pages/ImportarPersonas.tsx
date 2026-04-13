import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type { PersonaImportLogItem, PersonaImportResult, PersonaImportProgress } from '../types';

const ACCEPTED_FORMATS = '.xlsx,.xls';
const EXTENSIONES_PERMITIDAS = new Set(['xlsx', 'xls']);

export const ImportarPersonas = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [lastResult, setLastResult] = useState<PersonaImportResult | null>(null);
  const [imports, setImports] = useState<PersonaImportLogItem[]>([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [progress, setProgress] = useState<PersonaImportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImports = useCallback(async () => {
    try {
      setLoadingImports(true);
      const data = await apiService.getPersonaImports(50);
      setImports(data);
    } catch {
      setImports([]);
    } finally {
      setLoadingImports(false);
    }
  }, []);

  useEffect(() => {
    void fetchImports();
  }, [fetchImports]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setImportError('');
    setLastResult(null);
    setProgress(null);
  };

  const handleStartImport = async () => {
    if (!file) {
      setImportError('Seleccione un archivo.');
      return;
    }
    const dot = file.name.lastIndexOf('.');
    const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
    if (!EXTENSIONES_PERMITIDAS.has(ext)) {
      setImportError('Solo se permiten archivos XLSX o XLS.');
      return;
    }
    setImporting(true);
    setImportError('');
    setLastResult(null);
    setProgress(null);
    try {
      const result = await apiService.uploadPersonasImportWithProgress(file, (p) => setProgress(p));
      setLastResult(result);
      setProgress(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchImports();
    } catch (err: unknown) {
      setImportError(axiosErrorMessage(err, 'Error al importar.'));
      setProgress(null);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await apiService.downloadPersonaImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_importar_personas.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setImportError('No se pudo descargar la plantilla.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString('es-CO', { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString('es-CO', { timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* Migas */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400">
          <HomeIcon className="w-4 h-4" aria-hidden /> Inicio
        </Link>
        <span>/</span>
        <Link to="/personas" className="hover:text-primary-600 dark:hover:text-primary-400">Personas</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Importar</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Importar Personas
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Carga masiva desde Excel con validación de duplicados
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Cargar archivo + Buenas prácticas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Cargar archivo
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="imp-per-archivo" className="sr-only">
                  Archivo Excel (XLSX o XLS)
                </label>
                <input
                  id="imp-per-archivo"
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Examinar
                </button>
                <input
                  type="text"
                  readOnly
                  value={file ? file.name : 'Ningún archivo'}
                  className="input-field flex-1 min-w-[200px] max-w-md bg-gray-50 dark:bg-gray-700/50"
                  aria-label="Nombre del archivo seleccionado"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formatos permitidos: XLSX o XLS. El archivo debe contener mínimo los campos básicos para crear la persona.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={importing || !file}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlayIcon className="w-5 h-5" aria-hidden />
                  {importing ? 'Importando...' : 'Iniciar importación'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" aria-hidden />
                  {downloadingTemplate ? 'Descargando...' : 'Descargar plantilla'}
                </button>
              </div>

              {/* Barra de progreso y estadísticas durante la importación */}
              {importing && progress && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ChartBarIcon className="w-5 h-5 text-primary-600" aria-hidden />
                    Progreso de la importación
                  </div>
                  <progress
                    className="w-full h-3 rounded-full overflow-hidden accent-primary-600"
                    max={100}
                    value={
                      progress.total > 0
                        ? Math.min(100, (progress.current / progress.total) * 100)
                        : 0
                    }
                    aria-label="Avance del procesamiento de filas"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Fila {progress.current} de {progress.total} {progress.total > 0 ? `(${Math.round((progress.current / progress.total) * 100)}%)` : ''}
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-green-100 dark:bg-green-900/40 px-3 py-2">
                      <span className="text-green-800 dark:text-green-200 font-semibold">{progress.processed}</span>
                      <span className="text-green-700 dark:text-green-300 ml-1">creados</span>
                    </div>
                    <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 px-3 py-2">
                      <span className="text-amber-800 dark:text-amber-200 font-semibold">{progress.duplicates}</span>
                      <span className="text-amber-700 dark:text-amber-300 ml-1">duplicados</span>
                    </div>
                    <div className="rounded-lg bg-red-100 dark:bg-red-900/40 px-3 py-2">
                      <span className="text-red-800 dark:text-red-200 font-semibold">{progress.errors}</span>
                      <span className="text-red-700 dark:text-red-300 ml-1">errores</span>
                    </div>
                    <div className="rounded-lg bg-gray-200 dark:bg-gray-600 px-3 py-2">
                      <span className="text-gray-800 dark:text-gray-200 font-semibold">{progress.current}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">revisados</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {importError && (
              <div
                role="alert"
                className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
              >
                {importError}
              </div>
            )}
            {lastResult && (
              <output
                aria-live="polite"
                className="mt-3 block w-full p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
              >
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Importación finalizada</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="font-semibold text-green-800 dark:text-green-200">{lastResult.processed_count}</span> creados</div>
                  <div><span className="font-semibold text-amber-700 dark:text-amber-300">{lastResult.duplicates_count}</span> duplicados</div>
                  <div><span className="font-semibold text-red-700 dark:text-red-300">{lastResult.error_count}</span> errores</div>
                  <div><span className="font-semibold text-green-700 dark:text-green-300">{lastResult.status}</span></div>
                </div>
              </output>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-amber-500" aria-hidden /> Buenas prácticas
            </h2>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400 text-sm list-disc list-inside">
              <li>La primera fila debe incluir los encabezados estándares.</li>
              <li>En tipo de documento use los códigos: CC, CE, PPT, TI, RC, SI (Cédula de ciudadanía, Cédula de extranjería, Pasaporte, Tarjeta de identidad, Registro civil, Sin identificación).</li>
              <li>Elimine filas en blanco y valide acentos o caracteres especiales.</li>
              <li>Verifique que el número de documento, el correo y el celular no estén repetidos.</li>
              <li>Los registros incompletos generarán una alerta para completar datos posteriormente.</li>
            </ul>
          </div>
        </div>

        {/* Columna derecha: Incidencias recientes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" aria-hidden /> Incidencias recientes
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchImports}
              disabled={loadingImports}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Actualizar"
              aria-label="Actualizar incidencias recientes"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loadingImports ? 'animate-spin' : ''}`} aria-hidden />
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            {loadingImports && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
            )}
            {!loadingImports && imports.length === 0 && (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Aún no hay importaciones registradas.</p>
            )}
            {!loadingImports && imports.length > 0 && (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                <caption className="sr-only">Incidencias recientes de importación de personas</caption>
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Archivo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Procesados</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duplicados</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {imports.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={log.filename}>{log.filename}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-3 py-2">{log.processed_count}</td>
                      <td className="px-3 py-2">{log.duplicates_count}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          {log.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={log.usuario_nombre}>{log.usuario_nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
