import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Layout } from '../../components/Layout';

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}
