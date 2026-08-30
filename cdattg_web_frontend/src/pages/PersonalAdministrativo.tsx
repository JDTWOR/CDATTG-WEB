/**
 * @module pages/PersonalAdministrativo
 * @description Página de Personal Administrativo: CRUD e importación (compone el feature personalRol).
 * @author JDTWOR
 * @created 2026-08-14
 */
import { personalAdministrativoConfig } from '../features/personalRol/config';
import { PersonalRolPage } from '../features/personalRol/PersonalRolPage';

export const PersonalAdministrativo = () => <PersonalRolPage config={personalAdministrativoConfig} />;