import type { DiaFormacionItem, FichaCaracterizacionResponse } from '../types';
import { diasIdsFromListItem } from './fichaCaracterizacionForm';
import { horariosFromFicha } from './fichaCaracterizacionHorarios';

const DIA_ABBR: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIÉRCOLES: 'Mié',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SÁBADO: 'Sáb',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

export function toDisplayTitle(text: string | undefined | null): string {
  if (!text?.trim()) return '—';
  return text
    .trim()
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, sep: string, c: string) => `${sep}${c.toUpperCase()}`);
}

function abbrDia(nombre: string): string {
  const key = nombre.trim().toUpperCase();
  return DIA_ABBR[key] ?? nombre.trim().slice(0, 3);
}

function formatRangoDias(abbrs: string[], indices: number[]): string {
  if (abbrs.length === 0) return '';
  if (abbrs.length === 1) return abbrs[0];
  let consecutive = true;
  for (let i = 1; i < indices.length; i += 1) {
    if (indices[i] !== indices[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive && abbrs.length >= 2) {
    return `${abbrs[0]}–${abbrs.at(-1) ?? abbrs[0]}`;
  }
  return abbrs.join(', ');
}

export type HorarioResumenFicha = Readonly<{
  jornada: string | null;
  resumen: string;
  detalle: string;
}>;

export function buildHorarioResumenFicha(
  item: FichaCaracterizacionResponse,
  diasCatalog: DiaFormacionItem[],
): HorarioResumenFicha {
  const horarios = horariosFromFicha(item);
  const jornada = item.jornada_nombre ? toDisplayTitle(item.jornada_nombre) : null;

  if (!horarios.length) {
    const ids = diasIdsFromListItem(item);
    const nombres =
      item.dias_formacion_nombres?.filter((n) => n?.trim()) ??
      ids.map((id) => diasCatalog.find((d) => d.id === id)?.nombre ?? '').filter(Boolean);
    const detalle = nombres.length ? nombres.map((n) => toDisplayTitle(n)).join(', ') : '—';
    return { jornada, resumen: detalle, detalle };
  }

  const entries = horarios
    .map((h) => {
      const nombre = h.dia_nombre ?? diasCatalog.find((d) => d.id === h.dia_formacion_id)?.nombre ?? '';
      const inicio = h.hora_inicio?.slice(0, 5) ?? '';
      const fin = h.hora_fin?.slice(0, 5) ?? '';
      const idx = diasCatalog.findIndex((d) => d.id === h.dia_formacion_id);
      return {
        nombre,
        abbr: abbrDia(nombre),
        inicio,
        fin,
        idx: idx >= 0 ? idx : h.dia_formacion_id,
      };
    })
    .sort((a, b) => a.idx - b.idx);

  const detalle = entries
    .map((e) => {
      if (e.inicio && e.fin) return `${toDisplayTitle(e.nombre)} ${e.inicio}–${e.fin}`;
      return toDisplayTitle(e.nombre);
    })
    .join(' · ');

  const groups = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = `${e.inicio}|${e.fin}`;
    const group = groups.get(key) ?? [];
    group.push(e);
    groups.set(key, group);
  }

  if (groups.size === 1) {
    const group = [...groups.values()][0];
    const { inicio, fin } = group[0];
    const rangoDias = formatRangoDias(
      group.map((x) => x.abbr),
      group.map((x) => x.idx),
    );
    const resumen = inicio && fin ? `${rangoDias} · ${inicio}–${fin}` : rangoDias;
    return { jornada, resumen, detalle };
  }

  const resumen =
    entries.length <= 3
      ? entries.map((e) => (e.inicio && e.fin ? `${e.abbr} ${e.inicio}–${e.fin}` : e.abbr)).join(' · ')
      : `${entries.length} bloques horarios`;

  return { jornada, resumen, detalle };
}

export function formatUbicacionFicha(item: FichaCaracterizacionResponse): string {
  const sede = item.sede_nombre?.trim();
  const ambiente = item.ambiente_nombre?.trim();
  if (sede && ambiente) return `${toDisplayTitle(sede)} · ${toDisplayTitle(ambiente)}`;
  if (sede) return toDisplayTitle(sede);
  if (ambiente) return toDisplayTitle(ambiente);
  return 'Por definir';
}
