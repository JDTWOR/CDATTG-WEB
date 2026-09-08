# Manual de funciones de los módulos — Sistema Institucional CDATTG

Este manual describe qué hace cada módulo del sistema, quién lo usará y qué permite según el rol.
Se escribió a partir del código real (menú lateral, rutas y API) de la rama `feature/panel`.

@author Cristian Deysdayr Jiménez

## 1. Qué es y quién lo terminará usando

Es el sistema institucional del centro de formación. Como es institucional, los usuarios finales son:

| Tipo de usuario | Para qué lo usa |
|---|---|
| **Instructores** | Tomar asistencia, ver su agenda, gestionar aulas LMS, casos de bienestar, fichas y validar carnets. |
| **Administración** | Coordinación y secretaría académica: personas, fichas, programas, permisos, jornadas, elecciones y contenido institucional. |
| **Bienestar / FPI** | Casos de bienestar, alertas de inasistencia y consulta complementaria en Sofía/Betowa. |
| **Vigilantes** | Registro de ingreso/salida de la sede, reporte de accesos y ambientes en uso. |
| **Aprendices** | Ver su carnet digital, inasistencias, elección de representante, mis aulas LMS y entregar actividades. |
| **Terceros (sin sesión)** | Portal público de investigación: semilleros, revista, boletines, podcast, convocatorias y actividades. |

## 2. Acceso

- **Login institucional** (`/login`): usuarios internos con usuario y contraseña; todo queda protegido por token JWT y permisos (Casbin).
- **Portal público** (sin login, raíz `/`): información de investigación abierta a cualquier persona.
- **Registro público** (`/registro`): formulario de aspirantes/reclutamiento.
- El menú lateral se muestra según el **rol** y los **permisos** asignados a cada usuario.

## 3. Resumen de módulos

| Módulo | Qué hace | Quién lo usa |
|---|---|---|
| Panel principal | Resumen con indicadores de la operación académica | Admin y coordinación |
| Mi perfil | Ver y editar datos propios; foto con aprobación | Todos los autenticados |
| Formación | Programas, fichas (regular, media técnica, complementaria) | Instructores, admin y coordinación |
| Personal | Instructores, personal operativo, administrativo, contratistas, aprendices y personas | Admin y coordinación |
| Asistencia | Tomar asistencia, historial, paneles analíticos, carga retroactiva | Instructores, bienestar, admin |
| FPI | Verificación de aspirantes e inscripciones en Sofía y Betowa | Coordinación, FPI |
| LMS | Aulas virtuales, actividades, entregas y calificación | Instructores, aprendices, admin |
| Bienestar | Casos y alertas consecutivas de inasistencia | Bienestar e instructores |
| Infraestructura | Catálogo de sedes, bloques, pisos y ambientes | Sólo súper administrador |
| Vigilancia | Portería/acceso, reporte y ambientes en uso | Vigilantes y administración |
| Investigación | Semilleros y contenido del portal institucional | Administradores de contenido |
| Administración | Jornadas, días sin formación, config. de asistencia, elecciones y permisos | Súper administrador, administrador, coordinador |

## 4. Detalle por módulo

### Inicio (accesos rápidos)
- **Panel principal**: resumen estadístico del centro (dashboard).
- **Mi perfil**: editar datos propios, foto y contraseña. La foto y cambios pasan a aprobación.
- **Mis inasistencias** (aprendiz): consulta de faltas propias.
- **Carnet digital** (aprendiz): genera su carnet con foto y QR.
- **Validar carnet** (instructor): valida el QR del carnet de un aprendiz.
- **Carnets regulares** (bibliotecario): carnets para biblioteca.
- **Elección de representante** (aprendiz): votar en elecciones abiertas.

### Formación
- **Programas** (`/programas`): catálogo de programas de formación con importación masiva.
- **Formación Regular / Media Técnica / Complementaria** (`/fichas*`): CRUD de fichas, detalle, instructores asignados, aprendices y agenda.
- Funciones: importar/exportar fichas en Excel, asignar/desasignar instructores y aprendices, trasladar instructor de día, ocultar aprendices de asistencia, ver código de ficha.

### Personal
- **Instructores**: CRUD e importación masiva desde plantilla.
- **Personal operativo y de apoyo**: CRUD e importación.
- **Personal administrativo**: CRUD e importación.
- **Contratistas de prestación de servicios**: CRUD e importación.
- **Aprendices**: CRUD y vinculación a fichas.
- **Personas**: base maestra de personas, foto, carnet e importación; cada rol se crea desde una persona existente.

