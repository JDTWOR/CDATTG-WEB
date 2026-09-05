import { useState, useEffect, useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DASHBOARD_PATH, fichasPaths } from '../routes/paths';
import { asistenciaFichaPath } from './asistencia/asistenciaPaths';
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { useAuth } from '../context/AuthContext';
import { SelectSearch } from '../components/SelectSearch';
import { ModalAsignarFicha } from '../components/ModalAsignarFicha';
import { FichaFormModal } from '../components/FichaFormModal';
import { FichaCaracterizacionCard } from '../components/FichaCaracterizacionCard';
import { FichasAdminTable } from './fichas/FichasAdminTable';
import { mergeListAfterSave } from '../utils/fichaCaracterizacionForm';
import { canProgramarInstructores } from '../utils/programacionPermissions';
import {
  labelTipoFormacion,
  normalizeTipoFormacion,
  TIPO_FORMACION,
  type TipoFormacion,
} from '../constants/tipoFormacion';
import type {
  FichaCaracterizacionResponse,
  FichaImportResult,
  ProgramaFormacionResponse,
  DiaFormacionItem,
} from '../types';

function tipoFormacionDesdePath(pathname: string): TipoFormacion {
  if (pathname.startsWith(fichasPaths.mediaTecnica)) return TIPO_FORMACION.MEDIA_TECNICA;
  if (pathname.startsWith(fichasPaths.complementaria)) return TIPO_FORMACION.COMPLEMENTARIA;
  return TIPO_FORMACION.REGULAR;
}

const EXT_EXCEL_IMPORT = new Set(['.xlsx', '.xls']);

function esExtensionExcelImportValida(file: File): boolean {
  const nameLower = file.name.toLowerCase();
  const dot = nameLower.lastIndexOf('.');
  const ext = dot >= 0 ? nameLower.slice(dot) : '';
  return EXT_EXCEL_IMPORT.has(ext);
}

function descargarExcelDesdeBase64(base64: string, nombreArchivo: string): void {
  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.codePointAt(i) ?? 0;
    }
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Reintento manual posible vía nueva importación
  }
}

function filtrarListaFichasInstructor(
  list: FichaCaracterizacionResponse[],
  esInstructor: boolean,
  searchQuery: string
): FichaCaracterizacionResponse[] {
  if (!esInstructor || !searchQuery.trim()) return list;
  const q = searchQuery.toLowerCase();
  return list.filter(
    (f) =>
      (f.programa_formacion_nombre?.toLowerCase().includes(q) ?? false) || f.ficha.toLowerCase().includes(q)
  );
}

function nombreArchivoExportFichas(tipoFormacion: TipoFormacion): string {
  if (tipoFormacion === TIPO_FORMACION.MEDIA_TECNICA) return 'fichas_media_tecnica.xlsx';
  if (tipoFormacion === TIPO_FORMACION.COMPLEMENTARIA) return 'fichas_formacion_complementaria.xlsx';
  return 'fichas_aprendices.xlsx';
}

async function exportarBlobExcelFichas(
  tipoFormacion: TipoFormacion,
  setExportLoading: (v: boolean) => void
): Promise<void> {
  try {
    setExportLoading(true);
    const blob = await apiService.exportAllFichasExcel(tipoFormacion);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivoExportFichas(tipoFormacion);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    alert(axiosErrorMessage(err, 'Error al exportar fichas'));
  } finally {
    setExportLoading(false);
  }
}

type ImportFichasParams = Readonly<{
  importFile: File | null;
  tipoFormacion: TipoFormacion;
  setImportError: (msg: string) => void;
  setImportResult: (r: FichaImportResult | null) => void;
  setImportLoading: (v: boolean) => void;
  fetchList: () => void | Promise<void>;
}>;

async function ejecutarImportFichasExcel(p: ImportFichasParams): Promise<void> {
  const { importFile, tipoFormacion, setImportError, setImportResult, setImportLoading, fetchList } = p;
  if (!importFile) {
    setImportError('Seleccione un archivo Excel.');
    return;
  }
  if (!esExtensionExcelImportValida(importFile)) {
    setImportError('Solo se permiten archivos XLSX o XLS.');
    return;
  }
  setImportError('');
  setImportResult(null);
  setImportLoading(true);
  try {
    const result = await apiService.uploadFichasImport(importFile, tipoFormacion);
    setImportResult(result);
    await fetchList();
  } catch (err: unknown) {
    setImportError(axiosErrorMessage(err, 'Error al importar'));
  } finally {
    setImportLoading(false);
  }
}

async function descargarPlantillaImportFicha(setImportError: (msg: string) => void): Promise<void> {
  try {
    setImportError('');
    const blob = await apiService.downloadFichasImportTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_importar_ficha.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    setImportError(axiosErrorMessage(err, 'Error al descargar la plantilla'));
  }
}

function FichasInstructorSinFichas() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fichas de formación</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Gestión de fichas de formación</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-8 md:p-12 text-center max-w-xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes fichas asignadas</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">No se encontraron fichas de formación asignadas a tu cuenta.</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Contacta al administrador para que te asigne las fichas correspondientes.</p>
        <Link
          to={DASHBOARD_PATH}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

