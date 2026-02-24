# Reglas de negocio y funcionalidades del sistema

Documento único que describe las reglas de negocio, datos requeridos por tipo de actor, funcionamiento del módulo de asistencia, programas de formación, asignación de instructores (líder y adicionales) y demás funcionalidades relevantes. Redactado en términos de negocio, sin referencias a tecnologías concretas.

---

## 1. Persona (datos base)

Cualquier actor del sistema (instructor, aprendiz, administrativo, visitante) se apoya en un registro de **persona**. Los datos que debe tener una persona son:

- **Identificación:** tipo de documento, número de documento, país de expedición si aplica.
- **Nombres y apellidos:** primer nombre, segundo nombre (opcional), primer apellido, segundo apellido (opcional). Se almacenan en mayúsculas.
- **Datos personales:** fecha de nacimiento, género.
- **Contacto:** teléfono fijo (opcional), celular, correo electrónico.
- **Ubicación:** país, departamento, municipio, dirección.
- **Formación:** nivel de escolaridad (parámetro).
- **Estado:** activo/inactivo, estado frente al sistema externo (SOFIA) si aplica.
- **Auditoría:** usuario que crea y usuario que edita el registro.

Una persona puede tener asociada una cuenta de usuario (para ingresar al sistema) y, según el caso, un perfil de instructor, de aprendiz o solo roles (administrativo, visitante, etc.). La persona es la base; instructor y aprendiz son extensiones que referencian a esa persona.

---

## 2. Instructor (datos y reglas)

Un **instructor** es una persona con un perfil laboral y pedagógico que puede ser asignada a fichas de caracterización. Además de los datos de la persona, el instructor requiere:

- **Vinculación organizativa:** regional, centro de formación, tipo de vinculación (parámetro).
- **Disponibilidad:** jornadas en las que puede dar clase (mañana, tarde, noche, etc.), modalidades de formación que atiende.
- **Especialidades:** una especialidad principal (por ejemplo, red de conocimiento) y opcionalmente varias secundarias. Se usan para validar que pueda ser asignado a una ficha según el programa.
- **Experiencia:** años de experiencia, experiencia como instructor en meses, experiencia laboral (texto), fecha de ingreso a la entidad.
- **Formación académica:** nivel académico, títulos, instituciones, certificaciones, cursos complementarios, formación pedagógica.
- **Competencias y habilidades:** áreas de experticia, competencias TIC, idiomas, habilidades pedagógicas (pueden ser listas o textos según parametrización).
- **Contrato y documentos:** número de contrato, fechas de inicio y fin, supervisor, EPS, ARL, documentos adjuntos.
- **Estado:** activo o inactivo. Solo los activos pueden recibir nuevas asignaciones.

**Reglas de negocio para instructores:**

- Un instructor no puede tener más de **cinco fichas activas** a la vez (límite según normativa).
- Debe tener al menos **un año de experiencia** para ser asignado (validación configurable).
- La **regional** del instructor debe coincidir con la de la ficha (a través de la sede de la ficha).
- Para ser asignado a una ficha, el instructor debe tener la **especialidad requerida** por el programa (red de conocimiento): principal o secundaria. El instructor **líder** de la ficha se excluye de esta validación (siempre puede ser el líder de su ficha).
- No puede haber **superposición de asignaciones** en la misma jornada y los mismos días de la semana: si la ficha nueva tiene fechas que se solapan con otra ficha del instructor y comparten jornada y al menos un día de formación, la asignación se considera en conflicto y no se permite.
- Las **horas máximas por semana** por instructor pueden estar definidas (por ejemplo 48); la validación de carga horaria puede estar activa o no según configuración.
- El instructor líder de una ficha debe quedar reflejado también en la tabla de asignación instructor–ficha, para que pueda tomar asistencia y operar sobre esa ficha. Si solo existe el instructor líder en la ficha pero no en la tabla pivote, debe sincronizarse.

---

## 3. Aprendiz (datos y reglas)

Un **aprendiz** es una persona inscrita en una **ficha de caracterización** (grupo/cohorte). Los datos propios del aprendiz son:

