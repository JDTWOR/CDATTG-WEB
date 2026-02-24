import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Personas } from './pages/Personas';
import { ImportarPersonas } from './pages/ImportarPersonas';
import { Instructores } from './pages/Instructores';
import { ImportarInstructores } from './pages/ImportarInstructores';
import { Aprendices } from './pages/Aprendices';
import { ProgramasFormacion } from './pages/ProgramasFormacion';
import { ImportarProgramas } from './pages/ImportarProgramas';
import { FichasCaracterizacion } from './pages/FichasCaracterizacion';
import { FichaDetalle } from './pages/FichaDetalle';
import { Asistencia } from './pages/Asistencia';
import { AsistenciaDashboard } from './pages/AsistenciaDashboard';
import { InventarioDashboard } from './pages/InventarioDashboard';
import { InventarioProductos } from './pages/InventarioProductos';
import { InventarioOrdenes } from './pages/InventarioOrdenes';
import { InventarioOrdenDetalle } from './pages/InventarioOrdenDetalle';
import { InventarioPendientesAprobacion } from './pages/InventarioPendientesAprobacion';
import { InventarioDevoluciones } from './pages/InventarioDevoluciones';
import { Permisos } from './pages/Permisos';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Personas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personas/importar"
            element={
              <ProtectedRoute>
                <Layout>
                  <ImportarPersonas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructores"
            element={
              <ProtectedRoute>
                <Layout>
                  <Instructores />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructores/importar"
            element={
              <ProtectedRoute>
                <Layout>
                  <ImportarInstructores />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aprendices"
            element={
              <ProtectedRoute>
                <Layout>
                  <Aprendices />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/programas"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProgramasFormacion />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/programas/importar"
            element={
              <ProtectedRoute>
                <Layout>
                  <ImportarProgramas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fichas"
            element={
              <ProtectedRoute>
                <Layout>
                  <FichasCaracterizacion />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fichas/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <FichaDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/asistencia"
            element={
              <ProtectedRoute>
                <Layout>
                  <Asistencia />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/asistencia/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <AsistenciaDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/productos"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioProductos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/ordenes"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioOrdenes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/ordenes/pendientes"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioPendientesAprobacion />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/ordenes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioOrdenDetalle />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario/devoluciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventarioDevoluciones />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/permisos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Permisos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/permisos/:userId"
            element={
              <ProtectedRoute>
                <Layout>
                  <Permisos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
