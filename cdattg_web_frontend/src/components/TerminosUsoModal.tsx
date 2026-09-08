/**
 * Este componente muestra el modal de términos de uso de la plataforma.
 * Lo hice como un modal reutilizable con área de scroll para no saturar la
 * pantalla de registro, y solo se abre cuando el vigilante toca el enlace.
 * Lo uso en el registro de personas (VigilanciaRegistroPersonas).
 * @author Cristian Deysdayr Jiménez
 */

import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TERMINOS_USO_SECCIONES, TERMINOS_USO_TITULO } from '../constants/terminosUso';

interface TerminosUsoModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function TerminosUsoModal({ abierto, onCerrar }: TerminosUsoModalProps) {
  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TERMINOS_USO_TITULO}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCerrar}
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
      >
        {/* Cabecera */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{TERMINOS_USO_TITULO}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        {/* Cuerpo con scroll */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Los términos que se presentan a continuación regulan el uso del servicio y el
            manejo de la información que los usuarios registran. Lea con atención antes
            de aceptar.
          </p>

          {TERMINOS_USO_SECCIONES.map((seccion) => (
            <article key={seccion.titulo}>
              <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                {seccion.titulo}
              </h3>
              {seccion.parrafos.map((parrafo) => (
                <p key={parrafo} className="mb-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {parrafo}
                </p>
              ))}
            </article>
          ))}
        </div>

        {/* Pie */}
        <footer className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            Entendido
          </button>
        </footer>
      </section>
    </div>
  );
}