- **Relación con persona:** el aprendiz siempre referencia a una persona (con todos sus datos de identificación, contacto, etc.).
- **Ficha de caracterización:** la ficha en la que está matriculado (una ficha principal por registro de aprendiz).
- **Estado:** activo (1) o inactivo (0). Solo los activos se consideran en formación.
- **Auditoría:** usuario que crea y usuario que edita.

**Reglas de negocio para aprendices:**

- Un aprendiz pertenece a una ficha de caracterización; la relación se usa para listados, reportes y registro de asistencia.
- Los instructores solo pueden **ver y gestionar aprendices** que pertenezcan a alguna de sus fichas (como instructor líder o instructor adicional). Los administradores y coordinadores pueden ver todos según permisos.
- Las políticas de autorización deben comprobar que el aprendiz esté en al menos una ficha asignada al instructor que realiza la acción.

---

## 4. Programa de formación

Un **programa de formación** es la oferta formativa (técnica, tecnológica, etc.) bajo la cual se crean las fichas. Datos necesarios:

- **Código:** único en el sistema (obligatorio).
- **Nombre:** denominación del programa (se normaliza a mayúsculas).
- **Clasificación:** red de conocimiento, nivel de formación, tipo de programa.
- **Horas:** horas totales, horas etapa lectiva, horas etapa productiva (numéricos; la suma lectiva + productiva puede o no validarse contra el total según reglas del negocio).
- **Estado:** activo o inactivo. Solo los activos suelen listarse para crear nuevas fichas.
- **Auditoría:** usuario creación y edición.

**Funcionalidades:**

- Crear programas con código único y datos completos.
- Editar y desactivar programas.
- Listar y filtrar por red de conocimiento, nivel, tipo, estado.
- Los programas se asocian a fichas de caracterización; la red de conocimiento del programa se usa para exigir que los instructores asignados tengan la especialidad correspondiente.

---

## 5. Ficha de caracterización (creación y datos)

La **ficha de caracterización** representa un grupo/cohorte concreto de un programa en unas fechas, sede, ambiente y jornada determinados. Datos requeridos:

- **Identificación:** número de ficha (único en el sistema).
- **Programa:** programa de formación al que pertenece.
- **Instructor líder (obligatorio):** instructor principal responsable de la ficha. Debe existir y estar activo.
- **Fechas:** fecha de inicio y fecha de fin (inicio debe ser anterior a fin; pueden permitirse fechas desde cierto tiempo atrás según política).
- **Infraestructura y oferta:** ambiente (aula/laboratorio), sede, modalidad de formación, jornada (mañana, tarde, noche, etc.).
- **Carga:** total de horas de la ficha (numérico).
- **Días de formación:** qué días de la semana se dicta (lunes, martes, etc.); se guardan como relación ficha–día.
- **Estado:** activo/inactivo. Solo las fichas activas y con fecha fin vigente se consideran “activas” para límites de asignación de instructores.

**Reglas de negocio:**

- El número de ficha no puede repetirse.
- Debe haber un instructor líder asignado al crear la ficha.
- El instructor líder debe quedar registrado también en la tabla de asignación instructor–ficha (pivote), para que pueda tomar asistencia y aparecer en listados de “mis fichas”.
- La ficha hereda la regional a través de la sede; esa regional se usa para validar que los instructores asignados pertenezcan a la misma regional.

---

## 6. Asignación de instructor líder y demás instructores

- **Instructor líder:** se asigna en la ficha de caracterización (campo instructor_id). Es único por ficha y es el responsable principal. Debe existir un registro en la tabla pivote instructor–ficha para ese instructor y esa ficha (fecha inicio, fecha fin, total horas del instructor), creado al guardar la ficha o mediante sincronización.
- **Instructores adicionales:** se asignan mediante la misma tabla pivote (instructor–ficha). Cada registro tiene: instructor, ficha, fecha inicio, fecha fin, total de horas del instructor en esa ficha, estado. Varios instructores pueden estar en la misma ficha con sus propios rangos de fechas y horas.

**Reglas de asignación:**

