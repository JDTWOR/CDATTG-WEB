import Select, { type StylesConfig, type ThemeConfig } from 'react-select';

export interface SelectOption {
  value: number;
  label: string;
}

interface SelectSearchProps {
  options: SelectOption[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  ariaLabel?: string;
}

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

export function SelectSearch({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  isDisabled = false,
  isRequired = false,
  ariaLabel,
}: SelectSearchProps) {
  const selectedOption =
    value !== undefined ? options.find((o) => o.value === value) || null : null;

  return (
    <div className="react-select-wrapper">
      <Select<SelectOption, false>
        options={options}
        value={selectedOption}
        onChange={(opt) => onChange(opt?.value)}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable
        isSearchable
        noOptionsMessage={() => 'Sin opciones'}
        loadingMessage={() => 'Cargando...'}
        theme={selectTheme}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        required={isRequired}
        aria-label={ariaLabel}
      />
    </div>
  );
}
