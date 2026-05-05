# Base de Datos - Vision General

## Motor y acceso

- Motor principal: PostgreSQL.
- Acceso desde backend: GORM (`gorm.io/driver/postgres`).
- Inicializacion y migracion: `cdattg_web_golang/database/database.go`.

## Estrategia de esquema

- Se usa `AutoMigrate` para tablas principales.
- Existen migraciones SQL puntuales en `cdattg_web_golang/database/migrations`.
- Seeders en Go para datos base/catalogos en `cdattg_web_golang/database/seeders`.

## Clasificacion de tablas

- **Nucleo del dominio**:
  - personas, usuarios, ubicaciones, programas, fichas, instructores, aprendices.
- **Transaccionales**:
  - asistencias, asistencia_aprendices, entrada_salida, persona_ingreso_salida, asignaciones.
- **Logs y auditoria**:
  - login(s), registro_actividades, alerta_asistencia_log, import_logs.
- **Configuracion y catalogos**:
  - tipos_documento, genero, jornada, modalidad, tipos_observacion_asistencia, entre otros.

## Estado especial del modulo inventario

- Hay modelos de inventario en codigo.
- En el estado actual, esas tablas no se migran desde `Migrate()`.
- Documentar inventario como modulo potencial, no como parte activa del esquema desplegado.
