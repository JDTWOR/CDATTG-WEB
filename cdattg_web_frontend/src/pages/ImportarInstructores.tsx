import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { SelectSearch } from '../components/SelectSearch';
import type { InstructorImportLogItem, InstructorImportResult, RegionalItem } from '../types';

const ACCEPTED_FORMATS = '.xlsx,.xls';

export const ImportarInstructores = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [lastResult, setLastResult] = useState<InstructorImportResult | null>(null);
  const [imports, setImports] = useState<InstructorImportLogItem[]>([]);
  const [loadingImports, setLoadingImports] = useState(true);
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [regionalId, setRegionalId] = useState<number | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImports = async () => {
    try {
      setLoadingImports(true);
      const data = await apiService.getInstructorImports(50);
      setImports(data);
    } catch {
      setImports([]);
    } finally {
      setLoadingImports(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, []);

  useEffect(() => {
    apiService.getCatalogosRegionales().then(setRegionales).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setImportError('');
    setLastResult(null);
  };

  const handleStartImport = async () => {
    if (!file) {
      setImportError('Seleccione un archivo.');
      return;
    }
    const ext = file.name.toLowerCase().slice(-5);
    if (!ext.includes('xlsx') && !ext.includes('xls')) {
      setImportError('Solo se permiten archivos XLSX o XLS.');
      return;
    }
    setImporting(true);
    setImportError('');
    setLastResult(null);
    try {
      const rid = regionalId === '' ? undefined : Number(regionalId);
      const result = await apiService.uploadInstructoresImport(file, rid);
      setLastResult(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchImports();
    } catch (err: any) {
      setImportError(err?.message || err?.response?.data?.error || 'Error al importar.');
    } finally {
      setImporting(false);
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
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400">
          <HomeIcon className="w-4 h-4" /> Inicio
        </Link>
        <span>/</span>
        <Link to="/instructores" className="hover:text-primary-600 dark:hover:text-primary-400">Instructores</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Importar</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BriefcaseIcon className="w-8 h-8 text-primary-600" />
        Importar Instructores
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Carga masiva de instructores desde Excel (contratistas regulares). Se crean personas si no existen y se vinculan como instructores.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpTrayIcon className="w-5 h-5" /> Cargar archivo
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
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
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Formatos: XLSX o XLS. El archivo debe tener columnas: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.
              </p>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regional por defecto (opcional)</label>
                <SelectSearch
                  options={regionales.map((r) => ({ value: r.id, label: r.nombre }))}
                  value={regionalId === '' ? undefined : regionalId}
                  onChange={(v) => setRegionalId(v ?? '')}
                  placeholder="Sin asignar"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleStartImport}
                  disabled={importing || !file}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <PlayIcon className="w-5 h-5" />
                  {importing ? 'Importando...' : 'Iniciar importación'}
                </button>
              </div>
            </div>
            {importError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {importError}
              </div>
            )}
            {lastResult && (
              <div className="mt-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Importación finalizada</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div><span className="font-semibold text-green-800 dark:text-green-200">{lastResult.processed_count}</span> creados</div>
                  <div><span className="font-semibold text-amber-700 dark:text-amber-300">{lastResult.duplicates_count}</span> duplicados</div>
                  <div><span className="font-semibold text-red-700 dark:text-red-300">{lastResult.error_count}</span> errores</div>
                  <div><span className="font-semibold text-green-700 dark:text-green-300">{lastResult.status}</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-amber-500" /> Buenas prácticas
            </h2>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400 text-sm list-disc list-inside">
              <li>La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.</li>
              <li>Tipo de documento: use &quot;Cédula de Ciudadanía&quot;, &quot;CC&quot;, o el nombre completo del tipo según el catálogo.</li>
              <li>Si la persona no existe se crea; si ya es instructor se cuenta como duplicado y no se genera error.</li>
              <li>Puede asignar una regional por defecto para todos los instructores importados en esta carga.</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" /> Historial de importaciones
          </h2>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchImports}
              disabled={loadingImports}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Actualizar"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loadingImports ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            {loadingImports ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
            ) : imports.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Aún no hay importaciones registradas.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
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
