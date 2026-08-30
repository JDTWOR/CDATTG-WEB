/**
 * @module features/personalRol/components/RolViewDialog
 * @description Diálogo de detalle (solo lectura) de un rol de personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { rolEstadoBadgeClass, rolEstaActivo } from '../rolEstadoHelpers';
import type { PersonalRolModuleConfig } from '../config';
import type { PersonalRolItem } from '../types';
import { RolModalShell } from './RolModalShell';

interface RolViewDialogProps {
  config: PersonalRolModuleConfig;
  item: PersonalRolItem;
  onClose: () => void;
}

/**
 * Muestra nombre, documento y estado de un ítem del módulo Personal.
 * @param props config del módulo, ítem a mostrar y onClose.
 */
export function RolViewDialog({ config, item, onClose }: Readonly<RolViewDialogProps>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <RolModalShell dialogId="rol-view" title={config.labels.verModalTitle} onClose={onClose}>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
            <dd className="text-gray-900 dark:text-white mt-0.5">{item.nombre}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Documento</dt>
            <dd className="text-gray-900 dark:text-white mt-0.5">{item.numero_documento ?? '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Estado</dt>
            <dd className="mt-0.5">
              <span className={`px-2 py-1 text-xs rounded ${rolEstadoBadgeClass(rolEstaActivo(item.estado))}`}>
                {rolEstaActivo(item.estado) ? 'Activo' : 'Inactivo'}
              </span>
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>
      </RolModalShell>
    </div>
  );
}