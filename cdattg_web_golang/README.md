# CDATTG Web - Golang + Gin

Sistema de gestión de asistencias y programas complementarios para el SENA - API REST desarrollada en Go con Gin Framework.

## 📋 Descripción

Esta es la versión Go/Gin del sistema CDATTG Web, migrada desde Laravel. Proporciona una API REST completa para la gestión de:

- ✅ **Asistencias**: Control de asistencias de aprendices e instructores
- 📚 **Programas Complementarios**: Gestión de programas de formación complementaria
- 👥 **Gestión de Personas**: Administración de personas, instructores, aprendices
- 🏢 **Infraestructura**: Gestión de sedes, bloques, pisos y ambientes
- 📋 **Caracterización**: Fichas de caracterización y competencias
- 📦 **Inventario**: Sistema completo de inventario
- 🔐 **Roles y Permisos**: Sistema RBAC completo con JWT

## 🚀 Tecnologías Utilizadas

- **Go 1.21+**
- **Gin Framework** - Framework web HTTP
- **GORM** - ORM para Go
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Encriptación de contraseñas
- **godotenv** - Gestión de variables de entorno

## 📦 Estructura del Proyecto

```
cdattg_web_golang/
├── config/          # Configuración de la aplicación
├── database/        # Conexión a base de datos
├── models/          # Modelos/Entidades GORM (~70 modelos)
│   ├── inventario/  # Modelos de inventario
│   └── complementarios/ # Modelos de complementarios
├── repositories/    # Repositorios (acceso a datos)
├── services/        # Servicios de negocio
├── handlers/        # Handlers/Controladores HTTP
├── dto/             # Data Transfer Objects
├── middleware/      # Middleware (auth, CORS, etc.)
├── utils/           # Utilidades (JWT, password, etc.)
├── router/          # Configuración de rutas
├── main.go          # Punto de entrada
└── go.mod           # Dependencias
```

## 🔧 Configuración

### Requisitos Previos

- Go 1.21 o superior
- PostgreSQL 12+
- Git

### Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd cdattg_web_golang
```

2. Instalar dependencias:
```bash
go mod download
```

3. Configurar base de datos PostgreSQL:
```bash
# Crear base de datos
createdb -U jhon cdattg_web

# O usando psql
psql -U jhon -c "CREATE DATABASE cdattg_web;"
```

4. El archivo `.env` ya está configurado con:
   - Usuario: jhon
   - Contraseña: 1234
   - Base de datos: cdattg_web

## 🏃 Ejecución

```bash
# Ejecutar en modo desarrollo
go run main.go

# O usar Make
make run

# Compilar y ejecutar
make build
./cdattg-web-golang
```

La aplicación estará disponible en: `http://localhost:8080/api`

## 📊 Modelos y Tablas

El proyecto incluye **~70 modelos** que generan aproximadamente **70+ tablas** en PostgreSQL:

### Modelos Principales (20)
- User, Role, Permission
- Persona, Pais, Departamento, Municipio
- Sede, Regional, Bloque, Piso, Ambiente
- Instructor, Aprendiz
- ProgramaFormacion, RedConocimiento
- FichaCaracterizacion
- Asistencia, AsistenciaAprendiz, Evidencia

### Módulo de Parámetros (3)
- Parametro, Tema, ParametroTema

### Módulo de Competencias (5)
- Competencia, ResultadosAprendizaje
- CompetenciaPrograma, ResultadosCompetencia
- Tablas pivot

### Módulo de Guías (4)
- GuiasAprendizaje
- GuiaAprendizajeRap, EvidenciaGuiaAprendizaje, GuiasResultados

### Módulo de Días de Formación (3)
- DiasFormacion, FichaDiasFormacion, InstructorFichaDias

### Módulo de Asignaciones (3)
- AsignacionInstructor, AsignacionInstructorLog
- InstructorFichaCaracterizacion

### Módulo de Entrada/Salida (3)
- EntradaSalida, PersonaIngresoSalida, ReporteSalidaAutomatica

### Módulo de Inventario (11)
- Producto, Orden, DetalleOrden
- Proveedor, ProveedorContacto
- ContratoConvenio, Devolucion, Aprobacion
- Categoria, Marca, Notificacion

