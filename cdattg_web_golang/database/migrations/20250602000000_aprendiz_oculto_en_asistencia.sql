-- Ocultar aprendiz de la toma de asistencia diaria sin desasignar (historial e inasistencias siguen activos).
ALTER TABLE aprendices
  ADD COLUMN IF NOT EXISTS oculto_en_asistencia BOOLEAN NOT NULL DEFAULT false;
