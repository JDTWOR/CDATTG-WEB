# Módulo de roles y permisos — Backend Go + Casbin

Documento que describe el **comportamiento e implementación** del sistema de roles y permisos en el backend Go. **Fuente de verdad única: Casbin** (tabla `casbin_rule`). No se usan tablas Spatie (roles, permissions, model_has_roles, etc.).

---

## 1. Alcance del módulo

- Definir **roles** y **permisos** en código (`authz/perms.go`); se seedean solo en Casbin.
- Asignar y quitar **permisos directos** a usuarios (gestión por usuario; políticas `p2`).
- Asignar y quitar **roles** a usuarios (solo rol **SUPER ADMINISTRADOR** vía API).
- Restringir el acceso a rutas según permiso (middleware `RequirePermission(obj, act)`).
- Asignación automática de roles en otros flujos (instructor, visitante, aprendiz, etc.).
- Activar e inactivar usuarios (campo `status` en `users`) desde la API de permisos.

---

## 2. Modelo Casbin (única fuente de verdad)

- **g (role definition)**: `(userID, roleName)`. El usuario tiene ese rol.
- **p (policy)**: `(roleName, obj, act)`. El rol tiene permiso sobre el recurso `obj` con acción `act`.
- **p2 (policy directa)**: `(userID, obj, act)`. Permiso asignado directamente al usuario (sin pasar por rol).

**Matcher**: se permite acceso si  
- el usuario tiene un rol que tiene ese permiso (`p`), **o**  
- el usuario tiene el permiso directo (`p2`).

Los datos se persisten en la tabla **casbin_rule** (GORM adapter). Las tablas `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions` **no se usan** y se eliminan en migración (desarrollo).

---

## 3. Definición en código (`authz/perms.go`)

- **RoleNames**: lista de roles del sistema (BOT, SUPER ADMINISTRADOR, ADMINISTRADOR, COORDINADOR, INSTRUCTOR, VISITANTE, APRENDIZ, ASPIRANTE, PROVEEDOR, VIGILANTE).
- **Permisos por objeto**: `PermisosPersona`, `PermisosPrograma`, `PermisosFicha`, `PermisosAprendiz`, `PermisosInstructor`, `PermisosAsistencia`, `PermisosUsuario`, `PermisosInventario`.
- **Objetos**: `ObjPersona`, `ObjPrograma`, `ObjFicha`, `ObjInstructor`, `ObjUsuario`, etc.
- **AllPermissionPairs()**: todos los `(obj, act)` válidos (para API y validación).
- **IsValidPermiso(obj, act)**: comprueba si un permiso está definido.

Incluye **EDITAR INSTRUCTOR**, **ELIMINAR INSTRUCTOR** y **ASIGNAR PERMISOS** (objeto `usuario`).

---

## 4. Roles y permisos por defecto (seed)

| Rol                 | Permisos (en Casbin) |
|---------------------|----------------------|
| SUPER ADMINISTRADOR | `*`, `*` (todos)     |
| ADMINISTRADOR       | Persona, programa, ficha, aprendiz, instructor, asistencia, usuario (ASIGNAR PERMISOS), inventario completo |
| COORDINADOR         | Igual que ADMINISTRADOR (incl. inventario) |
| INSTRUCTOR         | Solo asistencia (VER ASISTENCIA, TOMAR ASISTENCIA) |
| APRENDIZ, VISITANTE, ASPIRANTE, PROVEEDOR | Solo VER PERSONA (perfil) |
| BOT, VIGILANTE      | Sin permisos por defecto |

---

## 5. API de gestión (permisos y roles)

Todas las rutas requieren **autenticación** (Bearer). No se puede operar sobre **el propio usuario** (autoprotección).

