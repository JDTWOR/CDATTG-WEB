import { useEffect, useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import {

  AcademicCapIcon,

  BuildingOffice2Icon,

  CalendarDaysIcon,

  ChartBarIcon,

  ClipboardDocumentCheckIcon,

  ClipboardDocumentListIcon,

  DocumentTextIcon,

  ExclamationTriangleIcon,

  MapPinIcon,

  UserGroupIcon,

} from '@heroicons/react/24/outline';

import { useAuth } from '../../context/AuthContext';

import { apiService } from '../../services/api';

import { asistenciaPaths, bienestarPaths, fichasPaths } from '../../routes/paths';

import { canViewCasosBienestar } from '../bienestar/casos/casosBienestarPermissions';

import { AsistenciaPorSedeChart } from '../../components/dashboard/AsistenciaPorSedeChart';

import { CoberturaOperativaChart } from '../../components/dashboard/CoberturaOperativaChart';

import { AsistenciaUltimosDiasChart } from '../../components/dashboard/AsistenciaUltimosDiasChart';

import { DashboardFilters } from '../../components/dashboard/DashboardFilters';

import { InfoTooltip } from '../../components/dashboard/InfoTooltip';

import { KpiCard } from '../../components/dashboard/KpiCard';

import {

  calcularMetricasDesdeResumen,

  filtrarFilasFicha,

  FiltrosDashboard,

  useJornadasDisponibles,

} from './dashboardFichaFilters';

import { useDashboardResumen } from './useDashboardResumen';

import { nombrePrimerNombrePrimerApellido } from '../../utils/formatNombreCorto';

import { etiquetaDiaConsulta, formatFechaVista, hoyISOColombia } from '../../utils/formatFecha';

import type { RegionalItem, SedeItem } from '../../types';



function fmtDashboardNum(n: number | null | undefined, loading: boolean): string {

  if (loading && n == null) return '…';

  if (n == null) return '—';

  return n.toLocaleString('es-CO');

}



function buildResumenFichasTooltip(

  fecha: string,

  data: ReturnType<typeof useDashboardResumen>['data'],

  metricas: ReturnType<typeof calcularMetricasDesdeResumen> | null,

): string {

  const dia = etiquetaDiaConsulta(fecha);

  return (

    `Fichas activas con formación ${dia} sin sesión de asistencia registrada. ` +

    `Resumen: ${data?.institucion.total_fichas_activas ?? 0} activas · ` +

    `${metricas?.fichasConSesion ?? data?.asistencia_hoy.fichas_con_sesion ?? 0} con sesión · ` +

    `${metricas?.fichasSinSesion ?? data?.asistencia_hoy.fichas_sin_sesion ?? 0} sin sesión.`

  );

}



function DashboardEmptyAlcance() {

  return (

    <div className="card text-center py-12">

      <p className="text-gray-600 dark:text-gray-400">

        No tiene regional asignada. Contacte al administrador para asignar su alcance territorial.

      </p>

    </div>

  );

}



type DashboardAccesosDirectosProps = Readonly<{

  canSeeAsistencia: boolean;

  canSeeBienestar: boolean;

  canVerAsistenciaDetalle: boolean;

}>;



function DashboardAccesosDirectos({

  canSeeAsistencia,

  canSeeBienestar,

  canVerAsistenciaDetalle,

}: DashboardAccesosDirectosProps) {

  return (

    <div className="card">

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Accesos directos</h2>

      <div className="flex flex-wrap gap-3">

        {canSeeAsistencia ? (

          <Link to={asistenciaPaths.fichas} className="btn-secondary text-sm inline-flex items-center gap-2">

            <AcademicCapIcon className="w-4 h-4" aria-hidden />

            Tomar asistencia

          </Link>

        ) : null}

        {canSeeBienestar ? (

          <Link to={bienestarPaths.casos.index} className="btn-secondary text-sm inline-flex items-center gap-2">

            <ExclamationTriangleIcon className="w-4 h-4" aria-hidden />

            Casos bienestar

          </Link>

        ) : null}

        {canVerAsistenciaDetalle ? (

          <Link to={asistenciaPaths.index} className="btn-secondary text-sm inline-flex items-center gap-2">

            <ChartBarIcon className="w-4 h-4" aria-hidden />

            Dashboard asistencia detallado

          </Link>

        ) : null}

      </div>

    </div>

  );

}



export function AdminDashboardView() {

  const { user, roles, hasPermission } = useAuth();

  const esCoordinador = roles.includes('COORDINADOR');

  const esAdmin = roles.includes('SUPER ADMINISTRADOR') || roles.includes('ADMINISTRADOR');

  const puedeFiltrosInst = esAdmin && !esCoordinador;



  const [fecha, setFecha] = useState(hoyISOColombia);

  const [regionalId, setRegionalId] = useState('');

  const [sedeId, setSedeId] = useState('');

  const [regionales, setRegionales] = useState<RegionalItem[]>([]);

  const [sedes, setSedes] = useState<SedeItem[]>([]);



  const {

    data,

    loading,

    error,

    jornadaFilter,

    setJornadaFilter,

    searchQuery,

    setSearchQuery,

  } = useDashboardResumen({

    fecha,

    regionalId: regionalId ? Number(regionalId) : undefined,

    sedeId: sedeId ? Number(sedeId) : undefined,

  });



  const refetching = loading && data != null;



  useEffect(() => {

    if (!puedeFiltrosInst) return;

    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])

      .then(([regs, sds]) => {

        setRegionales(regs);

        setSedes(sds);

      })

      .catch(() => {

        /* filtros opcionales */

      });

  }, [puedeFiltrosInst]);



  const metricas = useMemo(

    () => (data ? calcularMetricasDesdeResumen(data, jornadaFilter) : null),

    [data, jornadaFilter],

  );



  const jornadasDisponibles = useJornadasDisponibles(

    data?.jornadas_disponibles,

    data?.por_ficha ?? [],

    data?.fichas_sin_sesion ?? [],

  );



  const fichasSinSesionFiltradas = useMemo(

    () => filtrarFilasFicha(data?.fichas_sin_sesion ?? [], searchQuery, jornadaFilter),

    [data?.fichas_sin_sesion, searchQuery, jornadaFilter],

  );



  const canSeeAsistencia = hasPermission('VER ASISTENCIA') || roles.includes('SUPER ADMINISTRADOR');

  const canSeeBienestar = canViewCasosBienestar(roles);

  const canVerAsistenciaDetalle =

    roles.includes('SUPER ADMINISTRADOR') || roles.includes('BIENESTAR AL APRENDIZ');



  if (data?.alcance.empty) {

    return <DashboardEmptyAlcance />;

  }



  const resumenFichasTooltip = buildResumenFichasTooltip(fecha, data, metricas);

  const diaConsulta = etiquetaDiaConsulta(fecha);



  return (

    <div className="space-y-6">

      <div>

        <p className="text-gray-600 dark:text-gray-400">Bienvenido, {user?.full_name}</p>

        {data?.alcance.restricted && data.alcance.regional_nombres.length > 0 ? (

          <span className="inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">

            {data.alcance.regional_nombres.join(' · ')}

          </span>

        ) : null}

      </div>



      {error ? (

        <p role="alert" className="text-sm text-red-600 dark:text-red-400">

          {error}

        </p>

      ) : null}



      <DashboardFilters

        fecha={fecha}

        onFechaChange={setFecha}

        loading={refetching}

        showInstitutionalFilters={puedeFiltrosInst}

        regionalId={regionalId}

        onRegionalIdChange={setRegionalId}

        sedeId={sedeId}

        onSedeIdChange={setSedeId}

        regionales={regionales}

        sedes={sedes}

      />



      <div className={`space-y-6 transition-opacity ${refetching ? 'opacity-60' : ''}`}>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">

          <KpiCard

            label="Regionales"

            value={fmtDashboardNum(data?.institucion.total_regionales, loading)}

            icon={<MapPinIcon className="w-6 h-6 text-sena-green" aria-hidden />}

            accentClass="bg-green-50 dark:bg-green-900/30"

          />

          <KpiCard

            label="Sedes"

            value={fmtDashboardNum(data?.institucion.total_sedes, loading)}

            icon={<BuildingOffice2Icon className="w-6 h-6 text-sena-dark" aria-hidden />}

            accentClass="bg-slate-100 dark:bg-slate-800/50"

          />

          <KpiCard

            label="Fichas activas"

            value={fmtDashboardNum(data?.institucion.total_fichas_activas, loading)}

            icon={<DocumentTextIcon className="w-6 h-6 text-sena-green" aria-hidden />}

            accentClass="bg-green-50 dark:bg-green-900/30"

          />

          <KpiCard

            label="Aprendices"

            value={fmtDashboardNum(data?.institucion.total_aprendices, loading)}

            icon={<UserGroupIcon className="w-6 h-6 text-sena-dark" aria-hidden />}

            accentClass="bg-slate-100 dark:bg-slate-800/50"

          />

          <KpiCard

            label="En formación ahora"

            value={fmtDashboardNum(metricas?.enFormacion ?? data?.asistencia_hoy.en_formacion_ahora, loading)}

            tooltip={`Aprendices con ingreso ${diaConsulta} y salida sin registrar.`}

            icon={<ChartBarIcon className="w-6 h-6 text-sena-green" aria-hidden />}

            accentClass="bg-green-50 dark:bg-green-900/30"

          />

          <KpiCard

            label="% cobertura"

            value={

              loading

                ? '…'

                : `${metricas?.pctCobertura ?? data?.asistencia_hoy.pct_cobertura ?? 0}%`

            }

            tooltip={`Porcentaje de fichas con sesión de asistencia ${diaConsulta} (según jornada filtrada).`}

            icon={<ClipboardDocumentListIcon className="w-6 h-6 text-sena-dark" aria-hidden />}

            accentClass="bg-slate-100 dark:bg-slate-800/50"

          />

        </div>



        <FiltrosDashboard

          searchQuery={searchQuery}

          onSearchQueryChange={setSearchQuery}

          jornadaFilter={jornadaFilter}

          onJornadaFilterChange={setJornadaFilter}

          jornadasDisponibles={jornadasDisponibles}

        />



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="card">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asistencia por sede</h2>

            <AsistenciaPorSedeChart data={metricas?.porSede ?? data?.por_sede ?? []} />

          </div>

          <div className="card">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cobertura operativa</h2>

            <CoberturaOperativaChart

              fichasConSesion={metricas?.fichasConSesion ?? data?.asistencia_hoy.fichas_con_sesion ?? 0}

              fichasSinSesion={metricas?.fichasSinSesion ?? data?.asistencia_hoy.fichas_sin_sesion ?? 0}

            />

          </div>

        </div>



        <div className="card">

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">

            Asistencia — últimos 7 días de formación

          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">

            Aprendices esperados vs. asistencia efectiva registrada por día (hasta {formatFechaVista(fecha)}).

          </p>

          <AsistenciaUltimosDiasChart data={data?.ultimos_dias_formacion ?? []} />

        </div>



        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <KpiCard

            label="Casos bienestar"

            value={fmtDashboardNum(data?.riesgo.casos_bienestar, loading)}

            tooltip="Aprendices con ≥3 inasistencias en los últimos 30 días."

            icon={<ExclamationTriangleIcon className="w-6 h-6 text-sena-orange" aria-hidden />}

            accentClass="bg-orange-50 dark:bg-orange-900/30"

          />

          <KpiCard

            label="Pendientes revisión"

            value={fmtDashboardNum(data?.riesgo.pendientes_revision, loading)}

            tooltip={`Registros de ${diaConsulta} que requieren revisión del instructor.`}

            icon={<ClipboardDocumentCheckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden />}

            accentClass="bg-amber-100 dark:bg-amber-900/50"

          />

          <KpiCard

            label={`Fichas sin sesión ${diaConsulta}`}

            value={fmtDashboardNum(metricas?.fichasSinSesion ?? data?.asistencia_hoy.fichas_sin_sesion, loading)}

            tooltip={resumenFichasTooltip}

            icon={<CalendarDaysIcon className="w-6 h-6 text-sena-orange" aria-hidden />}

            accentClass="bg-orange-50 dark:bg-orange-900/30"

          />

        </div>



        <div className="card">

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">

            <span>Fichas pendientes (sin sesión {diaConsulta})</span>

            <span className="ml-2 text-primary-600 dark:text-primary-400 tabular-nums">

              {fichasSinSesionFiltradas.length}

            </span>

            <InfoTooltip text={resumenFichasTooltip} />

          </h2>

          <div className="mt-4 overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">

              <thead className="bg-gray-50 dark:bg-gray-700/50">

                <tr>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Ficha</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Programa</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Jornada</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Sede</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Instructor</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Aprendices</th>

                  <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-300 uppercase text-xs">Acción</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                {fichasSinSesionFiltradas.length === 0 ? (

                  <tr>

                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">

                      {loading ? 'Cargando…' : 'No hay fichas pendientes con el filtro actual.'}

                    </td>

                  </tr>

                ) : (

                  fichasSinSesionFiltradas.map((f) => {

                    const instructorCorto = nombrePrimerNombrePrimerApellido(f.instructor_nombre);

                    return (

                      <tr key={f.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">

                        <td className="px-3 py-2 text-center font-medium text-gray-900 dark:text-white">{f.ficha_numero}</td>

                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{f.programa_nombre ?? '—'}</td>

                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{f.jornada_nombre ?? '—'}</td>

                        <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{f.sede_nombre ?? '—'}</td>

                        <td className="px-3 py-2 text-center">

                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">

                            {instructorCorto}

                          </span>

                        </td>

                        <td className="px-3 py-2 text-center tabular-nums">{f.total_aprendices}</td>

                        <td className="px-3 py-2 text-center">

                          <Link

                            to={fichasPaths.detalle(f.ficha_id)}

                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-medium"

                          >

                            Ver ficha

                          </Link>

                        </td>

                      </tr>

                    );

                  })

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>



      <DashboardAccesosDirectos

        canSeeAsistencia={canSeeAsistencia}

        canSeeBienestar={canSeeBienestar}

        canVerAsistenciaDetalle={canVerAsistenciaDetalle}

      />

    </div>

  );

}


