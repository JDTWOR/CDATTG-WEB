/**
 * @module pages/Contratistas
 * @description Página de Contratistas de Prestación de Servicios: CRUD e importación.
 * @author Cristian Deysdayr Jiménez
 * @created 2026-08-15
 */
import { contratistasConfig } from '../features/personalRol/config';
import { PersonalRolPage } from '../features/personalRol/PersonalRolPage';

export const Contratistas = () => <PersonalRolPage config={contratistasConfig} />;