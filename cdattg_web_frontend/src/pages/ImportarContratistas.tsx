/**
 * @module pages/ImportarContratistas
 * @description Página de importación masiva de Contratistas de Prestación de Servicios desde Excel.
 * @author JDTWOR
 * @created 2026-08-15
 */
import { contratistasConfig } from '../features/personalRol/config';
import { PersonalRolImportPage } from '../features/personalRol/PersonalRolImportPage';

export const ImportarContratistas = () => (
  <PersonalRolImportPage config={contratistasConfig} />
);