/**
 * @module features/personalRol/usePersonalRolCrud
 * @description Hook de estado, filtrado y operaciones CRUD para listados de personas con rol.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useCallback, useEffect, useState } from 'react';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PersonalRolModuleConfig } from './config';
import type { PersonalRolItem } from './types';

export type FilterEstado = 'all' | 'activo' | 'inactivo';

export interface PersonalRolCrud {
  list: PersonalRolItem[];
  loading: boolean;
  error: string;
  searchText: string;
  filterEstado: FilterEstado;
  page: number;
  total: number;
  filteredList: PersonalRolItem[];
  fetchList: () => Promise<void>;
  createFromPersona: (personaId: number) => Promise<void>;
  updateEstado: (id: number, estado: boolean) => Promise<void>;
  remove: (id: number) => Promise<void>;
  setSearchText: (value: string) => void;
  setFilterEstado: (value: FilterEstado) => void;
  setPage: (value: number) => void;
}

/**
 * Obtiene la lista paginada del rol configurado y expone operaciones CRUD.
 * @param config Configuración del módulo (Personal Operativo, Administrativo o Contratistas).
 * @returns Estado de lista, filtros, paginación y acciones CRUD.
 */
export function usePersonalRolCrud(config: PersonalRolModuleConfig): PersonalRolCrud {
  const [list, setList] = useState<PersonalRolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await config.api.list(page, pageSize, searchText.trim() || undefined);
      setList(res.data);
      setTotal(res.total);
      setError('');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, `Error al cargar ${config.objectName}s`));
    } finally {
      setLoading(false);
    }
  }, [config, page, searchText]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const createFromPersona = useCallback(
    async (personaId: number) => {
      await config.api.create(personaId);
      void fetchList();
    },
    [config, fetchList],
  );

  const updateEstado = useCallback(
    async (id: number, estado: boolean) => {
      await config.api.update(id, estado);
      void fetchList();
    },
    [config, fetchList],
  );

  const remove = useCallback(
    async (id: number) => {
      await config.api.remove(id);
      void fetchList();
    },
    [config, fetchList],
  );

  const filteredList = list.filter((item) => {
    if (filterEstado === 'all') return true;
    const esActivo = item.estado !== false;
    return filterEstado === 'activo' ? esActivo : !esActivo;
  });

  return {
    list,
    loading,
    error,
    searchText,
    filterEstado,
    page,
    total,
    filteredList,
    fetchList,
    createFromPersona,
    updateEstado,
    remove,
    setSearchText,
    setFilterEstado,
    setPage,
  };
}