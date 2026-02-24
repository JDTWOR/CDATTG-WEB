import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { PersonaResponse, PersonaRequest } from '../types';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../types';
import { SelectSearch } from './SelectSearch';

interface PersonaModalProps {
  persona: PersonaResponse | null;
  onClose: () => void;
  onSave: (data: PersonaRequest) => void;
}

const MIN_AGE = 14;

export const PersonaModal = ({ persona, onClose, onSave }: PersonaModalProps) => {
  const [formData, setFormData] = useState<PersonaRequest>({
    numero_documento: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    status: true,
  });
  const [caracterizacionIds, setCaracterizacionIds] = useState<number[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<ParametroItem[]>([]);
  const [generos, setGeneros] = useState<ParametroItem[]>([]);
  const [paises, setPaises] = useState<PaisItem[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoItem[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioItem[]>([]);
  const [caracterizacion, setCaracterizacion] = useState<ParametroItem[]>([]);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [tipos, gen, paisesList, carac] = await Promise.all([
          apiService.getCatalogosTiposDocumento(),
          apiService.getCatalogosGeneros(),
          apiService.getCatalogosPaises(),
          apiService.getCatalogosPersonaCaracterizacion(),
        ]);
        setTiposDocumento(tipos);
        setGeneros(gen);
        setPaises(paisesList);
        setCaracterizacion(carac);
      } catch {
        // permisos o red
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (formData.pais_id) {
      apiService.getCatalogosDepartamentos(formData.pais_id).then(setDepartamentos);
    } else {
      setDepartamentos([]);
      setFormData((f) => ({ ...f, departamento_id: undefined, municipio_id: undefined }));
    }
  }, [formData.pais_id]);

  useEffect(() => {
    if (formData.departamento_id) {
      apiService.getCatalogosMunicipios(formData.departamento_id).then(setMunicipios);
    } else {
      setMunicipios([]);
      setFormData((f) => ({ ...f, municipio_id: undefined }));
    }
  }, [formData.departamento_id]);

  useEffect(() => {
    if (persona) {
      setFormData({
        tipo_documento: persona.tipo_documento,
        numero_documento: persona.numero_documento,
        primer_nombre: persona.primer_nombre,
        segundo_nombre: persona.segundo_nombre || '',
        primer_apellido: persona.primer_apellido,
        segundo_apellido: persona.segundo_apellido || '',
        fecha_nacimiento: persona.fecha_nacimiento,
        genero: persona.genero,
        telefono: persona.telefono || '',
        celular: persona.celular || '',
        email: persona.email || '',
        pais_id: persona.pais_id,
        departamento_id: persona.departamento_id,
        municipio_id: persona.municipio_id,
        direccion: persona.direccion || '',
        status: persona.status,
        parametro_id: persona.parametro_id,
      });
      if (persona.parametro_id) setCaracterizacionIds([persona.parametro_id]);
    }
  }, [persona]);

  const validateBirthDate = (value: string | undefined): boolean => {
    if (!value) return true;
    const birth = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= MIN_AGE;
  };

  const handleBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData((f) => ({ ...f, fecha_nacimiento: v || undefined }));
    setDateError(v && !validateBirthDate(v) ? `Debe tener al menos ${MIN_AGE} años para registrarse.` : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fecha_nacimiento && !validateBirthDate(formData.fecha_nacimiento)) {
      setDateError(`Debe tener al menos ${MIN_AGE} años para registrarse.`);
      return;
    }
    const parametroId = caracterizacionIds.length > 0 ? caracterizacionIds[0] : undefined;
    onSave({ ...formData, parametro_id: parametroId });
  };

  const toggleCaracterizacion = (id: number) => {
    setCaracterizacionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {persona ? 'Editar Persona' : 'Registro de Persona'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos personales */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Datos personales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de documento *</label>
                <SelectSearch
                  options={tiposDocumento.map((t) => ({ value: t.id, label: t.name }))}
                  value={formData.tipo_documento}
                  onChange={(v) => setFormData({ ...formData, tipo_documento: v })}
                  placeholder="Buscar tipo de documento..."
                  isRequired
                  ariaLabel="Tipo de documento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de documento *</label>
                <input
                  type="text"
                  required
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primer nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.primer_nombre}
                  onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segundo nombre</label>
                <input
                  type="text"
                  value={formData.segundo_nombre ?? ''}
                  onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primer apellido *</label>
                <input
                  type="text"
                  required
                  value={formData.primer_apellido}
                  onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Segundo apellido</label>
                <input
                  type="text"
                  value={formData.segundo_apellido ?? ''}
                  onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de nacimiento *</label>
                <input
                  type="date"
                  required
                  value={formData.fecha_nacimiento ? formData.fecha_nacimiento.slice(0, 10) : ''}
                  onChange={handleBirthChange}
                  className="input-field"
                />
                {dateError && <p className="mt-1 text-sm text-red-600">{dateError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Género *</label>
                <SelectSearch
                  options={generos.map((g) => ({ value: g.id, label: g.name }))}
                  value={formData.genero}
                  onChange={(v) => setFormData({ ...formData, genero: v })}
                  placeholder="Buscar género..."
                  isRequired
                  ariaLabel="Género"
                />
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Celular</label>
                <input
                  type="text"
                  value={formData.celular ?? ''}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono ?? ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </section>

          {/* Ubicación */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Ubicación</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">País *</label>
                <SelectSearch
                  options={paises.map((p) => ({ value: p.id, label: p.nombre }))}
                  value={formData.pais_id}
                  onChange={(v) => setFormData({ ...formData, pais_id: v })}
                  placeholder="Buscar país..."
                  isRequired
                  ariaLabel="País"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departamento *</label>
                <SelectSearch
                  options={departamentos.map((d) => ({ value: d.id, label: d.nombre }))}
                  value={formData.departamento_id}
                  onChange={(v) => setFormData({ ...formData, departamento_id: v })}
                  placeholder="Buscar departamento..."
                  isDisabled={!formData.pais_id}
                  isRequired
                  ariaLabel="Departamento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Municipio *</label>
                <SelectSearch
                  options={municipios.map((m) => ({ value: m.id, label: m.nombre }))}
                  value={formData.municipio_id}
                  onChange={(v) => setFormData({ ...formData, municipio_id: v })}
                  placeholder="Buscar municipio..."
                  isDisabled={!formData.departamento_id}
                  isRequired
                  ariaLabel="Municipio"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded">
              Dirección deshabilitada temporalmente. Por lineamientos internos no se está capturando la dirección residencial en este formulario.
            </p>
          </section>

          {/* Caracterización */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Caracterización</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Marca una o varias categorías que describan la caracterización de la persona.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-3">
              {caracterizacion.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caracterizacionIds.includes(c.id)}
                    onChange={() => toggleCaracterizacion(c.id)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="status"
              checked={formData.status ?? true}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="status" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Activo</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{persona ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