### Asistencia
- **Tomar asistencia** (`/asistencia/fichas`): sesiones por ficha; registro individual, grupal, por QR o número de documento.
- **Historial**: consulta de sesiones y detalle por ficha.
- **Panel de asistencia no tomada** (admin/coord): sesiones sin registrar.
- **Panel analítico** (admin/coord): indicadores de cumplimiento por ficha y aprendiz.
- **Reporte de asistencia** (súper admin / bienestar): resumen general.
- **Carga retroactiva** (súper admin): registrar asistencia de fechas anteriores.
- **Tipos de observación** (súper admin): catálogo de motivos para justificar faltas.
- Mis inasistencias y alertas propias para el aprendiz (inicio).

### FPI (complementarios)
- **Complementarios (Betowa)**: verificar aspirantes a formación complementaria en Betowa.
- **Sofía · Fase 1 · Consultar registro**: consultar el registro de potenciales aspirantes (JOSSO).
- **Sofía · Fase 2 · Programas**: consultar inscripciones en lote con plantilla Excel y progreso por lotes.

### LMS (módulo donde se trabaja hoy)
- **Mis aulas** (`/lms/aulas`): lista de aulas a las que el usuario tiene acceso (instructor de la ficha, aprendiz de la ficha o administración).
- **Aula** (`/lms/aulas/:fichaId`): pestañas Tablón, Trabajos, Vencidas, Aprendices, Historial, Mis actividades y Publicar; el instructor líder publica y califica, el aprendiz entrega y consulta.
- **Actividad** (`/lms/aulas/:fichaId/actividades/:actividadId`): detalle, entregas y archivos; permite publicar, editar o eliminar la actividad, entregar y deshacer entrega.
- **Página de entrega**: vista de la entrega de un aprendiz con nota y archivos.
- **Auditoría** (`/lms/auditoria`): busca personas por documento, lista fichas de una persona y distingue los tipos de carpeta LMS (permiso de súper administrador).
- Permisos usados: `VER LMS`, `ENTRAR AULA`, `PUBLICAR ACTIVIDAD`. Backend: `/api/lms/*` (listar aulas, aula, calificaciones, actividades, entregas, calificar y descargar archivos).

### Bienestar
- **Casos bienestar**: inasistencias sospechosas por ficha con filtros (días, sede, forma).
- **Alertas consecutivas**: alertas automáticas por fallas consecutivas; detalle por ficha y aprendiz.

### Infraestructura
- **Sedes, Bloques, Pisos, Ambientes**: CRUD del catálogo físico del centro. Alimenta ambientes y sedes de fichas, asistencia y vigilancia. Sólo súper administrador.

### Vigilancia
- **Portería / Acceso** (`/vigilancia/porteria`): busca persona por documento, registra ingreso y salida con foto.
- **Reporte de accesos** (`/vigilancia/accesos`): historial, personas dentro de la sede y estadísticas.
- **Ambientes en uso**: vista de ambientes ocupados para control de vigilancia.
- Permisos: `REGISTRAR ACCESO SEDE` y `VER ACCESO SEDE`.

### Investigación (portal institucional)
- **Semilleros**: administrador crea, edita y publica semilleros de investigación (con integrantes e hijos).
- **Presentación institucional**: texto de presentación del portal.
- **Banners del portal**: carrusel de la portada.
- **Revista Rupícola, Boletines, Podcast, Convocatorias, Actividades**: contenido editorial publicado en el portal.
- Todo lo administrado aquí se publica para terceros (portal público). Permiso: `GESTIONAR SEMILLERO`.

### Administración
- **Carrusel de destacados**: resaltar cards en el portal.
- **Jornadas**: catálogo de jornadas (mañana/tarde/noche) con propagación a fichas.
- **Días sin formación**: fechas y reglas por sede/ficha en las que no se toma asistencia.
- **Config. asistencia**: umbrales y reglas del registro de asistencia.
- **Elecciones aprendices**: crear, publicar, votar y ver resultados de elección de representante.
- **Permisos y roles**: asignar permisos por usuario, quitar y gestionar roles. El manejo de roles queda restringido a súper administrador.

## 5. Matriz de uso final

| Rol | Módulos que usa principalmente |
|---|---|
| Súper administrador | Todo |
| Administrador | Formación, Personal, Asistencia, LMS, Administración, Investigación, Vigilancia |
| Coordinador | Formación, Personal, Asistencia, LMS, FPI, Administración, Vigilancia |
| Instructor | Formación, Asistencia, LMS, Bienestar, Validar carnet |
| Bienestar al aprendiz | Asistencia, Bienestar |
| FPI | FPI (Sofía/Betowa) |
| Vigilante | Vigilancia (portería, reporte, ambientes) |
| Bibliotecario | Carnets regulares |
| Aprendiz | Mi perfil, carnet, inasistencias, elección, LMS (entregar) |
| Tercero (sin login) | Portal público: investigación, semilleros, revista, boletines, podcast, convocatorias, actividades |