/**
 * @module features/personalRol/types
 * @description Tipos compartidos del módulo Personal (Operativo y de Apoyo, Administrativo y Contratistas).
 * @author JDTWOR
 * @created 2026-08-14
 */

/** Ítem de listado de una persona vinculada a un rol del módulo Personal. */
export interface PersonalRolItem {
  id: number;
  nombre: string;
  numero_documento?: string;
  estado?: boolean;
}

/** Creación desde una persona existente. */
export interface CreatePersonalRolRequest {
  persona_id: number;
}

/** Actualización de estado. */
export interface UpdatePersonalRolRequest {
  estado?: boolean;
}

/** Resultado de una importación masiva desde Excel. */
export interface PersonalRolImportResult {
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
}

/** Ítem del historial de importaciones. */
export interface PersonalRolImportLogItem {
  id: number;
  filename: string;
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
  usuario_nombre: string;
  created_at: string;
}