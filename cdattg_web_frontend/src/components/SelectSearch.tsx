import Select, { type StylesConfig, type ThemeConfig } from 'react-select';

export interface SelectOption {
  value: number;
  label: string;
}

interface SelectSearchProps {
  options: SelectOption[];
  value: number | null | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  ariaLabel?: string;
  /** Para asociar un <label htmlFor="..."> al control nativo de react-select */
  inputId?: string;
}

const selectTheme: ThemeConfig = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#0ea5e9',
    primary25: '#f0f9ff',
    primary50: '#e0f2fe',
    primary75: '#bae6fd',
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
  spacing: {
    ...theme.spacing,
    controlHeight: 42,
    baseUnit: 4,
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
    transition: 'border-color 0.15s, box-shadow 0.15s',
    '&:hover': {
      borderColor: state.isFocused ? '#0ea5e9' : 'var(--select-border-hover)',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '6px 0',
  }),
  input: (base) => ({
    ...base,
    color: 'var(--select-text)',
    margin: 0,
    padding: 0,
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--select-text)',
    fontSize: '0.875rem',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--select-text-muted)',
    fontSize: '0.875rem',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? '#0ea5e9' : 'var(--select-text-muted)',
    padding: 8,
    '&:hover': {
      color: 'var(--select-text)',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--select-text-muted)',
    padding: 6,
    '&:hover': {
      color: 'var(--select-text)',
    },
  }),
  menu: (base) => ({
    ...base,
    marginTop: 4,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: 'var(--select-menu-bg)',
    border: '1px solid var(--select-border)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
    maxHeight: 280,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    padding: '10px 12px',
    borderRadius: '0.375rem',
    backgroundColor: state.isFocused ? 'var(--select-option-focus)' : 'transparent',
    color: 'var(--select-text)',
    cursor: 'pointer',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export function SelectSearch(props: Readonly<SelectSearchProps>) {
  const {
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    isDisabled = false,
    isRequired = false,
    ariaLabel,
    inputId,
  } = props;
  const selectedOption =
    value !== undefined && value !== null ? options.find((o) => o.value === value) || null : null;

  return (
    <div className="react-select-wrapper w-full">
      <Select<SelectOption, false>
        inputId={inputId}
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
        classNames={{
          control: () => 'w-full',
        }}
      />
    </div>
  );
}
