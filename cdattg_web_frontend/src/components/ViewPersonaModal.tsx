import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PersonaResponse } from '../types';

interface ViewPersonaModalProps {
  persona: PersonaResponse;
  onClose: () => void;
}

const TITLE_ID = 'view-persona-modal-title';

const field = (label: string, value: string | number | undefined) => (
  <div>
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value ?? '-'}</dd>
  </div>
);

export const ViewPersonaModal = ({ persona, onClose }: Readonly<ViewPersonaModalProps>) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Cerrar vista de persona"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-600 dark:bg-gray-800"
        aria-labelledby={TITLE_ID}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-600">
          <h2 id={TITLE_ID} className="text-xl font-bold text-gray-900 dark:text-white">
            Ver persona
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-6 p-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Datos personales</h3>
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
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Contacto</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {field('Email', persona.email)}
              {field('Teléfono', persona.telefono)}
              {field('Celular', persona.celular)}
              {field('Dirección', persona.direccion)}
            </dl>
          </section>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {field('Estado', persona.status ? 'Activo' : 'Inactivo')}
            </dl>
          </section>
        </div>
      </dialog>
    </div>
  );
};
