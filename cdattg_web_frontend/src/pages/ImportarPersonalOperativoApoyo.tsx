/**
 * @module pages/ImportarPersonalOperativoApoyo
 * @description Página de importación masiva de Personal Operativo y de Apoyo desde Excel.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { personalOperativoApoyoConfig } from '../features/personalRol/config';
import { PersonalRolImportPage } from '../features/personalRol/PersonalRolImportPage';

export const ImportarPersonalOperativoApoyo = () => (
  <PersonalRolImportPage config={personalOperativoApoyoConfig} />
);