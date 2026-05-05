# Base de Datos - Esquema

## Tablas clave por categoria

## Nucleo del dominio

- `users`
  - Proposito: autenticacion y estado de cuenta.
  - Campos clave: `id`, `persona_id`, `password`, `estado`.
- `personas`
  - Proposito: perfil base de personas del sistema.
  - Campos clave: `id`, identificacion, nombres, apellidos, referencias de catalogo/ubicacion.
- `programas_formacion`
  - Proposito: programas academicos.
  - Campos clave: `id`, codigo, nombre, modalidad/nivel/tipo.
- `fichas_caracterizacion`
  - Proposito: agrupacion academica por ficha.
  - Campos clave: `id`, `numero_ficha`, `programa_formacion_id`, `sede_id`.
- `instructores`
  - Proposito: extension de `personas` para rol docente.
  - Campos clave: `id`, `persona_id`.
- `aprendices`
  - Proposito: extension de `personas` para rol aprendiz.
  - Campos clave: `id`, `persona_id`, estado academico.

## Transaccionales

- `asistencias`
  - Proposito: sesiones de asistencia por ficha/instructor.
  - Campos clave: `id`, referencias de ficha/instructor, fecha/hora, estado.
- `asistencia_aprendices`
  - Proposito: detalle por aprendiz en cada sesion.
  - Campos clave: `id`, `asistencia_id`, `aprendiz_id`, estado, observaciones.
- `entrada_salida`
  - Proposito: registro operativo de entradas/salidas.
  - Campos clave: `id`, timestamp, usuario/actor.
- `persona_ingreso_salida`
  - Proposito: trazabilidad de ingreso/salida por persona.
  - Campos clave: `id`, `persona_id`, tipo_movimiento, fecha_hora.

## Logs y auditoria

- `logins`
  - Proposito: trazabilidad de accesos/autenticaciones.
- `registro_actividades`
  - Proposito: auditoria de acciones operativas.
- `asignacion_instructor_logs`, `alerta_asistencia_log`, `persona_import_logs`, `instructor_import_logs`
  - Proposito: historial de procesos y eventos relevantes.

## Configuracion y catalogos

- `tipos_documento`, `generos`, `jornadas`, `modalidades`, `tipos_observacion_asistencia`, `persona_caracterizaciones`, entre otras.
- Proposito: normalizar valores de referencia y reducir hardcode en logica de negocio.

## Suposiciones y limites

- Los nombres exactos de columnas dependen de tags/modelos GORM por entidad.
- Este documento prioriza tablas y campos clave para comprension operacional.
- Para contratos SQL estrictos (DDL), validar contra base de datos en entorno objetivo.
