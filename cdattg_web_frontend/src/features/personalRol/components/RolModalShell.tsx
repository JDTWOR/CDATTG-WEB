/**
 * @module features/personalRol/components/RolModalShell
 * @description Contenedor de diálogo modal reutilizado por los diálogos del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import type { ReactNode } from 'react';

interface RolModalShellProps {
  /** Prefijo para aria-labelledby del título del diálogo. */
  dialogId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Renderiza el overlay y la caja del diálogo con título y botón de cierre.
 * @param props dialogId, title, onClose y contenido del diálogo.
 */
export function RolModalShell({ dialogId, title, onClose, children }: Readonly<RolModalShellProps>) {
  return (
    <>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <dialog
        open
        aria-labelledby={`${dialogId}-title`}
        className="relative z-10 m-0 max-h-[90vh] max-w-md w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
      >
        <h2 id={`${dialogId}-title`} className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {children}
      </dialog>
    </>
  );
}