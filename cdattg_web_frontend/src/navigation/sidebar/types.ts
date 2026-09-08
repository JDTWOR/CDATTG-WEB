/** Ítem de navegación lateral (paths desde routes/paths.ts). */
export interface SidebarManifestItem {
  section: string;
  path: string;
  label: string;
  permission: string | null;
  rolesRequired?: string[];
  alsoVisibleForRoles?: string[];
  alsoVisibleForPermissions?: string[];
  /** Roles que nunca deben ver el ítem, aunque cumplan el permiso. */
  hiddenForRoles?: string[];
  iconKey: string;
}
