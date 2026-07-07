import Select from 'react-select';
import type { SelectOption } from './SelectSearch';
import { selectStylesMulti, selectTheme } from './selectSearchTheme';

interface SelectSearchMultiProps {
  options: SelectOption[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  ariaLabel?: string;
  inputId?: string;
}

export function SelectSearchMulti(props: Readonly<SelectSearchMultiProps>) {
  const {
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    isDisabled = false,
    ariaLabel,
    inputId,
  } = props;

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div className="react-select-wrapper w-full">
      <Select<SelectOption, true>
        inputId={inputId}
        isMulti
        options={options}
        value={selectedOptions}
        onChange={(opts) => onChange(opts.map((o) => o.value))}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable
        isSearchable
        closeMenuOnSelect={false}
        noOptionsMessage={() => 'Sin opciones'}
        loadingMessage={() => 'Cargando...'}
        theme={selectTheme}
        styles={selectStylesMulti}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        aria-label={ariaLabel}
        classNames={{
          control: () => 'w-full',
        }}
      />
    </div>
  );
}
