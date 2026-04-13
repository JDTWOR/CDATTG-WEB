import { useEffect, useState, type ComponentProps } from 'react';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { SelectSearch, type SelectOption } from '../components/SelectSearch';
import { InstructorSelectAsync } from '../components/InstructorSelectAsync';

const VIGILANCIA_AMBIENTE_ID = 'vigilancia-ambiente-select';
const VIGILANCIA_INSTRUCTOR_ID = 'vigilancia-instructor-select';

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
      } catch (e: unknown) {
        setAmbientesError(axiosErrorMessage(e, 'No se pudieron cargar los ambientes.'));
        setAmbientesOptions([]);
      } finally {
        setAmbientesLoading(false);
      }
    };
    void loadAmbientes();
  }, []);

  const handleSubmit: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    setErrorRegistro('');
    setMensajeRegistro('');

    if (!ambienteId || !instructorId) {
      setErrorRegistro('Seleccione un ambiente y un instructor.');
      return;
    }

    void (async () => {
      setRegistrando(true);
      try {
        await apiService.registrarEntradaAmbiente({
          ambiente_id: ambienteId,
          instructor_id: instructorId,
        });
        setMensajeRegistro('Entrada registrada correctamente en el ambiente.');
      } catch (err: unknown) {
        setErrorRegistro(
          axiosErrorMessage(
            err,
            err instanceof Error ? err.message : 'No se pudo registrar la entrada en el ambiente.',
          ),
        );
      } finally {
        setRegistrando(false);
      }
    })();
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
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          >
            {ambientesError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={VIGILANCIA_AMBIENTE_ID}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Ambiente *
            </label>
            <SelectSearch
              inputId={VIGILANCIA_AMBIENTE_ID}
              options={ambientesOptions}
              value={ambienteId}
              onChange={setAmbienteId}
              isDisabled={ambientesLoading || ambientesOptions.length === 0}
              isRequired
              placeholder={
                ambientesLoading ? 'Cargando ambientes…' : 'Seleccione un ambiente'
              }
              ariaLabel="Seleccionar ambiente"
            />
          </div>

          <div>
            <label
              htmlFor={VIGILANCIA_INSTRUCTOR_ID}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Instructor *
            </label>
            <InstructorSelectAsync
              inputId={VIGILANCIA_INSTRUCTOR_ID}
              value={instructorId}
              onChange={setInstructorId}
              isRequired
              placeholder="Buscar instructor por nombre o documento..."
            />
          </div>

          {errorRegistro && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errorRegistro}
            </p>
          )}
          {mensajeRegistro && (
            <output className="block text-sm text-green-700 dark:text-green-400 font-medium">
              {mensajeRegistro}
            </output>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={registrando || !ambienteId || !instructorId}
              className="btn-primary min-w-[180px]"
            >
              {registrando ? 'Registrando…' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

