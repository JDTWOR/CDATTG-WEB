import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { SelectSearch, type SelectOption } from '../components/SelectSearch';
import { InstructorSelectAsync } from '../components/InstructorSelectAsync';

export const VigilanciaAmbientes = () => {
  const [ambientesOptions, setAmbientesOptions] = useState<SelectOption[]>([]);
  const [ambientesLoading, setAmbientesLoading] = useState(false);
  const [ambientesError, setAmbientesError] = useState('');

  const [ambienteId, setAmbienteId] = useState<number | undefined>();
  const [instructorId, setInstructorId] = useState<number | undefined>();

  const [registrando, setRegistrando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState('');
  const [mensajeRegistro, setMensajeRegistro] = useState('');

  useEffect(() => {
    const loadAmbientes = async () => {
      setAmbientesLoading(true);
      setAmbientesError('');
      try {
        const data = await apiService.getCatalogosAmbientes();
        setAmbientesOptions(
          data.map((a) => ({
            value: a.id,
            label: a.nombre,
          }))
        );
      } catch (e: any) {
        const msg = e.response?.data?.error || 'No se pudieron cargar los ambientes.';
        setAmbientesError(msg);
        setAmbientesOptions([]);
      } finally {
        setAmbientesLoading(false);
      }
    };
    loadAmbientes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRegistro('');
    setMensajeRegistro('');

    if (!ambienteId || !instructorId) {
      setErrorRegistro('Seleccione un ambiente y un instructor.');
      return;
    }

    setRegistrando(true);
    try {
      await apiService.registrarEntradaAmbiente({
        ambiente_id: ambienteId,
        instructor_id: instructorId,
      });
      setMensajeRegistro('Entrada registrada correctamente en el ambiente.');
    } catch (e: any) {
      const msg =
        e.response?.data?.error ||
        e.message ||
        'No se pudo registrar la entrada en el ambiente.';
      setErrorRegistro(msg);
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Control de acceso a ambientes
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Módulo para vigilantes: registre la hora de entrada de los grupos cuando se abre un ambiente,
          seleccionando el ambiente y el instructor responsable.
        </p>
      </div>

      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Registrar entrada al ambiente
        </h2>

        {ambientesError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ambientesError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ambiente *
            </label>
            <SelectSearch
              options={ambientesOptions}
              value={ambienteId}
              onChange={setAmbienteId}
              isDisabled={ambientesLoading || ambientesOptions.length === 0}
              isRequired
              placeholder={
                ambientesLoading ? 'Cargando ambientes...' : 'Seleccione un ambiente'
              }
              ariaLabel="Seleccionar ambiente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instructor *
            </label>
            <InstructorSelectAsync
              value={instructorId}
              onChange={setInstructorId}
              isRequired
              placeholder="Buscar instructor por nombre o documento..."
            />
          </div>

          {errorRegistro && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorRegistro}</p>
          )}
          {mensajeRegistro && (
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {mensajeRegistro}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={registrando || !ambienteId || !instructorId}
              className="btn-primary min-w-[180px]"
            >
              {registrando ? 'Registrando...' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

