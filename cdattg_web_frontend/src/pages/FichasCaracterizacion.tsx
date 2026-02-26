import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  MapPinIcon,
  ComputerDesktopIcon,
  UserIcon,
  UsersIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SelectSearch } from '../components/SelectSearch';
import { ModalAsignarFicha } from '../components/ModalAsignarFicha';
import type {
  FichaCaracterizacionResponse,
  FichaCaracterizacionRequest,
  FichaImportResult,
  ProgramaFormacionResponse,
  InstructorItem,
  SedeItem,
  AmbienteItem,
  ModalidadFormacionItem,
  JornadaItem,
  DiaFormacionItem,
} from '../types';

export const FichasCaracterizacion = () => {
  const { roles } = useAuth();
  const [list, setList] = useState<FichaCaracterizacionResponse[]>([]);
  const [programas, setProgramas] = useState<ProgramaFormacionResponse[]>([]);
  const [instructores, setInstructores] = useState<InstructorItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteItem[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadFormacionItem[]>([]);
  const [jornadas, setJornadas] = useState<JornadaItem[]>([]);
  const [diasFormacion, setDiasFormacion] = useState<DiaFormacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
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
  const [importResult, setImportResult] = useState<FichaImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [modalAsignar, setModalAsignar] = useState<{ ficha: FichaCaracterizacionResponse; tipo: 'instructores' | 'aprendices' } | null>(null);
  const [form, setForm] = useState<FichaCaracterizacionRequest>({
    programa_formacion_id: 0,
    ficha: '',
    instructor_id: undefined,
    fecha_inicio: undefined,
    fecha_fin: undefined,
    sede_id: undefined,
    modalidad_formacion_id: undefined,
    ambiente_id: undefined,
    jornada_id: undefined,
    total_horas: undefined,
    status: true,
    dias_formacion_ids: [],
  });

  const esInstructor = roles.some((r) => r.toUpperCase() === 'INSTRUCTOR');

  const fetchProgramas = async () => {
    try {
      const res = await apiService.getProgramasFormacion(1, 200);
      setProgramas(res.data);
    } catch (_) {}
  };

  const fetchCatalogos = async () => {
    try {
      const [s, a, m, j, d] = await Promise.all([
        apiService.getCatalogosSedes(),
        apiService.getCatalogosAmbientes(),
        apiService.getCatalogosModalidadesFormacion(),
        apiService.getCatalogosJornadas(),
        apiService.getCatalogosDiasFormacion(),
      ]);
      setSedes(s);
      setAmbientes(a);
      setModalidades(m);
      setJornadas(j);
      setDiasFormacion(d);
    } catch (_) {}
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');
      const id = programaId === '' ? undefined : programaId;
      const response = await apiService.getFichasCaracterizacion(page, pageSize, id, esInstructor);
      setList(response.data);
      setTotal(response.total);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al cargar fichas');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructores = async () => {
    try {
      const data = await apiService.getInstructores();
      setInstructores(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchProgramas();
    fetchInstructores();
    fetchCatalogos();
  }, []);

  useEffect(() => {
    fetchList();
  }, [page, programaId, esInstructor]);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({
      programa_formacion_id: (programas[0]?.id as number) || 0,
      ficha: '',
      instructor_id: undefined,
      fecha_inicio: undefined,
      fecha_fin: undefined,
      sede_id: undefined,
      modalidad_formacion_id: undefined,
      ambiente_id: undefined,
      jornada_id: undefined,
      total_horas: undefined,
      status: true,
      dias_formacion_ids: [],
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: FichaCaracterizacionResponse) => {
    setEditing(item);
    setFormError('');
    setForm({
      programa_formacion_id: item.programa_formacion_id,
      ficha: item.ficha,
      instructor_id: item.instructor_id,
      fecha_inicio: item.fecha_inicio,
      fecha_fin: item.fecha_fin,
      sede_id: item.sede_id,
      modalidad_formacion_id: item.modalidad_formacion_id,
      ambiente_id: item.ambiente_id,
      jornada_id: item.jornada_id,
      total_horas: item.total_horas,
      status: item.status,
      dias_formacion_ids: item.dias_formacion_ids ?? [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editing && (!form.instructor_id || form.instructor_id === 0)) {
      setFormError('El instructor líder es obligatorio.');
      return;
    }
    if (!form.ficha?.trim()) {
      setFormError('El número de ficha es obligatorio.');
      return;
    }
    setFormError('');
    const payload: FichaCaracterizacionRequest = {
      ...form,
      programa_formacion_id: form.programa_formacion_id || (programas[0]?.id as number),
      dias_formacion_ids: form.dias_formacion_ids?.length ? form.dias_formacion_ids : undefined,
    };
    try {
      if (editing) {
        await apiService.updateFichaCaracterizacion(editing.id, payload);
      } else {
        await apiService.createFichaCaracterizacion(payload);
      }
      setIsModalOpen(false);
      fetchList();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar';
      setFormError(msg);
    }
  };

  const toggleDia = (diaId: number) => {
    const ids = form.dias_formacion_ids ?? [];
    const next = ids.includes(diaId) ? ids.filter((id) => id !== diaId) : [...ids, diaId];
    setForm((f) => ({ ...f, dias_formacion_ids: next }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta ficha?')) return;
    try {
      await apiService.deleteFichaCaracterizacion(id);
      fetchList();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al eliminar');
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('Seleccione un archivo Excel.');
      return;
    }
    setImportError('');
    setImportResult(null);
    setImportLoading(true);
    try {
      const result = await apiService.uploadFichasImport(importFile);
      setImportResult(result);
      fetchList();
    } catch (err: unknown) {
      setImportError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al importar');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadIncidencias = () => {
    if (!importResult?.incident_report_base64) return;
    try {
      const binary = atob(importResult.incident_report_base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_incidencias_ficha.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silenciar errores de descarga en UI; el usuario puede reintentar la importación si es necesario.
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const filteredList =
    esInstructor && searchQuery.trim()
      ? list.filter(
          (f) =>
            (f.programa_formacion_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            f.ficha.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : list;

  // Vista instructor sin fichas asignadas
  if (esInstructor && !loading && list.length === 0) {
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
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/dashboard" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <HomeIcon className="w-4 h-4" />
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 dark:text-gray-300">Fichas de formación</span>
          </nav>
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
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Vista instructor con fichas: tarjetas y búsqueda
  if (esInstructor && !loading && list.length > 0) {
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
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/dashboard" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <HomeIcon className="w-4 h-4" />
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 dark:text-gray-300">Fichas de formación</span>
          </nav>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por programa o número"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm leading-tight">
                    {item.programa_formacion_nombre || 'Sin programa'}
                  </h3>
                  {item.modalidad_formacion_nombre && (
                    <span className="shrink-0 px-2.5 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                      {item.modalidad_formacion_nombre}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Ficha {item.ficha}</p>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-1">
                      <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                      Información académica
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Cog6ToothIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Jornada: {item.jornada_nombre || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-1">
                      <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Sede / Ambiente: {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2 mb-1">
                      <ComputerDesktopIcon className="w-4 h-4 text-gray-400" />
                      Instructor líder
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      {item.instructor_nombre || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    {item.cantidad_aprendices} Aprendices
                  </span>
                  <Link
                    to={`/asistencia?ficha=${item.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <CalendarDaysIcon className="w-4 h-4" />
                    Tomar Asistencia
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredList.length === 0 && searchQuery.trim() && (
          <p className="text-center text-gray-500 py-8">No hay fichas que coincidan con la búsqueda.</p>
        )}
      </div>
    );
  }

  // Vista admin: tabla y gestión completa
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fichas de caracterización</h1>
          <p className="mt-2 text-gray-600">Gestión de fichas por programa de formación</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openImportModal} className="btn-secondary">
            <ArrowUpTrayIcon className="w-5 h-5 mr-2 inline" />
            Importar fichas
          </button>
          <button onClick={openCreate} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2 inline" />
            Nueva ficha
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-4 items-center flex-wrap">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Programa:</label>
        <div className="w-64 min-w-[200px]">
          <SelectSearch
            options={[
              { value: 0, label: 'Todos' },
              ...programas.map((p) => ({
                value: p.id,
                label: p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre,
              })),
            ]}
            value={programaId === '' ? 0 : programaId}
            onChange={(v) => setProgramaId(v === 0 || v === undefined ? '' : v)}
            placeholder="Todos los programas"
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Programa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Instructor principal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sede</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ambiente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aprendices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No hay fichas registradas
                      </td>
                    </tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.ficha}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.programa_formacion_nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.instructor_nombre || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.sede_nombre ?? '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.ambiente_nombre ?? '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.cantidad_aprendices}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}
                          >
                            {item.status ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setModalAsignar({ ficha: item, tipo: 'instructores' })}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="Asignar instructores"
                            >
                              <AcademicCapIcon className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalAsignar({ ficha: item, tipo: 'aprendices' })}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="Asignar aprendices"
                            >
                              <UsersIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Página {page} de {totalPages} ({total} total)
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8 p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Editar ficha' : 'Crear Ficha'}</h2>
            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Ficha *</label>
                <input
                  type="text"
                  placeholder="Ej: 123456"
                  value={form.ficha}
                  onChange={(e) => setForm((f) => ({ ...f, ficha: e.target.value }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programa de Formación *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={programas.map((p) => ({ value: p.id, label: `${p.codigo} - ${p.nombre}` }))}
                    value={form.programa_formacion_id === 0 ? undefined : form.programa_formacion_id}
                    onChange={(v) => setForm((f) => ({ ...f, programa_formacion_id: v ?? 0 }))}
                    placeholder="Seleccione un programa..."
                    isRequired
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Inicio *</label>
                <input
                  type="date"
                  value={form.fecha_inicio ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value || undefined }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Fin *</label>
                <input
                  type="date"
                  value={form.fecha_fin ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_fin: e.target.value || undefined }))}
                  className="input-field mt-1 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sede *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={sedes.map((s) => ({ value: s.id, label: s.nombre }))}
                    value={form.sede_id}
                    onChange={(v) => setForm((f) => ({ ...f, sede_id: v }))}
                    placeholder="Seleccione una sede..."
                    isRequired
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructor Líder *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={instructores.map((i) => ({ value: i.id, label: i.nombre }))}
                    value={form.instructor_id}
                    onChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
                    placeholder="Seleccione un instructor..."
                    isRequired
                  />
                </div>
                {!editing && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    La asignación del instructor líder se realiza en el momento de crear la ficha.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modalidad de Formación *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={modalidades.map((m) => ({ value: m.id, label: m.nombre }))}
                    value={form.modalidad_formacion_id}
                    onChange={(v) => setForm((f) => ({ ...f, modalidad_formacion_id: v }))}
                    placeholder="Seleccione una modalidad..."
                    isRequired
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jornada de Formación *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={jornadas.map((j) => ({ value: j.id, label: j.nombre }))}
                    value={form.jornada_id}
                    onChange={(v) => setForm((f) => ({ ...f, jornada_id: v }))}
                    placeholder="Seleccione una jornada..."
                    isRequired
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ambiente *</label>
                <div className="mt-1">
                  <SelectSearch
                    options={ambientes.map((a) => ({ value: a.id, label: a.nombre }))}
                    value={form.ambiente_id}
                    onChange={(v) => setForm((f) => ({ ...f, ambiente_id: v }))}
                    placeholder="Seleccione un ambiente..."
                    isRequired
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Días de Formación *</label>
              <div className="flex flex-wrap gap-4">
                {diasFormacion.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.dias_formacion_ids ?? []).includes(d.id)}
                      onChange={() => toggleDia(d.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{d.nombre}</span>
                  </label>
                ))}
                {diasFormacion.length === 0 && (
                  <span className="text-sm text-gray-500">No hay días cargados o cargando...</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">Ficha Activa *</label>
              <button
                type="button"
                role="switch"
                aria-checked={form.status ?? true}
                onClick={() => setForm((f) => ({ ...f, status: !(f.status ?? true) }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  form.status ?? true ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    form.status ?? true ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">{form.status ?? true ? 'Sí' : 'No'}</span>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editing ? 'Guardar' : 'Crear Ficha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Importar fichas desde Excel</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Suba un archivo Excel con el reporte de aprendices (ficha de caracterización). Debe contener la línea con código y nombre del programa, y las columnas: Tipo de Documento, Número de Documento, Nombre, Apellidos, Celular, Correo.
            </p>
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