### Módulo de Complementarios (7)
- ComplementarioOfertado, ComplementarioCatalogo
- AspiranteComplementario
- CategoriaCaracterizacionComplementario, PersonaCaracterizacion
- SofiaValidationProgress, SenasofiaplusValidationLog

### Otras Entidades (10)
- CentroFormacion, TipoPrograma, NivelFormacion, ModalidadFormacion, Programa
- Login, RegistroActividades
- PersonaContactAlert, PersonaImport, PersonaImportIssue

### Tablas Intermedias (ManyToMany)
- model_has_roles, model_has_permissions, role_has_permissions
- competencia_programa, resultados_aprendizaje_competencia
- guia_aprendizaje_rap, evidencia_guia_aprendizaje
- complementarios_ofertados_dias_formacion
- competencia_complementario, resultado_aprendizaje_complementario
- guia_aprendizaje_complementario
- asignacion_instructor_resultado

**Total aproximado: 70+ tablas**

## 🔐 Autenticación

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "contraseña"
}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "full_name": "Juan Pérez",
    "status": true
  },
  "roles": ["INSTRUCTOR"],
  "permissions": ["VER FICHA", "TOMAR ASISTENCIA"]
}
```

### Uso del Token

Incluir el token en las peticiones:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere autenticación)

### Personas
- `GET /api/personas` - Listar personas (paginado)
- `GET /api/personas/:id` - Obtener persona por ID
- `POST /api/personas` - Crear persona
- `PUT /api/personas/:id` - Actualizar persona
- `DELETE /api/personas/:id` - Eliminar persona

## 🔒 Sistema de Roles y Permisos

El sistema implementa RBAC (Role-Based Access Control):

### Roles Principales
- `SUPER ADMINISTRADOR` - Acceso total
- `ADMINISTRADOR` - Administración general
- `COORDINADOR` - Coordinación de programas
- `INSTRUCTOR` - Gestión de fichas y asistencias
- `APRENDIZ` - Consulta de información propia
- `VISITANTE` - Acceso limitado

### Permisos
Los permisos se asignan a roles o directamente a usuarios.

## 📝 Notas de Migración

### Diferencias Clave Laravel vs Go/Gin

1. **Eloquent ORM → GORM**
   - Relaciones: `hasMany()` → `gorm:"foreignKey"`
   - Scopes: Métodos en repositorio

2. **Form Requests → Struct Tags**
   - Validación: `Request` classes → `binding:"required"`

3. **Policies → Middleware**
   - Autorización: `Policy` → `middleware.AuthMiddleware()`

4. **Service Layer**
   - Estructura similar, pero con interfaces Go

5. **Repositories**
   - Interfaces Go en lugar de clases PHP

## ⚠️ Funcionalidades No Implementadas

Las siguientes funcionalidades del proyecto Laravel original **NO están disponibles** o requieren implementación adicional:

1. **WebSockets en Tiempo Real** → Requiere `gorilla/websocket` o `nhooyr.io/websocket`
2. **Colas Asíncronas** → Requiere `asynq` o `machinery`
3. **Generación de PDFs** → Requiere `gofpdf` o `unidoc`
4. **Códigos QR** → Requiere `github.com/skip2/go-qrcode`
5. **Importación Excel** → Requiere `github.com/xuri/excelize`
6. **Google Drive API** → Requiere `google.golang.org/api/drive`
7. **Vistas Blade/Livewire** → Solo API REST (sin frontend)
8. **Eventos/Listeners** → Requiere implementación con channels
9. **Cache Redis** → Requiere `github.com/go-redis/redis`
10. **Soft Deletes Avanzados** → GORM tiene soporte básico

## 🧪 Testing

```bash
# Ejecutar todos los tests
go test ./...

# Ejecutar tests con cobertura
go test -cover ./...

# O usar Make
make test
make test-coverage
```

## 📄 Licencia

Este proyecto es propiedad del SENA.

## 👥 Contribuidores

- Equipo de desarrollo CDATTG

---

**Nota**: Este proyecto es una migración del sistema Laravel original. Algunas funcionalidades pueden requerir implementación adicional según se menciona en la sección "Funcionalidades No Implementadas".
