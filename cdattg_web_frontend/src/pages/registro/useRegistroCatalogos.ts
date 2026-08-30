/**
 * Aquí cargo las listas del registro: tipos de documento, géneros, municipios, etc.
 * Salen del API público de catálogos (sin sesión).
 * País y departamento los manda el wizard para la cascada.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { portalApi } from '../../services/portalApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';

/**
 * Catálogos públicos del registro, con cascada país → departamento → municipio.
 * @param paisId País elegido (0 = aún no eligió)
 * @param departamentoId Departamento elegido
 * @returns Listas y un error si falló la carga inicial
 */
export function useRegistroCatalogos(paisId: number, departamentoId: number) {
  const [tipos, setTipos] = useState<ParametroItem[]>([]);
  const [generos, setGeneros] = useState<ParametroItem[]>([]);
  const [cars, setCars] = useState<ParametroItem[]>([]);
  const [paises, setPaises] = useState<PaisItem[]>([]);
  const [deps, setDeps] = useState<DepartamentoItem[]>([]);
  const [muns, setMuns] = useState<MunicipioItem[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState('');

  useEffect(() => {
    // Estas cuatro listas no dependen de lo que elija la persona.
    void Promise.all([
      portalApi.catalogoTiposDocumento(), portalApi.catalogoGeneros(),
      portalApi.catalogoCaracterizacion(), portalApi.catalogoPaises(),
    ]).then(([t, g, c, p]) => { setTipos(t); setGeneros(g); setCars(c); setPaises(p); })
      .catch((cause: unknown) => setErrorCatalogo(axiosErrorMessage(cause, 'No se pudieron cargar los catálogos')));
  }, []);

  useEffect(() => {
    // Sin país no hay departamentos; vacío la lista para no mostrar los del país anterior.
    if (!paisId) { setDeps([]); return; }
    portalApi.catalogoDepartamentos(paisId).then(setDeps).catch(() => setDeps([]));
  }, [paisId]);

  useEffect(() => {
    if (!departamentoId) { setMuns([]); return; }
    portalApi.catalogoMunicipios(departamentoId).then(setMuns).catch(() => setMuns([]));
  }, [departamentoId]);

  return { tipos, generos, cars, paises, deps, muns, errorCatalogo };
}
