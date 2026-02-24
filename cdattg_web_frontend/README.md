# CDATTG Web - Frontend

Frontend moderno para el sistema CDATTG Web desarrollado con React, TypeScript, Vite y Tailwind CSS.

## 🚀 Tecnologías

- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS utility-first
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env
```

## 🔧 Configuración

Edita el archivo `.env` para configurar la URL del backend:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 🏃 Ejecución

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   └── PersonaModal.tsx
├── context/         # Context API
│   └── AuthContext.tsx
├── pages/           # Páginas principales
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Personas.tsx
├── services/        # Servicios API
│   └── api.ts
├── types/           # Tipos TypeScript
│   └── index.ts
├── config/          # Configuración
│   └── api.ts
├── App.tsx          # Componente principal
└── main.tsx         # Punto de entrada
```

## 🎨 Características

- ✅ Autenticación con JWT
- ✅ Rutas protegidas
- ✅ Diseño responsive con Tailwind CSS
- ✅ Gestión de Personas (CRUD completo)
- ✅ Paginación
- ✅ Manejo de errores
- ✅ Interfaz limpia y moderna

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. El token se almacena en `localStorage` y se incluye automáticamente en todas las peticiones al backend.

## 📝 Notas

- Asegúrate de que el backend esté corriendo en `http://localhost:8080`
- El backend debe tener CORS configurado para permitir peticiones desde el frontend
