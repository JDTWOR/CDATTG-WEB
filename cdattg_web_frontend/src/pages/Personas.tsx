import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilSquareIcon, KeyIcon, TrashIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import type { PersonaResponse, PersonaRequest } from '../types';
import { PersonaModal } from '../components/PersonaModal';
import { ViewPersonaModal } from '../components/ViewPersonaModal';

export const Personas = () => {
  const [personas, setPersonas] = useState<PersonaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaResponse | null>(null);
  const [viewingPersona, setViewingPersona] = useState<PersonaResponse | null>(null);
  const [search, setSearch] = useState('');

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPersonas(page, pageSize, search);
      setPersonas(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [page, search]);

  const handleCreate = () => {
    setEditingPersona(null);
    setIsModalOpen(true);
  };

  const handleEdit = (persona: PersonaResponse) => {
    setEditingPersona(persona);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta persona?')) return;

    try {
      await apiService.deletePersona(id);
      fetchPersonas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar persona');
    }
  };

  const handleResetPassword = async (persona: PersonaResponse) => {
    if (!confirm(`¿Restablecer contraseña de ${persona.full_name} al número de documento?`)) return;
    try {
      await apiService.resetPersonaPassword(persona.id);
      alert('Contraseña restablecida. La persona puede entrar con su email y número de documento.');
      fetchPersonas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al restablecer contraseña');
    }
  };

  const handleSave = async (data: PersonaRequest) => {
    try {
      if (editingPersona) {
        await apiService.updatePersona(editingPersona.id, data);
      } else {
        await apiService.createPersona(data);
      }
      setIsModalOpen(false);
      fetchPersonas();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar persona');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestión de personas del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/personas/importar" className="btn-secondary">
            <ArrowUpTrayIcon className="w-5 h-5 inline mr-2" />
            Importar personas
          </Link>
          <button onClick={handleCreate} className="btn-primary">
            <PlusIcon className="w-5 h-5 inline mr-2" />
            Nueva Persona
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {personas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No hay personas registradas
                      </td>
                    </tr>
                  ) : (
                    personas.map((persona) => (
                      <tr key={persona.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {persona.numero_documento}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {persona.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {persona.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {persona.celular || persona.telefono || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              persona.status
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}
                          >
                            {persona.status ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingPersona(persona)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-600 rounded"
                              title="Ver"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(persona)}
                              className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-300 dark:hover:bg-primary-900/40 rounded"
                              title="Editar"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(persona)}
                              className="p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded"
                              title="Restablecer contraseña"
                            >
                              <KeyIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(persona.id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40 rounded"
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
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} resultados
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
        <PersonaModal
          persona={editingPersona}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {viewingPersona && (
        <ViewPersonaModal
          persona={viewingPersona}
          onClose={() => setViewingPersona(null)}
        />
      )}
    </div>
  );
};
