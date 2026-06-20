import { type ComponentProps } from 'react';
import { KeyIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ChangePasswordModalProps = Readonly<{
  open: boolean;
  passwordActual: string;
  passwordNueva: string;
  passwordNuevaConfirm: string;
  error: string;
  success: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']>;
  onPasswordActualChange: (value: string) => void;
  onPasswordNuevaChange: (value: string) => void;
  onPasswordNuevaConfirmChange: (value: string) => void;
}>;

export function ChangePasswordModal({
  open,
  passwordActual,
  passwordNueva,
  passwordNuevaConfirm,
  error,
  success,
  loading,
  onClose,
  onSubmit,
  onPasswordActualChange,
  onPasswordNuevaChange,
  onPasswordNuevaConfirmChange,
}: ChangePasswordModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar ventana de cambio de contraseña"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
        aria-labelledby="change-password-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="change-password-title"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white"
          >
            <KeyIcon className="h-6 w-6" />
            Cambiar contraseña
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
              {success}
            </div>
          ) : null}
          <div>
            <label htmlFor="password_actual" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contraseña actual *
            </label>
            <input
              id="password_actual"
              type="password"
              value={passwordActual}
              onChange={(e) => onPasswordActualChange(e.target.value)}
              className="input-field w-full"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="password_nueva" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nueva contraseña * (mín. 6 caracteres)
            </label>
            <input
              id="password_nueva"
              type="password"
              value={passwordNueva}
              onChange={(e) => onPasswordNuevaChange(e.target.value)}
              className="input-field w-full"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="password_nueva_confirm"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmar nueva contraseña *
            </label>
            <input
              id="password_nueva_confirm"
              type="password"
              value={passwordNuevaConfirm}
              onChange={(e) => onPasswordNuevaConfirmChange(e.target.value)}
              className="input-field w-full"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
