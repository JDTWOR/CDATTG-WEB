import { useEffect, useState, type ComponentProps } from 'react';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { SelectSearch, type SelectOption } from '../components/SelectSearch';

type FormOnSubmit = NonNullable<ComponentProps<'form'>['onSubmit']>;

export const InfraAmbientes = () => {
  // Sede
  const [sedeNombre, setSedeNombre] = useState('');
  const [sedeDireccion, setSedeDireccion] = useState('');
  const [sedeRegionalId, setSedeRegionalId] = useState<number | ''>(1);
  const [sedeLoading, setSedeLoading] = useState(false);
  const [sedeError, setSedeError] = useState('');
  const [sedeMensaje, setSedeMensaje] = useState('');

  // Bloque
  const [bloqueNombre, setBloqueNombre] = useState('');
  const [bloqueSedeId, setBloqueSedeId] = useState<number | undefined>();
  const [bloqueLoading, setBloqueLoading] = useState(false);
  const [bloqueError, setBloqueError] = useState('');
  const [bloqueMensaje, setBloqueMensaje] = useState('');

  // Piso
  const [pisoNombre, setPisoNombre] = useState('');
  const [pisoBloqueId, setPisoBloqueId] = useState<number | undefined>();
  const [pisoLoading, setPisoLoading] = useState(false);
  const [pisoError, setPisoError] = useState('');
  const [pisoMensaje, setPisoMensaje] = useState('');

  // Ambiente
  const [ambNombre, setAmbNombre] = useState('');
  const [ambPisoId, setAmbPisoId] = useState<number | undefined>();
  const [ambLoading, setAmbLoading] = useState(false);
  const [ambError, setAmbError] = useState('');
  const [ambMensaje, setAmbMensaje] = useState('');

  // Lookups
  const [bloquesOptions, setBloquesOptions] = useState<SelectOption[]>([]);
  const [pisosOptions, setPisosOptions] = useState<SelectOption[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [sedesOptions, setSedesOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const loadLookups = async () => {
      setLookupsLoading(true);
      try {
        const [bloques, pisos] = await Promise.all([
          apiService.getInfraBloques(),
          apiService.getInfraPisos(),
        ]);
        setBloquesOptions(
          bloques.map((b) => ({
            value: b.id,
            label: `${b.nombre} — ${b.sede_nombre}`,
          }))
        );
        setPisosOptions(
          pisos.map((p) => ({
            value: p.id,
            label: `${p.bloque_nombre} / ${p.nombre}`,
          }))
        );
        // sedes para crear bloques
        const sedes = await apiService.getCatalogosSedes();
        setSedesOptions(
          sedes.map((s) => ({
            value: s.id,
            label: s.nombre,
          }))
        );
      } catch (e: unknown) {
        console.error('Error cargando lookups de infraestructura', e);
      } finally {
        setLookupsLoading(false);
      }
    };
    loadLookups();
  }, []);

  const handleCrearSede: FormOnSubmit = (e) => {
    e.preventDefault();
    setSedeError('');
    setSedeMensaje('');

    const nombre = sedeNombre.trim();
    if (!nombre || !sedeRegionalId) {
      setSedeError('Ingrese el nombre de la sede y el ID de regional.');
      return;
    }

    void (async () => {
      setSedeLoading(true);
      try {
        const res = await apiService.createSedeInfra({
          nombre,
          direccion: sedeDireccion.trim(),
          regional_id: Number(sedeRegionalId),
        });
        setSedeMensaje(`Sede creada con ID ${res.id}.`);
        setSedeNombre('');
        setSedeDireccion('');
      } catch (err: unknown) {
        setSedeError(axiosErrorMessage(err, 'No se pudo crear la sede.'));
      } finally {
        setSedeLoading(false);
      }
    })();
  };

  const handleCrearPiso: FormOnSubmit = (e) => {
    e.preventDefault();
    setPisoError('');
    setPisoMensaje('');

    const nombre = pisoNombre.trim();
    if (!nombre || !pisoBloqueId) {
      setPisoError('Ingrese el nombre del piso y el ID de bloque.');
      return;
    }

    void (async () => {
      setPisoLoading(true);
      try {
        const res = await apiService.createPisoInfra({
          nombre,
          bloque_id: pisoBloqueId,
        });
        setPisoMensaje(`Piso creado con ID ${res.id}.`);
        setPisoNombre('');
        setPisoBloqueId(undefined);
        try {
          const pisos = await apiService.getInfraPisos();
          setPisosOptions(
            pisos.map((p) => ({
              value: p.id,
              label: `${p.bloque_nombre} / ${p.nombre}`,
            }))
          );
        } catch {
          // refresco opcional
        }
      } catch (err: unknown) {
        setPisoError(axiosErrorMessage(err, 'No se pudo crear el piso.'));
      } finally {
        setPisoLoading(false);
      }
    })();
  };

  const handleCrearBloque: FormOnSubmit = (e) => {
    e.preventDefault();
    setBloqueError('');
    setBloqueMensaje('');

    const nombre = bloqueNombre.trim();
    if (!nombre || !bloqueSedeId) {
      setBloqueError('Ingrese el nombre del bloque y seleccione la sede.');
      return;
    }

    void (async () => {
      setBloqueLoading(true);
      try {
        const res = await apiService.createBloqueInfra({
          nombre,
          sede_id: bloqueSedeId,
        });
        setBloqueMensaje(`Bloque creado con ID ${res.id}.`);
        setBloqueNombre('');
        setBloqueSedeId(undefined);
        try {
          const bloques = await apiService.getInfraBloques();
          setBloquesOptions(
            bloques.map((b) => ({
              value: b.id,
              label: `${b.nombre} — ${b.sede_nombre}`,
            }))
          );
        } catch {
          // refresco opcional
        }
      } catch (err: unknown) {
        setBloqueError(axiosErrorMessage(err, 'No se pudo crear el bloque.'));
      } finally {
        setBloqueLoading(false);
      }
    })();
  };

  const handleCrearAmbiente: FormOnSubmit = (e) => {
    e.preventDefault();
    setAmbError('');
    setAmbMensaje('');

    const nombre = ambNombre.trim();
    if (!nombre || !ambPisoId) {
      setAmbError('Ingrese el nombre del ambiente y el ID de piso.');
      return;
    }

    void (async () => {
      setAmbLoading(true);
      try {
        const res = await apiService.createAmbiente({
          nombre,
          piso_id: ambPisoId,
        });
        setAmbMensaje(`Ambiente creado con ID ${res.id}.`);
        setAmbNombre('');
        setAmbPisoId(undefined);
      } catch (err: unknown) {
        setAmbError(axiosErrorMessage(err, 'No se pudo crear el ambiente.'));
      } finally {
        setAmbLoading(false);
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Infraestructura — Sedes, pisos y ambientes
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Módulo para el equipo de infraestructura: gestione sedes, pisos y ambientes de formación.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Crear sede */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crear sede
          </h2>
          {sedeError && (
            <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {sedeError}
            </div>
          )}
          {sedeMensaje && (
            <output
              aria-live="polite"
              className="mb-3 block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
            >
              {sedeMensaje}
            </output>
          )}
          <form onSubmit={handleCrearSede} className="space-y-3">
            <div>
              <label htmlFor="infra-sede-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la sede *
              </label>
              <input
                id="infra-sede-nombre"
                type="text"
                value={sedeNombre}
                onChange={(e) => setSedeNombre(e.target.value)}
                className="input-field w-full"
                placeholder="Ej: MODELO, CENTRO"
                disabled={sedeLoading}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="infra-sede-direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                id="infra-sede-direccion"
                type="text"
                value={sedeDireccion}
                onChange={(e) => setSedeDireccion(e.target.value)}
                className="input-field w-full"
                placeholder="Dirección física de la sede"
                disabled={sedeLoading}
                autoComplete="street-address"
              />
            </div>
            <div>
              <label htmlFor="infra-sede-regional-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID de regional *
              </label>
              <input
                id="infra-sede-regional-id"
                type="number"
                value={sedeRegionalId}
                onChange={(e) =>
                  setSedeRegionalId(e.target.value ? Number.parseInt(e.target.value, 10) : '')
                }
                className="input-field w-full"
                min={1}
                disabled={sedeLoading}
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={sedeLoading}
                className="btn-primary w-full"
              >
                {sedeLoading ? 'Creando...' : 'Crear sede'}
              </button>
            </div>
          </form>
        </div>

        {/* Crear bloque */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crear bloque
          </h2>
          {bloqueError && (
            <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {bloqueError}
            </div>
          )}
          {bloqueMensaje && (
            <output
              aria-live="polite"
              className="mb-3 block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
            >
              {bloqueMensaje}
            </output>
          )}
          <form onSubmit={handleCrearBloque} className="space-y-3">
            <div>
              <label htmlFor="infra-bloque-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del bloque *
              </label>
              <input
                id="infra-bloque-nombre"
                type="text"
                value={bloqueNombre}
                onChange={(e) => setBloqueNombre(e.target.value)}
                className="input-field w-full"
                placeholder="Ej: B2, B3"
                disabled={bloqueLoading}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="infra-bloque-sede" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sede *
              </label>
              <SelectSearch
                inputId="infra-bloque-sede"
                options={sedesOptions}
                value={bloqueSedeId}
                onChange={(val) => setBloqueSedeId(val)}
                isDisabled={bloqueLoading || lookupsLoading || sedesOptions.length === 0}
                isRequired
                placeholder={
                  lookupsLoading ? 'Cargando sedes...' : 'Seleccione la sede'
                }
                ariaLabel="Seleccionar sede para el bloque"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={bloqueLoading}
                className="btn-primary w-full"
              >
                {bloqueLoading ? 'Creando...' : 'Crear bloque'}
              </button>
            </div>
          </form>
        </div>

        {/* Crear piso */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crear piso
          </h2>
          {pisoError && (
            <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {pisoError}
            </div>
          )}
          {pisoMensaje && (
            <output
              aria-live="polite"
              className="mb-3 block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
            >
              {pisoMensaje}
            </output>
          )}
          <form onSubmit={handleCrearPiso} className="space-y-3">
            <div>
              <label htmlFor="infra-piso-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del piso *
              </label>
              <input
                id="infra-piso-nombre"
                type="text"
                value={pisoNombre}
                onChange={(e) => setPisoNombre(e.target.value)}
                className="input-field w-full"
                placeholder="Ej: P1, P2, P3"
                disabled={pisoLoading}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="infra-piso-bloque" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bloque *
              </label>
              <SelectSearch
                inputId="infra-piso-bloque"
                options={bloquesOptions}
                value={pisoBloqueId}
                onChange={(val) => setPisoBloqueId(val)}
                isDisabled={pisoLoading || lookupsLoading || bloquesOptions.length === 0}
                isRequired
                placeholder={
                  lookupsLoading ? 'Cargando bloques...' : 'Seleccione el bloque (ej: B2, B3)'
                }
                ariaLabel="Seleccionar bloque para el piso"
              />
              <p className="mt-1 text-xs text-gray-500">
                Los bloques se obtienen de la infraestructura actual de sedes.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={pisoLoading}
                className="btn-primary w-full"
              >
                {pisoLoading ? 'Creando...' : 'Crear piso'}
              </button>
            </div>
          </form>
        </div>

        {/* Crear ambiente */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crear ambiente
          </h2>
          {ambError && (
            <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {ambError}
            </div>
          )}
          {ambMensaje && (
            <output
              aria-live="polite"
              className="mb-3 block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
            >
              {ambMensaje}
            </output>
          )}
          <form onSubmit={handleCrearAmbiente} className="space-y-3">
            <div>
              <label htmlFor="infra-amb-nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del ambiente *
              </label>
              <input
                id="infra-amb-nombre"
                type="text"
                value={ambNombre}
                onChange={(e) => setAmbNombre(e.target.value)}
                className="input-field w-full"
                placeholder="Ej: B2-P2-A4, CENTRO-P1-A8-ELECTRICIDAD"
                disabled={ambLoading}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="infra-amb-piso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Piso (bloque / piso) *
              </label>
              <SelectSearch
                inputId="infra-amb-piso"
                options={pisosOptions}
                value={ambPisoId}
                onChange={(val) => setAmbPisoId(val)}
                isDisabled={ambLoading || lookupsLoading || pisosOptions.length === 0}
                isRequired
                placeholder={
                  lookupsLoading ? 'Cargando pisos...' : 'Seleccione el piso (bloque / piso)'
                }
                ariaLabel="Seleccionar piso para el ambiente"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={ambLoading}
                className="btn-primary w-full"
              >
                {ambLoading ? 'Creando...' : 'Crear ambiente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

