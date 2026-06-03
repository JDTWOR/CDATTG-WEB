import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type BreadcrumbOverrides = Record<string, string>;

type BreadcrumbContextValue = {
  setLabel: (key: string, label: string) => void;
  clearLabel: (key: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);
const OverridesContext = createContext<BreadcrumbOverrides>({});

export function BreadcrumbProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [overrides, setOverrides] = useState<BreadcrumbOverrides>({});

  const setLabel = useCallback((key: string, label: string) => {
    setOverrides((prev) => ({ ...prev, [key]: label }));
  }, []);

  const clearLabel = useCallback((key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ setLabel, clearLabel }), [setLabel, clearLabel]);

  return (
    <BreadcrumbContext.Provider value={value}>
      <OverridesContext.Provider value={overrides}>{children}</OverridesContext.Provider>
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbOverride() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error('useBreadcrumbOverride debe usarse dentro de BreadcrumbProvider');
  }
  return ctx;
}

export function useBreadcrumbOverrides(): BreadcrumbOverrides {
  return useContext(OverridesContext);
}
