import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PersonaResponse } from '../types';

interface ViewPersonaModalProps {
  persona: PersonaResponse;
  onClose: () => void;
}

const field = (label: string, value: string | number | undefined) => (
  <div>
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value ?? '-'}</dd>
  </div>
);

export const ViewPersonaModal = ({ persona, onClose }: ViewPersonaModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ver persona</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos personales</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {field('Documento', persona.numero_documento)}
              {field('Nombre completo', persona.full_name)}
              {field('Primer nombre', persona.primer_nombre)}
              {field('Segundo nombre', persona.segundo_nombre)}
              {field('Primer apellido', persona.primer_apellido)}
              {field('Segundo apellido', persona.segundo_apellido)}
              {field('Fecha de nacimiento', persona.fecha_nacimiento ? persona.fecha_nacimiento.slice(0, 10) : undefined)}
            </dl>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Contacto</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {field('Email', persona.email)}
              {field('Teléfono', persona.telefono)}
              {field('Celular', persona.celular)}
              {field('Dirección', persona.direccion)}
            </dl>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estado</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {field('Estado', persona.status ? 'Activo' : 'Inactivo')}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};
