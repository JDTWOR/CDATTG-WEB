import type { DiaFormacionItem, FichaDiaFormacionItem, JornadaItem } from '../types';

export function bloqueKey(b: Pick<FichaDiaFormacionItem, 'dia_formacion_id' | 'hora_inicio' | 'hora_fin'>): string {
  return `${b.dia_formacion_id}|${b.hora_inicio}|${b.hora_fin}`;
}

function parseMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function seSolapan(a: FichaDiaFormacionItem, b: FichaDiaFormacionItem): boolean {
  if (a.dia_formacion_id !== b.dia_formacion_id) return false;
  const ai = parseMinutos(a.hora_inicio);
  const af = parseMinutos(a.hora_fin);
  const bi = parseMinutos(b.hora_inicio);
  const bf = parseMinutos(b.hora_fin);
  return ai < bf && bi < af;
}

export function validarSinSolape(horarios: FichaDiaFormacionItem[]): string | null {
  for (let i = 0; i < horarios.length; i++) {
    for (let j = i + 1; j < horarios.length; j++) {
      if (seSolapan(horarios[i], horarios[j])) {
        return `Los horarios se solapan el mismo día (${horarios[i].hora_inicio}–${horarios[i].hora_fin} con ${horarios[j].hora_inicio}–${horarios[j].hora_fin}).`;
      }
    }
  }
  return null;
}

export function bloquesFromPlantilla(j: JornadaItem): FichaDiaFormacionItem[] {
  if (!j.bloques?.length) {
    if (j.hora_inicio && j.hora_fin) {
      return [];
    }
    return [];
  }
  return j.bloques.map((b) => ({
    dia_formacion_id: b.dia_formacion_id,
    dia_nombre: b.dia_nombre,
    hora_inicio: b.hora_inicio.slice(0, 5),
    hora_fin: b.hora_fin.slice(0, 5),
    orden: b.orden ?? 0,
    jornada_id: j.id,
    jornada_nombre: j.nombre,
  }));
}

export function fusionarPlantilla(
  horarios: FichaDiaFormacionItem[],
  plantilla: JornadaItem,
): FichaDiaFormacionItem[] {
  const nuevos = bloquesFromPlantilla(plantilla);
  const keys = new Set(horarios.map(bloqueKey));
  const merged = [...horarios];
  for (const n of nuevos) {
    const k = bloqueKey(n);
    if (!keys.has(k)) {
      merged.push(n);
      keys.add(k);
    }
  }
  return merged;
}

export function quitarPlantilla(horarios: FichaDiaFormacionItem[], jornadaId: number): FichaDiaFormacionItem[] {
  return horarios.filter((h) => h.jornada_id !== jornadaId);
}

export function plantillaActiva(horarios: FichaDiaFormacionItem[], plantilla: JornadaItem): boolean {
  const esperados = bloquesFromPlantilla(plantilla);
  if (esperados.length === 0) return false;
  const delTemplate = horarios.filter((h) => h.jornada_id === plantilla.id);
  if (delTemplate.length < esperados.length) return false;
  for (const e of esperados) {
    const found = delTemplate.some((h) => bloqueKey(h) === bloqueKey(e));
    if (!found) return false;
  }
  return true;
}

export function horariosFromFicha(
  item: { horarios?: FichaDiaFormacionItem[]; dias_formacion?: FichaDiaFormacionItem[] },
): FichaDiaFormacionItem[] {
  const src = item.horarios?.length ? item.horarios : item.dias_formacion ?? [];
  return src.map((h) => ({
    ...h,
    hora_inicio: h.hora_inicio?.slice(0, 5) ?? '',
    hora_fin: h.hora_fin?.slice(0, 5) ?? '',
  }));
}

export function enrichHorariosLabels(
  horarios: FichaDiaFormacionItem[],
  dias: DiaFormacionItem[],
  jornadas: JornadaItem[],
): FichaDiaFormacionItem[] {
  return horarios.map((h) => ({
    ...h,
    dia_nombre: h.dia_nombre ?? dias.find((d) => d.id === h.dia_formacion_id)?.nombre,
    jornada_nombre:
      h.jornada_nombre ?? (h.jornada_id ? jornadas.find((j) => j.id === h.jornada_id)?.nombre : undefined),
  }));
}

export function labelOrigen(h: FichaDiaFormacionItem): string {
  if (h.jornada_nombre) return h.jornada_nombre;
  if (h.jornada_id) return `Plantilla #${h.jornada_id}`;
  return 'Personalizado';
}
