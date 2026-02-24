import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowUpTrayIcon, PlayIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import type { ProgramaImportResult } from '../types';

const ACCEPTED_FORMATS = '.xlsx,.xls';

export const ImportarProgramas = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [lastResult, setLastResult] = useState<ProgramaImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await apiService.uploadProgramasImport(file);
      setLastResult(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err?.response?.data?.error || err?.message || 'Error al importar.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400">
          <HomeIcon className="w-4 h-4" /> Inicio
        </Link>
        <span>/</span>
        <Link to="/programas" className="hover:text-primary-600 dark:hover:text-primary-400">Programas</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Importar</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Importar programas de formación
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Carga desde el Excel catálogo. Se importan solo programas <strong>Técnico</strong> y <strong>Tecnólogo</strong>, manteniendo la versión más alta por código. Se crean automáticamente las redes de conocimiento que no existan.
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
                Formatos permitidos: XLSX o XLS. El archivo debe ser el catálogo con columnas PRF_CODIGO, PRF_VERSION, PRF_DENOMINACION, NIVEL DE FORMACION, Red de Conocimiento, etc.
              </p>
              <button
                onClick={handleStartImport}
                disabled={importing || !file}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                {importing ? 'Importando...' : 'Iniciar importación'}
              </button>
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
                  <div><span className="font-semibold text-blue-700 dark:text-blue-300">{lastResult.redes_created}</span> redes creadas</div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-amber-500" /> Notas
            </h2>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400 text-sm list-disc list-inside">
              <li>Solo se importan filas con <strong>NIVEL DE FORMACION</strong> = TÉCNICO o TECNÓLOGO.</li>
              <li>Por cada código de programa (PRF_CODIGO) se guarda una sola fila: la de <strong>mayor versión</strong> (PRF_VERSION).</li>
              <li>Las redes de conocimiento que no existan en el sistema se crean automáticamente.</li>
              <li>Si un programa con el mismo código ya existe, se cuenta como duplicado y no se actualiza.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
