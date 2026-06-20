import { hasAnyRole } from '../../utils/roles';
import type { SidebarManifestItem } from '../../navigation/sidebar';

export function isSidebarItemVisible(
  item: SidebarManifestItem,
  roles: string[],
  hasPermission: (permission: string) => boolean,
): boolean {
  if (item.rolesRequired && item.rolesRequired.length > 0) {
    const matchRequired = hasAnyRole(roles, item.rolesRequired);
    const matchAlsoRole = item.alsoVisibleForRoles?.some((r) => hasAnyRole(roles, [r])) ?? false;
    const matchAlsoPerm = item.alsoVisibleForPermissions?.some((p) => hasPermission(p)) ?? false;
    if (!matchRequired && !matchAlsoRole && !matchAlsoPerm) return false;
  }
  if (item.permission === null) return true;
  if (hasPermission(item.permission)) return true;
  if (item.alsoVisibleForPermissions?.some((p) => hasPermission(p))) return true;
  if (item.alsoVisibleForRoles?.length && hasAnyRole(roles, item.alsoVisibleForRoles)) return true;
  return false;
}

export function filterVisibleSidebarItems(
  items: SidebarManifestItem[],
  roles: string[],
  hasPermission: (permission: string) => boolean,
): SidebarManifestItem[] {
  return items.filter((item) => isSidebarItemVisible(item, roles, hasPermission));
}
