# Colección de Postman - CDATTG Web Golang

Esta carpeta contiene la colección de Postman para probar la API REST del proyecto CDATTG Web desarrollado en Go con Gin.

## 📦 Archivos

- `CDATTG_Web_Golang.postman_collection.json` - Colección principal con todos los endpoints
- `CDATTG_Web_Golang.postman_environment.json` - Variables de entorno para desarrollo

## 🚀 Instalación

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Selecciona los archivos:
   - `CDATTG_Web_Golang.postman_collection.json`
   - `CDATTG_Web_Golang.postman_environment.json`
4. Click en **Import**

## ⚙️ Configuración

### Variables de Entorno

La colección usa las siguientes variables:

- `base_url`: URL base de la API (por defecto: `http://localhost:8080/api`)
- `auth_token`: Token JWT obtenido después del login (se establece automáticamente)
- `user_id`: ID del usuario autenticado (se establece automáticamente)

### Configurar Entorno

1. En Postman, selecciona el entorno **CDATTG Web - Desarrollo**
2. Verifica que `base_url` esté configurado correctamente
3. El `auth_token` se establecerá automáticamente después de hacer login

## 📋 Endpoints Incluidos

Todas las rutas están bajo el prefijo `/api`. Los endpoints protegidos requieren header `Authorization: Bearer {{auth_token}}`.

### 🔐 Autenticación
- **POST** `/auth/login` - Iniciar sesión (establece automáticamente el token)
- **GET** `/auth/me` - Obtener usuario actual

### 👥 Personas
- **GET** `/personas` - Listar personas (paginado: `page`, `page_size`)
- **GET** `/personas/:id` - Obtener persona por ID
- **POST** `/personas` - Crear persona
- **PUT** `/personas/:id` - Actualizar persona
- **POST** `/personas/:id/reset-password` - Restablecer contraseña al número de documento
- **DELETE** `/personas/:id` - Eliminar persona

### 📚 Programas de Formación
- **GET** `/programas-formacion` - Listar programas (paginado)
- **GET** `/programas-formacion/:id` - Obtener programa por ID
- **POST** `/programas-formacion` - Crear programa
- **PUT** `/programas-formacion/:id` - Actualizar programa
- **DELETE** `/programas-formacion/:id` - Eliminar programa

### 📂 Catálogos (Fichas)
Requerido permiso **VER FICHAS**.
- **GET** `/catalogos/sedes` - Listar sedes
- **GET** `/catalogos/ambientes` - Listar ambientes
- **GET** `/catalogos/modalidades-formacion` - Listar modalidades de formación
- **GET** `/catalogos/jornadas` - Listar jornadas
- **GET** `/catalogos/dias-formacion` - Listar días de formación

### 📂 Catálogos (Personas)
Requerido permiso **VER PERSONAS**.
- **GET** `/catalogos/paises` - Listar países
- **GET** `/catalogos/departamentos` - Listar departamentos
- **GET** `/catalogos/municipios` - Listar municipios
- **GET** `/catalogos/tipos-documento` - Listar tipos de documento
- **GET** `/catalogos/generos` - Listar géneros
- **GET** `/catalogos/persona-caracterizacion` - Listar caracterización de persona
- **GET** `/catalogos/regionales` - Listar regionales

### 📋 Fichas de Caracterización
- **GET** `/fichas-caracterizacion` - Listar fichas (paginado)
- **GET** `/fichas-caracterizacion/:id` - Obtener ficha por ID
- **GET** `/fichas-caracterizacion/:id/detalle` - Obtener ficha con detalle (instructores, aprendices)
- **POST** `/fichas-caracterizacion` - Crear ficha
- **PUT** `/fichas-caracterizacion/:id` - Actualizar ficha
- **DELETE** `/fichas-caracterizacion/:id` - Eliminar ficha
- **GET** `/fichas-caracterizacion/:id/instructores` - Listar instructores de la ficha
- **POST** `/fichas-caracterizacion/:id/instructores` - Asignar instructores
- **DELETE** `/fichas-caracterizacion/:id/instructores/:instructorId` - Desasignar instructor
- **GET** `/fichas-caracterizacion/:id/aprendices` - Listar aprendices de la ficha
- **POST** `/fichas-caracterizacion/:id/aprendices` - Asignar aprendices (body: `{"personas": [1,2,3]}`)
- **POST** `/fichas-caracterizacion/:id/aprendices/desasignar` - Desasignar aprendices (body: `{"personas": [1,2]}`)

### 👨‍🏫 Instructores
- **GET** `/instructores` - Listar instructores (id, nombre)
- **POST** `/instructores` - Crear instructor desde persona (body: `persona_id`, `regional_id`)

### ✅ Asistencias
- **POST** `/asistencias` - Crear sesión de asistencia (body: `instructor_ficha_id`, `fecha`, `hora_inicio`)
- **GET** `/asistencias/instructor-ficha/:instructorFichaId` - Listar sesiones por instructor-ficha
- **GET** `/asistencias/ficha/:fichaId` - Listar sesiones por ficha (query: `fecha_inicio`, `fecha_fin`)
- **POST** `/asistencias/ingreso` - Registrar ingreso de aprendiz (body: `asistencia_id`, `aprendiz_id`)
- **PUT** `/asistencias/aprendiz/:asistenciaAprendizId/salida` - Registrar salida de aprendiz
- **GET** `/asistencias/:id/aprendices` - Listar aprendices en sesión
- **PUT** `/asistencias/:id/finalizar` - Finalizar sesión
- **GET** `/asistencias/:id` - Obtener sesión por ID

### 🎓 Aprendices
- **GET** `/aprendices` - Listar aprendices (paginado)
- **GET** `/aprendices/:id` - Obtener aprendiz por ID
- **POST** `/aprendices` - Crear aprendiz (body: `persona_id`, `ficha_caracterizacion_id`, `estado`)
- **PUT** `/aprendices/:id` - Actualizar aprendiz
- **DELETE** `/aprendices/:id` - Eliminar aprendiz

## 🔑 Uso

### 1. Autenticación Automática

El endpoint de **Login** tiene un script de prueba que automáticamente guarda el token JWT en la variable `auth_token`. Después de hacer login exitoso, todos los demás endpoints usarán este token automáticamente.

### 2. Probar Endpoints

1. Primero ejecuta **Login** para obtener el token
2. Luego puedes probar cualquier otro endpoint
3. Los endpoints protegidos usarán automáticamente el token guardado

### 3. Permisos (Casbin)

Cada ruta protegida requiere permisos específicos (objeto + acción). Si recibes 403, verifica que el usuario tenga el rol o permiso correspondiente.

## 📝 Notas

- Todos los endpoints protegidos requieren autenticación Bearer Token
- El token se establece automáticamente después del login
- Ajusta las variables de entorno según tu configuración
- Los IDs en los ejemplos son valores de ejemplo, cámbialos según tus datos

## 🔧 Personalización

Puedes crear entornos adicionales para:
- **Producción**: `https://api.cdattg.sena.edu.co/api`
- **Staging**: `https://staging-api.cdattg.sena.edu.co/api`
- **Local**: `http://localhost:8080/api`

Solo duplica el archivo de entorno y modifica la variable `base_url`.
