/**
 * @module features/personalRol/components/RolCreateDialog
 * @description Diálogo de creación de un rol de personal desde una persona existente.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { useState, type ComponentProps } from 'react';
import { axiosErrorMessage } from '../../../utils/httpError';
import { PersonaSelectAsync } from '../../../components/PersonaSelectAsync';
import type { PersonalRolModuleConfig } from '../config';
import { RolModalShell } from './RolModalShell';

interface RolCreateDialogProps {
  config: PersonalRolModuleConfig;
  onCreate: (personaId: number) => Promise<void>;
  onClose: () => void;
}

/**
 * Formulario modal de creación: selecciona persona y ejecuta onCreate.
 * @param props config del módulo, onCreate (acción de negocio) y onClose.
 */
export function RolCreateDialog({ config, onCreate, onClose }: Readonly<RolCreateDialogProps>) {
  const [personaId, setPersonaId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    if (personaId === '') {
      alert('Seleccione una persona');
      return;
    }
    void (async () => {
      setSaving(true);
      try {
        await onCreate(personaId);
        onClose();
      } catch (err: unknown) {
        alert(axiosErrorMessage(err, `Error al crear ${config.objectName}`));
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <RolModalShell dialogId="rol-create" title={config.labels.crearModalTitle} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label
              htmlFor="rol-create-persona"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Persona *
            </label>
            <PersonaSelectAsync
              inputId="rol-create-persona"
              value={personaId === '' ? undefined : personaId}
              onChange={(v) => setPersonaId(v ?? '')}
              placeholder="Buscar por nombre o documento..."
              isRequired
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : config.labels.crear}
            </button>
          </div>
        </form>
      </RolModalShell>
    </div>
  );
}