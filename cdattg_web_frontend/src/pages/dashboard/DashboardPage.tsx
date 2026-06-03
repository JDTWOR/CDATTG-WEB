import { useAuth } from '../../context/AuthContext';
import { canAccessMainDashboard } from '../../utils/roles';
import { canVerMiAgenda } from '../../utils/programacionPermissions';
import { AdminDashboardView } from '../dashboard/AdminDashboardView';
import { InstructorDashboardPage } from '../instructor-dashboard/InstructorDashboardPage';

export function DashboardPage() {
  const { roles, hasPermission } = useAuth();
  const isAdminDashboard = canAccessMainDashboard(roles);
  const showInstructorDashboard = canVerMiAgenda(hasPermission) && !isAdminDashboard;

  if (showInstructorDashboard) {
    return <InstructorDashboardPage />;
  }
  if (isAdminDashboard) {
    return <AdminDashboardView />;
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-8 text-center">
      <p className="text-gray-600 dark:text-gray-400">No tiene permiso para acceder al dashboard.</p>
    </div>
  );
}
