import type { StylesConfig, ThemeConfig } from 'react-select';
import type { SelectOption } from './SelectSearch';

export const selectTheme: ThemeConfig = (theme) => ({
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

const controlStyle = (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
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
});

const sharedStyles = {
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: '6px 0',
  }),
  input: (base: Record<string, unknown>) => ({
    ...base,
    color: 'var(--select-text)',
    margin: 0,
    padding: 0,
  }),
  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: 'var(--select-text-muted)',
    fontSize: '0.875rem',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    color: state.isFocused ? '#0ea5e9' : 'var(--select-text-muted)',
    padding: 8,
    '&:hover': {
      color: 'var(--select-text)',
    },
  }),
  clearIndicator: (base: Record<string, unknown>) => ({
    ...base,
    color: 'var(--select-text-muted)',
    padding: 6,
    '&:hover': {
      color: 'var(--select-text)',
    },
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    marginTop: 4,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    backgroundColor: 'var(--select-menu-bg)',
    border: '1px solid var(--select-border)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  }),
  menuList: (base: Record<string, unknown>) => ({
    ...base,
    padding: 4,
    maxHeight: 280,
  }),
  option: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    fontSize: '0.875rem',
    padding: '10px 12px',
    borderRadius: '0.375rem',
    backgroundColor: state.isFocused ? 'var(--select-option-focus)' : 'transparent',
    color: 'var(--select-text)',
    cursor: 'pointer',
  }),
  menuPortal: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
  }),
};

export const selectStylesSingle: StylesConfig<SelectOption, false> = {
  control: controlStyle,
  ...sharedStyles,
  singleValue: (base) => ({
    ...base,
    color: 'var(--select-text)',
    fontSize: '0.875rem',
  }),
};

export const selectStylesMulti: StylesConfig<SelectOption, true> = {
  control: controlStyle,
  ...sharedStyles,
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'var(--select-option-focus)',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--select-text)',
    fontSize: '0.8125rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--select-text-muted)',
    '&:hover': {
      backgroundColor: '#fecaca',
      color: '#b91c1c',
    },
  }),
};