- Antes de asignar (líder o adicional) se debe verificar la **disponibilidad** del instructor: estado activo, no superar el límite de fichas activas, no superposición de fechas/jornada/días, tener la especialidad requerida (salvo el líder), y cumplir experiencia mínima y regional cuando aplique.
- El instructor líder siempre se muestra en listas de instructores disponibles para esa ficha (para poder reasignar el líder). Los instructores que ya están asignados como adicionales no deben aparecer de nuevo en la lista de “adicionales” para evitar duplicados.
- Los filtros para elegir instructores suelen ser: misma **regional** que la ficha y **especialidad** (red de conocimiento del programa). El líder puede no tener la especialidad según criterio de negocio.
- Cualquier cambio de asignación (agregar o quitar instructores, cambiar líder) debe respetar las mismas reglas y puede registrarse en un log de asignaciones (quién, cuándo, qué ficha, qué instructor).

---

## 7. Módulo de asistencia

El módulo de asistencia permite registrar la presencia de los aprendices en sesiones de formación vinculadas a una ficha y, opcionalmente, a una evidencia (actividad/guía).

### 7.1 Conceptos

- **Sesión de asistencia (asistencia):** una “apertura” de toma de asistencia para una ficha en una fecha y horario. Tiene hora de inicio y puede tener hora de fin. Solo puede haber **una sesión activa (no finalizada)** por ficha a la vez. Al finalizarla, no se pueden agregar más entradas de aprendices a esa sesión.
- **Registro de asistencia por aprendiz:** cada marca de entrada (y opcionalmente salida) de un aprendiz en esa sesión. Se asocia a la sesión, a la ficha del instructor (contexto) y al aprendiz. Opcionalmente se puede vincular a una evidencia (actividad formativa).
- **Jornada:** la hora actual debe caer dentro del horario configurado de la jornada de la ficha (mañana, tarde, noche) para que ciertas operaciones (por ejemplo listar o registrar) sean válidas. Las jornadas tienen hora inicio, hora fin y tolerancias (entrada y salida).

### 7.2 Flujo de uso

1. **Iniciar sesión de asistencia:** un usuario con permiso (por ejemplo el instructor de la ficha) crea una sesión para una ficha en la fecha y hora actual. El sistema comprueba que no exista otra sesión activa para esa ficha; si existe, no se permite crear otra hasta finalizarla.
2. **Registrar entradas:** durante la sesión activa se registran las entradas de los aprendices (por lista, por QR, por dispositivo, etc.). Cada registro incluye al menos: sesión de asistencia, aprendiz (o vínculo aprendiz–ficha según modelo), hora de ingreso. Opcionalmente: hora de salida, observaciones, evidencia.
3. **Validaciones al registrar:**  
   - Debe haber una sesión activa para la ficha.  
   - La sesión no debe estar finalizada.  
   - Puede validarse que la hora de registro esté dentro del rango de la jornada.  
   - Para un mismo aprendiz en la misma sesión puede aplicarse la regla de no duplicar entrada (una sola entrada por aprendiz por sesión, o una por día según criterio).
4. **Finalizar sesión:** se marca la sesión como finalizada (hora fin, bandera de “finalizada”). A partir de ahí no se registran más entradas para esa sesión.
5. **Consultas y reportes:** se pueden listar asistencias por ficha, por fecha, por evidencia; calcular asistencias, retardos y faltas según jornada y tolerancias.

### 7.3 Jornadas y tolerancias

- Cada jornada tiene **horario de inicio y fin** (configuración por nombre de jornada).
- **Tolerancia de entrada:** minutos después del inicio de la jornada dentro de los cuales el ingreso se considera “a tiempo”. Pasada esa tolerancia se puede marcar como “tarde” o “muy tarde” según rangos de minutos.
- **Tolerancia de salida:** minutos antes del fin de la jornada; si el aprendiz registra salida antes de ese límite, puede considerarse “salida anticipada”.
- **Tiempo mínimo de clase:** se puede validar que entre hora de ingreso y hora de salida haya un mínimo de minutos (por ejemplo 45) para contar la asistencia como válida.

Las novedades (puntual, tarde, muy tarde, falta justificada, salida anticipada, etc.) se pueden derivar de estas validaciones y almacenar o mostrar en reportes.

