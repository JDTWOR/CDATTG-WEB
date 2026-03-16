-- Seed de tipos de observación para asistencia (opcional si no se ejecuta el seeder Go).
-- Las tablas tipos_observacion_asistencia y asistencia_aprendiz_tipo_observacion las crea GORM AutoMigrate.
-- PostgreSQL: ejecutar después del despliegue para poblar el catálogo.

INSERT INTO tipos_observacion_asistencia (codigo, nombre, activo, created_at, updated_at)
VALUES
  ('NO_UNIFORME', 'No trajo uniforme', true, NOW(), NOW()),
  ('INASISTENCIA_JUSTIFICADA', 'Inasistencia justificada', true, NOW(), NOW()),
  ('ABANDONO_FORMACION', 'Abandono de formación', true, NOW(), NOW()),
  ('RETARDO', 'Retardo', true, NOW(), NOW()),
  ('OTRO', 'Otro', true, NOW(), NOW())
ON CONFLICT (codigo) DO NOTHING;
