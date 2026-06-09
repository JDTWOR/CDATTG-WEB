import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { RouteLoadingFallback } from './components/RouteLoadingFallback';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BreadcrumbProvider } from './navigation/breadcrumb';
import { appRouter } from './routes/router';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BreadcrumbProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <RouterProvider router={appRouter} />
          </Suspense>
        </BreadcrumbProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
