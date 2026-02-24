# Modelos del Sistema CDATTG Web

Este directorio contiene todos los modelos/entidades del sistema.

## Estructura

### Modelos Base
- `base.go` - BaseModel y UserAuditModel (campos comunes)

### Autenticación y Autorización
- `user.go` - Usuarios del sistema
- `role.go` - Roles
- `permission.go` - Permisos

### Gestión de Personas
- `persona.go` - Personas (instructores, aprendices, visitantes)
- `pais.go` - Países
- `departamento.go` - Departamentos
- `municipio.go` - Municipios

### Infraestructura
- `sede.go` - Sedes del SENA
- `regional.go` - Regionales
- `bloque.go` - Bloques
- `piso.go` - Pisos
- `ambiente.go` - Ambientes de formación
- `centro_formacion.go` - Centros de formación

### Gestión Académica
- `instructor.go` - Instructores
- `aprendiz.go` - Aprendices
- `programa_formacion.go` - Programas de formación
- `red_conocimiento.go` - Redes de conocimiento
- `ficha_caracterizacion.go` - Fichas de caracterización
- `tipo_programa.go` - Tipos de programa
- `nivel_formacion.go` - Niveles de formación
- `modalidad_formacion.go` - Modalidades de formación
- `programa.go` - Programas

### Asistencias
- `asistencia.go` - Sesiones de asistencia
- `asistencia_aprendiz.go` - Asistencias de aprendices
- `evidencia.go` - Evidencias de formación

### Competencias y Resultados
- `competencia.go` - Competencias
- `resultados_aprendizaje.go` - Resultados de aprendizaje
- `competencia_programa.go` - Relación competencia-programa
- `resultados_competencia.go` - Relación resultados-competencia

### Guías de Aprendizaje
- `guias_aprendizaje.go` - Guías de aprendizaje
- `guia_aprendizaje_rap.go` - Relación guía-resultado
- `evidencia_guia_aprendizaje.go` - Relación evidencia-guía
- `guias_resultados.go` - Relación guías-resultados

### Días de Formación
- `dias_formacion.go` - Días de formación
- `ficha_dias_formacion.go` - Relación ficha-días
- `instructor_ficha_dias.go` - Días de instructor en ficha

### Asignaciones
- `asignacion_instructor.go` - Asignaciones de instructores
- `asignacion_instructor_log.go` - Logs de asignaciones
- `instructor_ficha_caracterizacion.go` - Relación instructor-ficha

### Entrada/Salida
- `entrada_salida.go` - Registro de entrada/salida
- `persona_ingreso_salida.go` - Ingreso/salida por sede
- `reporte_salida_automatica.go` - Reportes de salida automática

### Parámetros
- `parametro.go` - Parámetros del sistema
- `tema.go` - Temas
- `parametro_tema.go` - Relación parámetro-tema

### Auditoría y Logs
- `login.go` - Registros de login
- `registro_actividades.go` - Registro de actividades
- `persona_contact_alert.go` - Alertas de contacto
- `persona_import.go` - Importaciones masivas
- `persona_import_issue.go` - Problemas en importaciones

### Inventario (`models/inventario/`)
- `producto.go` - Productos
- `orden.go` - Órdenes de préstamo/salida
- `detalle_orden.go` - Detalles de órdenes
- `proveedor.go` - Proveedores
- `proveedor_contacto.go` - Contactos de proveedores
- `contrato_convenio.go` - Contratos y convenios
- `devolucion.go` - Devoluciones
- `aprobacion.go` - Aprobaciones
- `categoria.go` - Categorías
- `marca.go` - Marcas
- `notificacion.go` - Notificaciones

### Complementarios (`models/complementarios/`)
- `complementario_ofertado.go` - Programas complementarios ofertados
- `complementario_catalogo.go` - Catálogo de complementarios
- `aspirante_complementario.go` - Aspirantes a complementarios
- `categoria_caracterizacion_complementario.go` - Categorías de caracterización
- `persona_caracterizacion.go` - Relación persona-caracterización
- `sofia_validation_progress.go` - Progreso de validación SOFIA
- `senasofiaplus_validation_log.go` - Logs de validación SENASOFIAPLUS

## Total de Modelos

**Total: ~70 modelos** que generan aproximadamente **70+ tablas** en PostgreSQL (incluyendo tablas intermedias ManyToMany).

## Notas

- Todos los modelos usan GORM tags para mapeo a PostgreSQL
- Las relaciones ManyToMany generan tablas intermedias automáticamente
- Los modelos base (`BaseModel`, `UserAuditModel`) proporcionan campos comunes
- Los modelos están organizados por módulos funcionales
