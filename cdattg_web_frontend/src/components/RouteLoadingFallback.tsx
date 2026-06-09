/** Spinner mientras React Router carga rutas lazy (HydrateFallback / Suspense). */
export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}
