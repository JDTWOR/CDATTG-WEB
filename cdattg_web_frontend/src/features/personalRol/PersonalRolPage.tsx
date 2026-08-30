/**
 * @module features/personalRol/PersonalRolPage
 * @description Página genérica de CRUD de los roles del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useState } from 'react';
import { usePersonalRolCrud } from './usePersonalRolCrud';
import type { PersonalRolModuleConfig } from './config';
import type { PersonalRolItem } from './types';
import { PersonalRolHeader } from './components/PersonalRolHeader';
import { PersonalRolFilters } from './components/PersonalRolFilters';
import { PersonalRolTable } from './components/PersonalRolTable';
import { RolCreateDialog } from './components/RolCreateDialog';
import { RolViewDialog } from './components/RolViewDialog';
import { RolEditDialog } from './components/RolEditDialog';
import { RolDeleteDialog } from './components/RolDeleteDialog';

interface PersonalRolPageProps {
  config: PersonalRolModuleConfig;
}

/**
 * Compone la página CRUD completa a partir de la configuración del rol.
 * @param props config del módulo (Personal Operativo, Administrativo o Contratistas).
 */
export function PersonalRolPage({ config }: Readonly<PersonalRolPageProps>) {
  const crud = usePersonalRolCrud(config);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [itemView, setItemView] = useState<PersonalRolItem | null>(null);
  const [itemEdit, setItemEdit] = useState<PersonalRolItem | null>(null);
  const [itemDelete, setItemDelete] = useState<PersonalRolItem | null>(null);

  return (
    <div className="space-y-6">
      <PersonalRolHeader config={config} onNew={() => setModalCreateOpen(true)} />

      {crud.error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {crud.error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <PersonalRolFilters
          searchText={crud.searchText}
          filterEstado={crud.filterEstado}
          onSearchChange={(value) => {
            crud.setSearchText(value);
            crud.setPage(1);
          }}
          onFilterChange={crud.setFilterEstado}
        />
        <PersonalRolTable
          config={config}
          items={crud.filteredList}
          list={crud.list}
          loading={crud.loading}
          page={crud.page}
          pageSize={20}
          total={crud.total}
          onPageChange={crud.setPage}
          onView={setItemView}
          onEdit={setItemEdit}
          onDelete={setItemDelete}
        />
      </div>

      {modalCreateOpen && (
        <RolCreateDialog
          config={config}
          onCreate={crud.createFromPersona}
          onClose={() => setModalCreateOpen(false)}
        />
      )}
      {itemView && <RolViewDialog config={config} item={itemView} onClose={() => setItemView(null)} />}
      {itemEdit && (
        <RolEditDialog
          config={config}
          item={itemEdit}
          onSave={crud.updateEstado}
          onClose={() => setItemEdit(null)}
        />
      )}
      {itemDelete && (
        <RolDeleteDialog
          config={config}
          item={itemDelete}
          onDelete={crud.remove}
          onClose={() => setItemDelete(null)}
        />
      )}
    </div>
  );
}