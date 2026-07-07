export const CASOS_BIEN_DIAS_HISTORICO = 0;

export const CASOS_BIEN_DIAS_OPCIONES = [
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
  { value: CASOS_BIEN_DIAS_HISTORICO, label: 'Desde el inicio (histórico completo)' },
] as const;

export const CASOS_BIEN_DIAS_ID = 'casos-bienestar-dias';
export const CASOS_BIEN_MIN_FALLAS_ID = 'casos-bienestar-min-fallas';
export const CASOS_BIEN_LISTA_SEARCH_ID = 'casos-bienestar-lista-search';
export const CASOS_BIEN_LISTA_PROGRAMA_ID = 'casos-bienestar-lista-programa';
export const CASOS_BIEN_APRENDIZ_SEARCH_ID = 'casos-bienestar-aprendiz-search';