type FichasInstructorConFichasProps = Readonly<{
  filteredList: FichaCaracterizacionResponse[];
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}>;

function FichasInstructorConFichas({ filteredList, searchQuery, setSearchQuery }: FichasInstructorConFichasProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fichas de formación</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Gestión de fichas de formación</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </span>
        <input
          id="fichas-instructor-search"
          type="text"
          placeholder="Buscar por programa o número"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredList.map((item) => (
          <FichaCaracterizacionCard
            key={item.id}
            ficha={item}
            showStatusBadge
            actions={
              <>
                <Link
                  to={fichasPaths.detalle(item.ficha, item.tipo_formacion)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700/50"
                >
                  <EyeIcon className="h-4 w-4" />
                  Ver ficha
                </Link>
                {item.status ? (
                  <Link
                    to={asistenciaFichaPath(item.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    <CalendarDaysIcon className="h-4 w-4" />
                    Tomar Asistencia
                  </Link>
                ) : null}
              </>
            }
          />
        ))}
      </div>
      {filteredList.length === 0 && searchQuery.trim() && (
        <p className="text-center text-gray-500 py-8">No hay fichas que coincidan con la búsqueda.</p>
      )}
    </div>
  );
}

export const FichasCaracterizacion = () => {
  const { roles, hasPermission } = useAuth();
  const location = useLocation();
  const tipoFormacion = useMemo(() => tipoFormacionDesdePath(location.pathname), [location.pathname]);
  const tituloTipo = labelTipoFormacion(tipoFormacion);
  const permiteImportExport = true;
  const mostrarFiltroPrograma = tipoFormacion === TIPO_FORMACION.REGULAR;
  const puedeProgramarInstructores = canProgramarInstructores(roles, hasPermission);
  const [list, setList] = useState<FichaCaracterizacionResponse[]>([]);
  const [programas, setProgramas] = useState<ProgramaFormacionResponse[]>([]);
  const [diasFormacion, setDiasFormacion] = useState<DiaFormacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveBanner, setSaveBanner] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [programaId, setProgramaId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FichaCaracterizacionResponse | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<FichaImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [modalAsignar, setModalAsignar] = useState<{ ficha: FichaCaracterizacionResponse; tipo: 'instructores' | 'aprendices' } | null>(null);

  const esInstructor = roles.some((r) => r.toUpperCase() === 'INSTRUCTOR');

  const fetchProgramas = async () => {
    try {
      const res = await apiService.getProgramasFormacion(1, 200);
      setProgramas(res.data);
    } catch {
      setProgramas([]);
    }
  };

  const fetchDiasFormacionCat = async () => {
    try {
      const d = await apiService.getCatalogosDiasFormacion();
      setDiasFormacion(d);
    } catch {
      setDiasFormacion([]);
    }
  };

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const id = programaId === '' ? undefined : programaId;
      const response = await apiService.getFichasCaracterizacion(
        page,
        pageSize,
        id,
        esInstructor,
        searchQuery.trim() || undefined,
        tipoFormacion,
      );
      setList(response.data);
      setTotal(response.total);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'Error al cargar fichas'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, programaId, esInstructor, searchQuery, tipoFormacion]);

  useEffect(() => {
    fetchProgramas();
    void fetchDiasFormacionCat();
  }, []);

  useEffect(() => {
    setPage(1);
    setProgramaId('');
    setSearchQuery('');
  }, [tipoFormacion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchList();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, programaId, esInstructor, searchQuery, tipoFormacion, fetchList]);

  const openCreate = () => {
    setEditing(null);
    setSaveBanner('');
    setIsModalOpen(true);
  };

  const openEdit = (item: FichaCaracterizacionResponse) => {
    setSaveBanner('');
    setEditing(item);
    setIsModalOpen(true);
  };

  const handleFichaSaved = (saved: FichaCaracterizacionResponse) => {
    setList((prev) => mergeListAfterSave(prev, saved, editing));
    setSaveBanner(
      'Ficha guardada. Los días de formación quedan en la columna «Días» de la tabla y al volver a editar.'
    );
    globalThis.setTimeout(() => setSaveBanner(''), 10000);
    void fetchList();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta ficha?')) return;
    try {
      await apiService.deleteFichaCaracterizacion(id);
      fetchList();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al eliminar'));
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = () =>
    ejecutarImportFichasExcel({
      importFile,
      tipoFormacion,
      setImportError,
      setImportResult,
      setImportLoading,
      fetchList,
    });

  const handleDownloadIncidencias = () => {
    if (!importResult?.incident_report_base64) return;
    descargarExcelDesdeBase64(importResult.incident_report_base64, 'reporte_incidencias_ficha.xlsx');
  };

  const handleDownloadPlantilla = () => descargarPlantillaImportFicha(setImportError);

  const handleExportAllFichas = () => exportarBlobExcelFichas(tipoFormacion, setExportLoading);

  const totalPages = Math.ceil(total / pageSize);

  const filteredList = filtrarListaFichasInstructor(list, esInstructor, searchQuery);

  if (esInstructor && !loading && list.length === 0) {
    return <FichasInstructorSinFichas />;
  }

  if (esInstructor && !loading && list.length > 0) {
    return (
      <FichasInstructorConFichas
        filteredList={filteredList}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    );
  }

  // Vista admin: tabla y gestión completa
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Fichas · {tituloTipo}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-base">
            Gestión de fichas de {tituloTipo.toLowerCase()}
            {!loading && total > 0 ? (
              <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {total} {total === 1 ? 'ficha' : 'fichas'}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {permiteImportExport && (
            <>
              <button onClick={handleExportAllFichas} disabled={exportLoading} className="btn-secondary disabled:opacity-50">
                <ArrowDownTrayIcon className="mr-2 inline h-5 w-5" />
                {exportLoading ? 'Exportando...' : 'Exportar'}
              </button>
              <button onClick={openImportModal} className="btn-secondary">
                <ArrowUpTrayIcon className="mr-2 inline h-5 w-5" />
                Importar
              </button>
            </>
          )}
          <button onClick={openCreate} className="btn-primary">
            <PlusIcon className="mr-2 inline h-5 w-5" />
            Nueva ficha
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {saveBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 px-4 py-3 rounded-lg text-sm">
          {saveBanner}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
        <div className="w-full sm:w-auto flex-1 min-w-[250px]">
          <label
            htmlFor="fichas-admin-search"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Buscar ficha
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="fichas-admin-search"
              type="text"
              placeholder="Buscar por código de ficha o programa..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white transition-shadow"
            />
          </div>
        </div>
        {mostrarFiltroPrograma && (
          <div className="w-full sm:w-auto min-w-[250px]">
            <label
              htmlFor="fichas-admin-programa"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Filtrar por Programa
            </label>
            <SelectSearch
              inputId="fichas-admin-programa"
              options={[
                { value: 0, label: 'Todos los programas' },
                ...programas.map((p) => ({
                  value: p.id,
                  label: p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre,
                })),
              ]}
              value={programaId === '' ? 0 : programaId}
              onChange={(v) => {
                setProgramaId(v === 0 || v === undefined ? '' : v);
                setPage(1);
              }}
              placeholder="Todos los programas"
            />
          </div>
        )}
      </div>

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-600 dark:text-gray-400">Cargando fichas...</div>
        ) : (
          <>
            <div className="p-4 sm:p-6">
              <FichasAdminTable
                list={list}
                diasFormacion={diasFormacion}
                puedeProgramarInstructores={puedeProgramarInstructores}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAsignar={setModalAsignar}
              />
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-600 sm:px-6">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {page} de {totalPages} · {total} fichas
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <FichaFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editing={editing}
        onSaved={handleFichaSaved}
        inputIdPrefix="fichas-list"
        defaultTipoFormacion={normalizeTipoFormacion(tipoFormacion)}
      />

      {isImportModalOpen && permiteImportExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Importar fichas · {tituloTipo}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Suba un Excel (XLSX o XLS) con el reporte de aprendices. Debe incluir la línea «Ficha de Caracterización» con código y nombre de la formación (no se liga al catálogo de programas), y las columnas Tipo de Documento, Número de Documento, Nombre, Apellidos, Celular y Correo.
            </p>
            <button
              type="button"
              onClick={() => void handleDownloadPlantilla()}
              className="mb-4 inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
            >
              <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
              Descargar plantilla Excel
            </button>
            {importError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {importError}
              </div>
            )}
            {importResult && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm space-y-1">
                <p><strong>Resultado:</strong> {importResult.status}</p>
                <p>Aprendices agregados a la ficha: {importResult.processed_count}</p>
                <p>Personas creadas: {importResult.created_count} · Actualizadas: {importResult.updated_count}</p>
                {importResult.duplicates_count > 0 && <p>Registros no agregados por estar ya inscritos: {importResult.duplicates_count}</p>}
                {importResult.error_count > 0 && <p>Errores al crear/actualizar personas: {importResult.error_count}</p>}
                {importResult.ficha_created && <p>Se creó la ficha en esta importación.</p>}
                {importResult.incident_report_base64 && (
                  <button
                    type="button"
                    onClick={handleDownloadIncidencias}
                    className="mt-2 inline-flex items-center rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-primary-700 shadow-sm ring-1 ring-inset ring-primary-200 hover:bg-white"
                  >
                    Descargar reporte de incidencias (Excel)
                  </button>
                )}
              </div>
            )}
            <div className="mb-4">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setIsImportModalOpen(false); setImportResult(null); setImportError(''); }}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importLoading}
                className="btn-primary disabled:opacity-50"
              >
                {importLoading ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAsignar && (
        <ModalAsignarFicha
          fichaId={modalAsignar.ficha.id}
          fichaNombre={modalAsignar.ficha.ficha}
          tipo={modalAsignar.tipo}
          onClose={() => setModalAsignar(null)}
          onSuccess={() => fetchList()}
        />
      )}
    </div>
  );
};
