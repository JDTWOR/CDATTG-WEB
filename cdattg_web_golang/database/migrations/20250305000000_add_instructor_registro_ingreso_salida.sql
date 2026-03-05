-- Migración: registrar quién tomó cada ingreso y cada salida en asistencia_aprendices.
-- Ejecutar en producción antes o junto al despliegue del código que usa estas columnas.
-- Las columnas son NULL para registros existentes (comportamiento esperado).

ALTER TABLE asistencia_aprendices
  ADD COLUMN instructor_ficha_id_registro_ingreso BIGINT UNSIGNED NULL,
  ADD COLUMN instructor_ficha_id_registro_salida BIGINT UNSIGNED NULL;
