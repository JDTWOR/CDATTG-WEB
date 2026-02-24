import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { SelectSearch } from '../components/SelectSearch';
import type {
  FichaCaracterizacionResponse,
  InstructorFichaResponse,
  InstructorItem,
  InstructorFichaItem,
  AsignarInstructoresRequest,
  AprendizResponse,
  PersonaResponse,
} from '../types';

type Tab = 'instructores' | 'aprendices';

export const FichaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const fichaId = id ? parseInt(id, 10) : 0;

  const [ficha, setFicha] = useState<FichaCaracterizacionResponse | null>(null);
  const [instructores, setInstructores] = useState<InstructorFichaResponse[]>([]);
  const [instructoresDisponibles, setInstructoresDisponibles] = useState<InstructorItem[]>([]);
  const [aprendices, setAprendices] = useState<AprendizResponse[]>([]);
  const [personas, setPersonas] = useState<PersonaResponse[]>([]);
  const [tab, setTab] = useState<Tab>('instructores');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form asignar instructores
  const [showFormInstructores, setShowFormInstructores] = useState(false);
  const [instructorPrincipalId, setInstructorPrincipalId] = useState<number>(0);
  const [instructoresSeleccionados, setInstructoresSeleccionados] = useState<InstructorFichaItem[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Form asignar aprendices
  const [showFormAprendices, setShowFormAprendices] = useState(false);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<number[]>([]);

  const loadFicha = async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaCaracterizacionById(fichaId);
      setFicha(data);
      setInstructorPrincipalId(data.instructor_id ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar ficha');
    }
  };

  const loadInstructores = async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaInstructores(fichaId);
      setInstructores(data);
    } catch (_) {}
  };

  const loadAprendices = async () => {
    if (!fichaId) return;
    try {
      const data = await apiService.getFichaAprendices(fichaId);
      setAprendices(data);
    } catch (_) {}
  };

  const loadInstructoresDisponibles = async () => {
    try {
      const data = await apiService.getInstructores();
      setInstructoresDisponibles(data);
    } catch (_) {}
  };

  const loadPersonas = async () => {
    try {
      const res = await apiService.getPersonas(1, 500);
      setPersonas(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    if (!fichaId) return;
    setLoading(true);
    Promise.all([loadFicha(), loadInstructores(), loadAprendices(), loadInstructoresDisponibles(), loadPersonas()]).finally(
      () => setLoading(false)
    );
  }, [fichaId]);

  useEffect(() => {
    if (tab === 'instructores') loadInstructores();
    else loadAprendices();
  }, [tab, fichaId]);

  const handleAsignarInstructores = async () => {
    if (instructoresSeleccionados.length === 0 || !instructorPrincipalId) {
      alert('Seleccione al menos un instructor y un instructor principal.');
      return;
    }
    const req: AsignarInstructoresRequest = {
      instructor_principal_id: instructorPrincipalId,
      instructores: instructoresSeleccionados.map((i) => ({
        instructor_id: i.instructor_id,
        fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        fecha_fin: fechaFin || new Date().toISOString().slice(0, 10),
      })),
    };
    try {
      await apiService.asignarInstructores(fichaId, req);
      setShowFormInstructores(false);
      setInstructoresSeleccionados([]);
      loadInstructores();
      loadFicha();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al asignar instructores');
    }
  };

  const addInstructorToForm = (instructorId: number) => {
    if (instructoresSeleccionados.some((i) => i.instructor_id === instructorId)) return;
    setInstructoresSeleccionados((prev) => [
      ...prev,
      {
        instructor_id: instructorId,
        fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
        fecha_fin: fechaFin || new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const removeInstructorFromForm = (instructorId: number) => {
    setInstructoresSeleccionados((prev) => prev.filter((i) => i.instructor_id !== instructorId));
  };

  const handleDesasignarInstructor = async (instructorId: number) => {
    if (!confirm('¿Desasignar este instructor de la ficha?')) return;
    try {
      await apiService.desasignarInstructor(fichaId, instructorId);
      loadInstructores();
      loadFicha();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al desasignar');
    }
  };

  const handleAsignarAprendices = async () => {
    if (personasSeleccionadas.length === 0) {
      alert('Seleccione al menos una persona.');
      return;
    }
    try {
      await apiService.asignarAprendices(fichaId, personasSeleccionadas);
      setShowFormAprendices(false);
      setPersonasSeleccionadas([]);
      loadAprendices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al asignar aprendices');
    }
  };

  const handleDesasignarAprendices = async (personasIds: number[]) => {
    if (personasIds.length === 0 || !confirm('¿Desasignar los aprendices seleccionados?')) return;
    try {
      await apiService.desasignarAprendices(fichaId, personasIds);
      loadAprendices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al desasignar');
    }
  };

  const aprendicesIdsEnFicha = new Set(aprendices.map((a) => a.persona_id));
  const personasNoAprendices = personas.filter((p) => !aprendicesIdsEnFicha.has(p.id));

  if (loading || !ficha) {
    return (
      <div className="flex items-center justify-center py-12">
        {error || 'Cargando...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/fichas" className="text-gray-600 hover:text-gray-900">
          ← Fichas
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ficha {ficha.ficha}</h1>
          <p className="text-gray-600">{ficha.programa_formacion_nombre}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('instructores')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              tab === 'instructores'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Instructores
          </button>
          <button
            onClick={() => setTab('aprendices')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              tab === 'aprendices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Aprendices
          </button>
        </nav>
      </div>

      {tab === 'instructores' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Instructores asignados a esta ficha</h2>
            <button onClick={() => setShowFormInstructores(true)} className="btn-primary">
              Asignar instructores
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {instructores.length === 0 ? (
              <li className="py-4 text-gray-500">Ningún instructor asignado.</li>
            ) : (
              instructores.map((inst) => (
                <li key={inst.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{inst.instructor_nombre}</span>
                    {inst.fecha_inicio && (
                      <span className="text-sm text-gray-500 ml-2">
                        {inst.fecha_inicio} – {inst.fecha_fin}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDesasignarInstructor(inst.instructor_id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Desasignar
                  </button>
                </li>
              ))
            )}
          </ul>

          {showFormInstructores && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Asignar instructores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instructor principal</label>
                  <div className="mt-1">
                    <SelectSearch
                      options={instructoresDisponibles.map((i) => ({ value: i.id, label: i.nombre }))}
                      value={instructorPrincipalId || undefined}
                      onChange={(v) => setInstructorPrincipalId(v ?? 0)}
                      placeholder="Seleccione instructor principal..."
                      isRequired
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructores a asignar</label>
                <div className="flex flex-wrap gap-2">
                  {instructoresDisponibles.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => addInstructorToForm(i.id)}
                      disabled={instructoresSeleccionados.some((s) => s.instructor_id === i.id)}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      + {i.nombre}
                    </button>
                  ))}
                </div>
                {instructoresSeleccionados.length > 0 && (
                  <ul className="mt-2 text-sm">
                    {instructoresSeleccionados.map((s) => {
                      const nom = instructoresDisponibles.find((i) => i.id === s.instructor_id)?.nombre;
                      return (
                        <li key={s.instructor_id} className="flex items-center gap-2">
                          {nom}
                          <button
                            type="button"
                            onClick={() => removeInstructorFromForm(s.instructor_id)}
                            className="text-red-600"
                          >
                            Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFormInstructores(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleAsignarInstructores} className="btn-primary">
                  Guardar asignación
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'aprendices' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Aprendices asignados a esta ficha</h2>
            <button onClick={() => setShowFormAprendices(true)} className="btn-primary">
              Asignar aprendices
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {aprendices.filter((a) => a.estado).length === 0 ? (
              <li className="py-4 text-gray-500">Ningún aprendiz asignado.</li>
            ) : (
              aprendices
                .filter((a) => a.estado)
                .map((a) => (
                  <li key={a.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium">{a.persona_nombre}</span>
                    <button
                      onClick={() => handleDesasignarAprendices([a.persona_id])}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Desasignar
                    </button>
                  </li>
                ))
            )}
          </ul>

          {showFormAprendices && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Asignar aprendices (personas)</h3>
              <p className="text-sm text-gray-600 mb-2">Seleccione personas que aún no están en esta ficha:</p>
              <div className="max-h-48 overflow-y-auto border rounded p-2 mb-4">
                {personasNoAprendices.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay personas disponibles para asignar.</p>
                ) : (
                  personasNoAprendices.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={personasSeleccionadas.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setPersonasSeleccionadas((prev) => [...prev, p.id]);
                          else setPersonasSeleccionadas((prev) => prev.filter((id) => id !== p.id));
                        }}
                      />
                      <span className="text-sm">{p.full_name} ({p.numero_documento})</span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFormAprendices(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleAsignarAprendices} className="btn-primary">
                  Guardar asignación
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
