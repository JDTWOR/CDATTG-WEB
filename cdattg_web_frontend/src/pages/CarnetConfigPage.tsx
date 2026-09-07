/**
 * Página de administración para configurar el QR del reverso del carnet.
 * Solo SUPER ADMINISTRADOR con permiso CONFIGURAR CARNET puede editar.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfiguracionCarnet, actualizarConfiguracionCarnet } from '../services/carnetApi';

/**
 * Formulario para editar nombre, cargo y regional del QR del reverso.
 */
export function CarnetConfigPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [regional, setRegional] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState('');

  useEffect(() => {
    void getConfiguracionCarnet()
      .then((cfg: Awaited<ReturnType<typeof getConfiguracionCarnet>>) => {
        setNombre(cfg.nombre);
        setCargo(cfg.cargo);
        setRegional(cfg.regional);
      })
      .catch(() => {});
  }, []);

  const manejarGuardar = async () => {
    setGuardando(true);
    setExito('');
    try {
      await actualizarConfiguracionCarnet({ nombre, cargo, regional });
      setExito('Configuración guardada correctamente.');
    } catch (e: unknown) {
      setExito(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Configuración del carnet</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Estos datos aparecerán en el QR del reverso de todos los carnet de esta regional.
      </p>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input
            type="text"
            className="input-field mt-1 w-full"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del responsable"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
          <input
            type="text"
            className="input-field mt-1 w-full"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Cargo o función"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regional</label>
          <input
            type="text"
            className="input-field mt-1 w-full"
            value={regional}
            onChange={(e) => setRegional(e.target.value)}
            placeholder="Nombre de la regional"
          />
        </div>
        <button type="button" className="btn-sena w-full" disabled={guardando} onClick={manejarGuardar}>
          {guardando ? 'Guardando…' : 'Guardar configuración'}
        </button>
        {exito ? <p className="text-sm text-green-600">{exito}</p> : null}
      </div>
      <button type="button" className="btn-secondary w-full" onClick={() => navigate(-1)}>
        Volver
      </button>
    </main>
  );
}
