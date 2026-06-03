import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BreadcrumbProvider } from './navigation/breadcrumb';
import { appRouter } from './routes/router';

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}

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
