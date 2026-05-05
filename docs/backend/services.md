# Backend - Servicios y Flujos

## Capa Service (proposito)

La capa `services` centraliza reglas de negocio y evita que handlers contengan logica compleja.

Responsabilidades:

- Validar reglas de dominio.
- Orquestar multiples repositorios.
- Aplicar politicas operativas (por ejemplo, estados y transiciones de asistencia).
- Devolver errores de negocio manejables por handlers.

## Servicios clave por dominio

- **Autenticacion**:
  - Login por diferentes identificadores.
  - Validacion de password hash.
  - Emision de JWT y carga de roles/permisos.
- **Personas**:
  - CRUD de personas.
  - Importaciones masivas.
  - Creacion/sincronizacion de usuario asociado cuando aplica.
- **Fichas e instructores**:
  - Gestion de asignaciones instructor-ficha.
  - Consulta de fichas por permisos y contexto de usuario.
- **Asistencias**:
  - Creacion de sesiones.
  - Registro de ingreso/salida.
  - Gestion de observaciones y pendientes.
  - Dashboard y casos para bienestar.
- **Permisos/usuarios**:
  - Asignacion/revocacion de permisos.
  - Ajuste de roles (acciones restringidas por nivel administrativo).

## Flujo principal: autenticacion

1. `AuthHandler` recibe credenciales.
2. `AuthService` busca usuario/persona en DB.
3. Se valida password (bcrypt).
4. Se consultan roles/permisos en Casbin.
5. Se genera token JWT y se responde perfil autorizado.

## Flujo principal: gestion de asistencia

1. Usuario autenticado invoca endpoint de asistencia.
2. Middleware valida token y permiso correspondiente.
3. Handler delega al servicio.
4. Servicio ejecuta reglas de sesion, instructor/ficha y estado del aprendiz.
5. Repository persiste resultado.

## Notas de mantenibilidad

- Evitar logica de negocio en handlers.
- Mantener servicios enfocados por modulo para reducir acoplamiento.
- Encapsular consultas complejas en repositories para simplificar tests y evolucion.
