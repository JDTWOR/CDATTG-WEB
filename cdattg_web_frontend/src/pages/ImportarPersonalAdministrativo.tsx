/**
 * @module pages/ImportarPersonalAdministrativo
 * @description Página de importación masiva de Personal Administrativo (compone el feature personalRol).
 * @author JDTWOR
 * @created 2026-08-14
 */
import { personalAdministrativoConfig } from '../features/personalRol/config';
import { PersonalRolImportPage } from '../features/personalRol/PersonalRolImportPage';

export const ImportarPersonalAdministrativo = () => <PersonalRolImportPage config={personalAdministrativoConfig} />;