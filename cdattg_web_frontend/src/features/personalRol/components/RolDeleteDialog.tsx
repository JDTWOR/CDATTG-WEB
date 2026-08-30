/**
 * @module features/personalRol/components/RolDeleteDialog
 * @description Diálogo de confirmación de eliminación de un rol de personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useState } from 'react';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { PersonalRolModuleConfig } from '../config';
import type { PersonalRolItem } from '../types';
import { RolModalShell } from './RolModalShell';

interface RolDeleteDialogProps {
  config: PersonalRolModuleConfig;
  item: PersonalRolItem;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Pide confirmación y ejecuta el borrado con onDelete.
 * @param props config del módulo, ítem a eliminar, onDelete (acción) y onClose.
 */
export function RolDeleteDialog({ config, item, onDelete, onClose }: Readonly<RolDeleteDialogProps>) {
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, `Error al eliminar ${config.objectName}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <RolModalShell dialogId="rol-delete" title={config.labels.eliminarModalTitle} onClose={onClose}>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {config.labels.eliminarConfirm(item.nombre)}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </RolModalShell>
    </div>
  );
}