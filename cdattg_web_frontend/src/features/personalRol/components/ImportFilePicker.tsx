/**
 * @module features/personalRol/components/ImportFilePicker
 * @description Carga del archivo Excel, descarga de plantilla y resumen del resultado.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { ArrowUpTrayIcon, DocumentArrowDownIcon, PlayIcon } from '@heroicons/react/24/outline';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { PersonalRolModuleConfig } from '../config';
import type { PersonalRolImportResult } from '../types';
import { ImportResultCard } from './ImportResultCard';

const ACCEPTED_FORMATS = '.xlsx,.xls';
const EXTENSIONES_PERMITIDAS = new Set(['xlsx', 'xls']);
const FORMATO_COLUMNAS = 'NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO';

interface ImportFilePickerProps {
  config: PersonalRolModuleConfig;
  onImported: () => void;
}

/**
 * Formulario de carga: selección de archivo, botón de importación y descarga de plantilla.
 * @param props config del módulo y callback tras una importación exitosa.
 */
export function ImportFilePicker({ config, onImported }: Readonly<ImportFilePickerProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [lastResult, setLastResult] = useState<PersonalRolImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setImportError('');
    setLastResult(null);
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
    try {
      const result = await config.api.upload(file);
      setLastResult(result);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onImported();
    } catch (err: unknown) {
      setImportError(axiosErrorMessage(err, 'Error al importar.'));
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await config.api.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = config.templateFilename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setImportError('No se pudo descargar la plantilla.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Cargar archivo
      </h2>
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="rol-import-archivo" className="sr-only">
            Archivo Excel (XLSX o XLS)
          </label>
          <input
            id="rol-import-archivo"
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleFileChange}
            className="hidden"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Formatos: XLSX o XLS. Columnas: {FORMATO_COLUMNAS}.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" aria-hidden />
            {downloadingTemplate ? 'Generando...' : 'Descargar plantilla'}
          </button>
          <button
            type="button"
            onClick={handleStartImport}
            disabled={importing || !file}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlayIcon className="w-5 h-5" aria-hidden />
            {importing ? 'Importando...' : 'Iniciar importación'}
          </button>
        </div>
      </div>
      {importError && (
        <div
          role="alert"
          className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
        >
          {importError}
        </div>
      )}
      {lastResult && <ImportResultCard result={lastResult} />}
    </div>
  );
}