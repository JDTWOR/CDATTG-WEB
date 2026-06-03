import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { canViewCasosBienestar, MENSAJE_SIN_PERMISO_CASOS_BIENESTAR } from '../casosBienestarPermissions';
import {
  agruparCasosPorFicha,
  filtrarGruposPorLista,
  programasUnicosDesdeGrupos,
  tieneFiltrosListaActivos,
} from '../casosBienestarUtils';
import { useCasosBienestar } from './useCasosBienestar';

export function useCasosBienestarListaPage() {
  const { roles } = useAuth();
  const canView = canViewCasosBienestar(roles);
  const [dias, setDias] = useState(30);
  const [minFallas, setMinFallas] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [programaFiltroIndex, setProgramaFiltroIndex] = useState(0);

  const { data, loading, error } = useCasosBienestar({
    enabled: canView,
    dias,
    minFallas,
  });

  const casosPorFicha = useMemo(
    () => (data && Array.isArray(data.casos) ? agruparCasosPorFicha(data.casos) : []),
    [data],
  );

  const programasOpciones = useMemo(
    () => programasUnicosDesdeGrupos(casosPorFicha),
    [casosPorFicha],
  );

  const programaNombreFiltro =
    programaFiltroIndex > 0 ? (programasOpciones[programaFiltroIndex - 1] ?? '') : '';

  const gruposFiltrados = useMemo(
    () =>
      filtrarGruposPorLista(casosPorFicha, {
        searchQuery,
        programaNombre: programaNombreFiltro,
      }),
    [casosPorFicha, searchQuery, programaNombreFiltro],
  );

  const filtrosActivos = tieneFiltrosListaActivos({
    searchQuery,
    programaNombre: programaNombreFiltro,
  });

  const permissionError = canView ? '' : MENSAJE_SIN_PERMISO_CASOS_BIENESTAR;

  return {
    canView,
    permissionError,
    dias,
    setDias,
    minFallas,
    setMinFallas,
    searchQuery,
    setSearchQuery,
    programaFiltroIndex,
    setProgramaFiltroIndex,
    programasOpciones,
    data,
    loading,
    error: canView ? error : permissionError,
    casosPorFicha,
    gruposFiltrados,
    filtrosActivos,
  };
}

export type CasosBienestarListaPageState = ReturnType<typeof useCasosBienestarListaPage>;