| Método | Ruta | Permiso / Rol | Descripción |
|--------|------|----------------|-------------|
| GET | `/api/usuarios` | ASIGNAR PERMISOS (usuario) | Listado de usuarios (offset, limit, search). Incluye roles desde Casbin. |
| GET | `/api/usuarios/:id/permisos` | ASIGNAR PERMISOS | Roles, permisos (agregados) y permisos directos (p2) del usuario. |
| POST | `/api/usuarios/:id/permisos` | ASIGNAR PERMISOS | Asignar permiso directo. Body: `{ "obj": "...", "act": "..." }`. |
| DELETE | `/api/usuarios/:id/permisos/:obj/:act` | ASIGNAR PERMISOS | Quitar permiso directo. |
| PATCH | `/api/usuarios/:id/estado` | ASIGNAR PERMISOS | Activar/inactivar usuario (toggle `status`). |
| PATCH | `/api/usuarios/:id/roles` | **SUPER ADMINISTRADOR** | Reemplazar roles del usuario. Body: `{ "roles": ["ROL1", "ROL2"] }`. |
| GET | `/api/permisos/definiciones` | ASIGNAR PERMISOS | Lista de roles y de permisos `(obj, act)` válidos para la UI. |

---

## 6. Protección de rutas (middleware)

- **RequirePermission(obj, act)**: comprueba en Casbin si el usuario tiene ese permiso (por rol o por p2).
- **RequireSuperAdmin()**: comprueba si el usuario tiene el rol SUPER ADMINISTRADOR.
- Rutas de negocio (personas, fichas, inventario, etc.) usan `RequirePermission` con el `obj` y `act` correspondientes (definidos en `authz/perms.go`).

---

## 7. Login y respuesta de usuario

- **Login** y **GetCurrentUser** (si se exponen roles/permisos): roles y permisos se obtienen **solo de Casbin** (`GetRolesForUser`, `GetAllPermissionsForUser`). No se leen tablas de roles/permisos en BD.
- El token y la respuesta reflejan los mismos datos que Casbin usa para autorizar.

---

## 8. Asignación automática de roles

- **Persona con usuario** (creación o EnsureUsersForPersonas): rol **VISITANTE**; si la persona es instructor, rol **INSTRUCTOR** (solo en Casbin).
- **Instructor** (CreateFromPersona): se asigna rol **INSTRUCTOR** en Casbin.
- **Sync instructor roles** (seeder/admin): asegura que todos los usuarios cuya persona es instructor tengan el rol INSTRUCTOR en Casbin.

---

## 9. Reglas de negocio

| Regla | Comportamiento |
|-------|----------------|
| Autoprotección | No se pueden modificar los propios permisos, roles ni estado. |
| Roles en API | Solo SUPER ADMINISTRADOR puede llamar a PATCH `/api/usuarios/:id/roles`. |
| Permisos en API | Solo quien tiene ASIGNAR PERMISOS (objeto usuario) puede listar usuarios, ver/asignar/quitar permisos y cambiar estado. |
| Origen de datos | Roles y permisos se definen en código; la aplicación no crea nuevos roles ni nuevos tipos de permiso desde la UI. |
| Sincronización | Al asignar roles (PATCH roles), se reemplazan todos los roles del usuario por el conjunto enviado. |

---

## 10. Referencias en el código

- **Modelo Casbin**: `authz/model.conf` (p, p2, g, matcher).
- **Definición de permisos**: `authz/perms.go`.
- **Enforcer y helpers**: `authz/enforcer.go` (AddRoleForUser, AddPermissionForRole, AddPermissionForUser, GetRolesForUser, GetAllPermissionsForUser, GetDirectPermissionsForUser, etc.).
- **Middleware**: `middleware/auth.go` (RequirePermission, RequireSuperAdmin).
- **Seed**: `database/seeders/role_permission_seeder.go` (solo Casbin).
- **API**: `handlers/permisos_handler.go`, `services/permisos_service.go`, rutas en `router/router.go` (grupos `/api/usuarios`, `/api/permisos`).
