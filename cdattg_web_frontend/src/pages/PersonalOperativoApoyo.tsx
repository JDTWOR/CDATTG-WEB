/**
 * @module pages/PersonalOperativoApoyo
 * @description Página de Personal Operativo y de Apoyo: CRUD e importación (compone el feature personalRol).
 * @author JDTWOR
 * @created 2026-08-14
 */
import { personalOperativoApoyoConfig } from '../features/personalRol/config';
import { PersonalRolPage } from '../features/personalRol/PersonalRolPage';

export const PersonalOperativoApoyo = () => <PersonalRolPage config={personalOperativoApoyoConfig} />;