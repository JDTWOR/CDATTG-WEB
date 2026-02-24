import { useCallback, useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import type { StylesConfig, ThemeConfig } from 'react-select';
import { apiService } from '../services/api';
import type { SelectOption } from './SelectSearch';

const selectTheme: ThemeConfig = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#0284c7',
    primary25: '#e0f2fe',
    primary50: '#bae6fd',
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
  control: (base) => ({
    ...base,
    minHeight: 42,
    borderRadius: '0.5rem',
    borderColor: 'var(--select-border)',
    backgroundColor: 'var(--select-bg)',
    '&:hover': { borderColor: 'var(--select-border-hover)' },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--select-text)',
  }),
  input: (base) => ({
    ...base,
    color: 'var(--select-text)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--select-text-muted)',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--select-menu-bg)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? 'var(--select-option-focus)' : 'transparent',
    color: 'var(--select-text)',
  }),
};

interface PersonaSelectAsyncProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
}

/**
 * Selector de persona que busca en el servidor por nombre o documento.
 * Así se encuentra cualquier persona aunque no esté en las primeras 500.
 */
export function PersonaSelectAsync({
  value,
  onChange,
  placeholder = 'Buscar por nombre o documento...',
  isDisabled = false,
  isRequired = false,
}: PersonaSelectAsyncProps) {
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);

  useEffect(() => {
    if (value === undefined || value == null) setSelectedOption(null);
  }, [value]);

  const loadOptions = useCallback(async (inputValue: string): Promise<SelectOption[]> => {
    const search = inputValue.trim();
    const res = await apiService.getPersonas(1, 50, search);
    return res.data.map((p) => ({
      value: p.id,
      label: p.numero_documento ? `${p.full_name} - ${p.numero_documento}` : p.full_name,
    }));
  }, []);

  return (
    <div className="react-select-wrapper">
      <AsyncSelect<SelectOption, false>
        loadOptions={loadOptions}
        defaultOptions={true}
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
          inputValue ? 'Sin resultados. Busque por nombre o documento.' : 'Escriba para buscar...'
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
