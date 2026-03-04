import { useCallback, useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import type { StylesConfig, ThemeConfig } from 'react-select';
import { apiService } from '../services/api';
import type { SelectOption } from './SelectSearch';

const selectTheme: ThemeConfig = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#0ea5e9',
    primary25: '#f0f9ff',
    primary50: '#e0f2fe',
    neutral0: 'var(--select-bg)',
    neutral5: 'var(--select-border)',
    neutral10: 'var(--select-border)',
    neutral20: 'var(--select-border)',
    neutral30: 'var(--select-border)',
    neutral40: 'var(--select-text-muted)',
    neutral50: 'var(--select-text-muted)',
    neutral60: 'var(--select-text)',
    neutral70: 'var(--select-text)',
    neutral80: 'var(--select-text)',
    neutral90: 'var(--select-text)',
  },
});

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: '0.5rem',
    borderWidth: 1,
    borderColor: state.isFocused ? '#0ea5e9' : 'var(--select-border)',
    backgroundColor: 'var(--select-bg)',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(14, 165, 233, 0.25)' : 'none',
    '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : 'var(--select-border-hover)' },
  }),
  singleValue: (base) => ({ ...base, color: 'var(--select-text)', fontSize: '0.875rem' }),
  placeholder: (base) => ({ ...base, color: 'var(--select-text-muted)', fontSize: '0.875rem' }),
  input: (base) => ({ ...base, color: 'var(--select-text)', margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#0ea5e9' : 'var(--select-text-muted)',
    padding: 8,
  }),
  clearIndicator: (base) => ({ ...base, padding: 6 }),
  menu: (base) => ({
    ...base,
    marginTop: 4,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: 'var(--select-menu-bg)',
    border: '1px solid var(--select-border)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  menuList: (base) => ({ ...base, padding: 4, maxHeight: 280 }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    padding: '10px 12px',
    borderRadius: '0.375rem',
    backgroundColor: state.isFocused ? 'var(--select-option-focus)' : 'transparent',
    color: 'var(--select-text)',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

interface InstructorSelectAsyncProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  /** Etiqueta a mostrar cuando value está definido (ej. al editar) y aún no se ha cargado la opción */
  defaultLabel?: string;
}

/**
 * Selector de instructor que busca en el servidor por nombre o documento.
 * Así se encuentra cualquier instructor sin depender de una lista precargada.
 */
export function InstructorSelectAsync({
  value,
  onChange,
  placeholder = 'Buscar por nombre o documento...',
  isDisabled = false,
  isRequired = false,
  defaultLabel,
}: InstructorSelectAsyncProps) {
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);

  useEffect(() => {
    if (value === undefined || value == null) {
      setSelectedOption(null);
    } else if (defaultLabel) {
      setSelectedOption({ value, label: defaultLabel });
    }
  }, [value, defaultLabel]);

  const loadOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
    const search = inputValue.trim();
    const res = await apiService.getInstructores(1, 50, search || undefined);
    return res.data.map((i) => ({
      value: i.id,
      label: i.numero_documento ? `${i.nombre} - ${i.numero_documento}` : i.nombre,
    }));
  }, []);

  return (
    <div className="react-select-wrapper w-full">
      <AsyncSelect<SelectOption, false>
        loadOptions={loadOptions}
        defaultOptions={false}
        value={selectedOption}
        onChange={(opt) => {
          setSelectedOption(opt ?? null);
          onChange(opt?.value);
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable
        isSearchable
        noOptionsMessage={({ inputValue }) =>
          inputValue ? 'Sin resultados. Busque por nombre o documento.' : 'Escriba para buscar en todos los instructores.'
        }
        loadingMessage={() => 'Buscando...'}
        theme={selectTheme}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        required={isRequired}
        cacheOptions
        getOptionLabel={(o) => o.label}
        getOptionValue={(o) => String(o.value)}
      />
    </div>
  );
}