### 7.4 Evidencias (opcional)

Una **evidencia** representa una actividad o entrega formativa. La sesión de asistencia o los registros de asistencia pueden asociarse a una evidencia para vincular la presencia a una actividad concreta (guía, taller, etc.). La regla de negocio es: la asistencia puede ser “genérica” (solo por ficha y fecha) o “por evidencia” (asociada a una evidencia). Según el diseño, la sesión puede tener una evidencia opcional o cada registro de asistencia de aprendiz.

---

## 8. Roles y permisos (resumen funcional)

- **Super Administrador:** acceso total a todas las funcionalidades.
- **Administrador:** gestión de parámetros, infraestructura, instructores, fichas, personas, inventario, redes de conocimiento, aprendices, programas, resultados de aprendizaje, competencias, complementarios, control y seguimiento, guías de aprendizaje, según permisos asignados.
- **Coordinador:** permisos amplios sobre programas, fichas, instructores y aprendices, según configuración.
- **Instructor:** puede ver y editar solo lo relacionado con **sus fichas** (como líder o adicional): fichas asignadas, aprendices de esas fichas, tomar asistencia, gestionar evidencias y guías de sus grupos. No puede ver aprendices ni fichas de otros instructores.
- **Aprendiz:** acceso a su perfil, sus fichas, sus asistencias y contenidos permitidos (guias, evidencias, etc.).
- **Aspirante, Visitante, Vigilante, Proveedor:** permisos limitados según su rol (por ejemplo visitante solo consultas básicas o ingreso/salida).
- **Bot:** rol para procesos automatizados.

Cada acción (crear ficha, editar aprendiz, tomar asistencia, etc.) debe comprobar el permiso correspondiente y, en el caso del instructor, que el recurso (ficha, aprendiz) pertenezca a una de sus asignaciones.

---

## 9. Otras funcionalidades mencionadas

- **Ingreso/salida de personas al centro:** registro de entrada y salida de personas (instructor, aprendiz, administrativo, visitante, aspirante) por sede y opcionalmente ambiente o ficha. Se determina el “tipo” de persona según si tiene perfil instructor, aprendiz o solo usuario con roles.
- **Sincronización instructor líder en pivote:** proceso (manual o por tarea programada) que recorre las fichas que tienen instructor líder definido y asegura que exista el registro correspondiente en la tabla instructor–ficha para ese instructor y esa ficha, con fechas y horas de la ficha, de modo que “Tomar asistencia” y listados de “mis fichas” incluyan correctamente al líder.
- **Log de asignaciones de instructores:** registro de quién asignó o desasignó qué instructor a qué ficha y cuándo, para trazabilidad y auditoría.

---

## 10. Resumen de funcionalidades por módulo

| Módulo / Área           | Funcionalidades principales                                                                 |
|-------------------------|---------------------------------------------------------------------------------------------|
| Personas                | Alta, edición, consulta; vinculación con usuario e identificación de tipo (instructor/aprendiz/otros). |
| Instructores            | Alta, edición, consulta; validación de disponibilidad y reglas SENA; asignación a fichas.  |
| Aprendices              | Alta, edición, consulta; restricción por ficha para instructores.                        |
| Programas de formación  | Crear, editar, listar, activar/desactivar; código único.                                   |
| Fichas de caracterización | Crear, editar, listar; instructor líder obligatorio; días y jornada; sincronizar líder en pivote. |
| Asignación instructores | Asignar instructor líder y adicionales; validar disponibilidad, especialidad, conflictos; log. |
| Asistencia              | Iniciar/finalizar sesión por ficha; registrar entrada (y salida) por aprendiz; validar jornada y tolerancias; reportes. |
| Evidencias              | Vincular asistencia a evidencia (actividad); consultas y reportes por evidencia.           |
| Seguridad               | Roles y permisos; políticas por recurso (ficha, aprendiz, guía, etc.).                      |

Este documento refleja las reglas de negocio y funcionalidades que debe cumplir el sistema desde el punto de vista del dominio, con independencia de la implementación técnica.
