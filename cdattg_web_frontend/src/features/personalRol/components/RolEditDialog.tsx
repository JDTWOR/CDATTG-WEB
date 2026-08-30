/**
 * @module features/personalRol/components/RolEditDialog
 * @description Diálogo de edición de estado de un rol de personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useState, type ComponentProps } from 'react';
import { axiosErrorMessage } from '../../../utils/httpError';
import { rolEstaActivo } from '../rolEstadoHelpers';
import type { PersonalRolModuleConfig } from '../config';
import type { PersonalRolItem } from '../types';
import { RolModalShell } from './RolModalShell';

interface RolEditDialogProps {
  config: PersonalRolModuleConfig;
  item: PersonalRolItem;
  onSave: (id: number, estado: boolean) => Promise<void>;
  onClose: () => void;
}

/**
 * Formulario modal para cambiar el estado activo/inactivo.
 * @param props config del módulo, ítem a editar, onSave (acción) y onClose.
 */
export function RolEditDialog({ config, item, onSave, onClose }: Readonly<RolEditDialogProps>) {
  const [editEstado, setEditEstado] = useState(rolEstaActivo(item.estado));
  const [saving, setSaving] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    void (async () => {
      setSaving(true);
      try {
        await onSave(item.id, editEstado);
        onClose();
      } catch (err: unknown) {
        alert(axiosErrorMessage(err, `Error al actualizar ${config.objectName}`));
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <RolModalShell dialogId="rol-edit" title={config.labels.editarModalTitle} onClose={onClose}>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.nombre}</p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label
              htmlFor="rol-edit-estado"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Estado
            </label>
            <select
              id="rol-edit-estado"
              value={editEstado ? '1' : '0'}
              onChange={(e) => setEditEstado(e.target.value === '1')}
              className="input-field w-full"
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </RolModalShell>
    </div>
  );
}