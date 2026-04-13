import { useState, useEffect, type ChangeEvent, type ComponentProps } from 'react';
import { apiService } from '../services/api';
import type {
  PersonaResponse,
  PersonaRequest,
  ParametroItem,
  PaisItem,
  DepartamentoItem,
  MunicipioItem,
} from '../types';
import { SelectSearch } from './SelectSearch';

interface PersonaModalProps {
  persona: PersonaResponse | null;
  onClose: () => void;
  onSave: (data: PersonaRequest) => void;
}

const MIN_AGE = 14;

const F = {
  tipoDoc: 'persona-modal-tipo-documento',
  numDoc: 'persona-modal-numero-documento',
  primerNombre: 'persona-modal-primer-nombre',
  segundoNombre: 'persona-modal-segundo-nombre',
  primerApellido: 'persona-modal-primer-apellido',
  segundoApellido: 'persona-modal-segundo-apellido',
  fechaNac: 'persona-modal-fecha-nacimiento',
  genero: 'persona-modal-genero',
  celular: 'persona-modal-celular',
  telefono: 'persona-modal-telefono',
  email: 'persona-modal-email',
  pais: 'persona-modal-pais',
  departamento: 'persona-modal-departamento',
  municipio: 'persona-modal-municipio',
} as const;

export const PersonaModal = ({ persona, onClose, onSave }: Readonly<PersonaModalProps>) => {
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
    void load();
  }, []);

  useEffect(() => {
    if (formData.pais_id) {
      void apiService.getCatalogosDepartamentos(formData.pais_id).then(setDepartamentos);
    } else {
      setDepartamentos([]);
      setFormData((f) => ({ ...f, departamento_id: undefined, municipio_id: undefined }));
    }
  }, [formData.pais_id]);

  useEffect(() => {
    if (formData.departamento_id) {
      void apiService.getCatalogosMunicipios(formData.departamento_id).then(setMunicipios);
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
      if (persona.parametro_id) {
        setCaracterizacionIds([persona.parametro_id]);
      }
    }
  }, [persona]);

  const validateBirthDate = (value: string | undefined): boolean => {
    if (!value) {
      return true;
    }
    const birth = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= MIN_AGE;
  };

  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData((f) => ({ ...f, fecha_nacimiento: v || undefined }));
    setDateError(v && !validateBirthDate(v) ? `Debe tener al menos ${MIN_AGE} años para registrarse.` : '');
  };

  const submitPersona = (): void => {
    if (formData.fecha_nacimiento && !validateBirthDate(formData.fecha_nacimiento)) {
      setDateError(`Debe tener al menos ${MIN_AGE} años para registrarse.`);
      return;
    }
    const parametroId = caracterizacionIds.length > 0 ? caracterizacionIds[0] : undefined;
    onSave({ ...formData, parametro_id: parametroId });
  };

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    submitPersona();
  };

  const toggleCaracterizacion = (id: number) => {
    setCaracterizacionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const modalTitleId = 'persona-modal-title';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Cerrar formulario de persona"
        onClick={onClose}
      />
      <dialog
        open
        className="relative z-10 m-0 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-lg border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-600 dark:bg-gray-800"
        aria-labelledby={modalTitleId}
      >
        <div className="border-b border-gray-200 p-6 dark:border-gray-600">
          <h2 id={modalTitleId} className="text-2xl font-bold text-gray-900 dark:text-white">
            {persona ? 'Editar Persona' : 'Registro de Persona'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Datos personales */}
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Datos personales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={F.tipoDoc} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de documento *
                </label>
                <SelectSearch
                  inputId={F.tipoDoc}
                  options={tiposDocumento.map((t) => ({ value: t.id, label: t.name }))}
                  value={formData.tipo_documento}
                  onChange={(v) => setFormData({ ...formData, tipo_documento: v })}
                  placeholder="Buscar tipo de documento..."
                  isRequired
                  ariaLabel="Tipo de documento"
                />
              </div>
              <div>
                <label htmlFor={F.numDoc} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de documento *
                </label>
                <input
                  id={F.numDoc}
                  type="text"
                  required
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.primerNombre} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primer nombre *
                </label>
                <input
                  id={F.primerNombre}
                  type="text"
                  required
                  value={formData.primer_nombre}
                  onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.segundoNombre} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Segundo nombre
                </label>
                <input
                  id={F.segundoNombre}
                  type="text"
                  value={formData.segundo_nombre ?? ''}
                  onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.primerApellido} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Primer apellido *
                </label>
                <input
                  id={F.primerApellido}
                  type="text"
                  required
                  value={formData.primer_apellido}
                  onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.segundoApellido} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Segundo apellido
                </label>
                <input
                  id={F.segundoApellido}
                  type="text"
                  value={formData.segundo_apellido ?? ''}
                  onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.fechaNac} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de nacimiento *
                </label>
                <input
                  id={F.fechaNac}
                  type="date"
                  required
                  value={formData.fecha_nacimiento ? formData.fecha_nacimiento.slice(0, 10) : ''}
                  onChange={handleBirthChange}
                  className="input-field"
                />
                {dateError && <p className="mt-1 text-sm text-red-600">{dateError}</p>}
              </div>
              <div>
                <label htmlFor={F.genero} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Género *
                </label>
                <SelectSearch
                  inputId={F.genero}
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
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={F.celular} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Celular
                </label>
                <input
                  id={F.celular}
                  type="text"
                  value={formData.celular ?? ''}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={F.telefono} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teléfono
                </label>
                <input
                  id={F.telefono}
                  type="text"
                  value={formData.telefono ?? ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor={F.email} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </label>
                <input
                  id={F.email}
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
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Ubicación</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor={F.pais} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  País *
                </label>
                <SelectSearch
                  inputId={F.pais}
                  options={paises.map((p) => ({ value: p.id, label: p.nombre }))}
                  value={formData.pais_id}
                  onChange={(v) => setFormData({ ...formData, pais_id: v })}
                  placeholder="Buscar país..."
                  isRequired
                  ariaLabel="País"
                />
              </div>
              <div>
                <label htmlFor={F.departamento} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Departamento *
                </label>
                <SelectSearch
                  inputId={F.departamento}
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
                <label htmlFor={F.municipio} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Municipio *
                </label>
                <SelectSearch
                  inputId={F.municipio}
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
            <p className="mt-2 rounded bg-gray-100 p-3 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Dirección deshabilitada temporalmente. Por lineamientos internos no se está capturando la dirección residencial en este formulario.
            </p>
          </section>

          {/* Caracterización */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">Caracterización</h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Marca una o varias categorías que describan la caracterización de la persona.
            </p>
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded border border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-600">
              {caracterizacion.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={caracterizacionIds.includes(c.id)}
                    onChange={() => toggleCaracterizacion(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="persona-modal-status"
              checked={formData.status ?? true}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="persona-modal-status" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
              Activo
            </label>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-600">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {persona ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
};
