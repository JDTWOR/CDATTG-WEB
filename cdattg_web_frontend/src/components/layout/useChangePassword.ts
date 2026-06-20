import { type ComponentProps, useState } from 'react';
import { apiService } from '../../services/api';

export function useChangePassword() {
  const [open, setOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordNuevaConfirm, setPasswordNuevaConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setPasswordActual('');
    setPasswordNueva('');
    setPasswordNuevaConfirm('');
  };

  const openModal = () => {
    setOpen(true);
    resetFields();
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setOpen(false);
    setError('');
    setSuccess('');
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passwordNueva !== passwordNuevaConfirm) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await apiService.changePassword({
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });
      setSuccess('Contraseña actualizada correctamente.');
      resetFields();
      setTimeout(closeModal, 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Error al cambiar la contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    void submit();
  };

  return {
    open,
    passwordActual,
    setPasswordActual,
    passwordNueva,
    setPasswordNueva,
    passwordNuevaConfirm,
    setPasswordNuevaConfirm,
    error,
    success,
    loading,
    openModal,
    closeModal,
    handleSubmit,
  };
}
