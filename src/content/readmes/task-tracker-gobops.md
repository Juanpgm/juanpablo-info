# Task Tracker GobOps

Sistema de seguimiento de requerimientos para la Alcaldía de Santiago de Cali.

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/Juanpgm/task-tracker-gobops.git
cd task-tracker-gobops/frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. ⚠️ Configurar credenciales (IMPORTANTE - SEGURIDAD)

**NUNCA** subas archivos con credenciales reales al repositorio.

#### Configuración segura

```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local con tus credenciales REALES
nano .env.local
```

#### Credenciales requeridas

- **Firebase Config**: Obtén desde Firebase Console > Project Settings > General
- **Firebase Service Account**: Descarga JSON desde Firebase Console > Service Accounts
- **URLs de API**: Ya configuradas para producción

#### Archivos de configuración

- ✅ **`.env.local`** → Tus credenciales reales (ignoradas por git)
- ✅ **`.env.example`** → Template público con placeholders
- ❌ **`.env`** → **NUNCA** uses este archivo (sería commiteado por error)

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Build para producción

```bash
npm run build
```

## 📋 Características

- ✅ **Autenticación y Control de Accesos**
  - Login con Firebase Authentication
  - Sistema de roles múltiples por usuario
  - Permisos permanentes y temporales con expiración
  - Administración de usuarios y roles
  - Super admins y admins con diferentes niveles de acceso
- ✅ Seguimiento de requerimientos con Kanban
- ✅ Registro de visitas programadas
- ✅ Gestión de evidencias fotográficas
- ✅ PWA (Progressive Web App)
- ✅ Responsive design

## 🔐 Sistema de Autenticación

El sistema implementa una arquitectura completa de **Administración y Control de Accesos**:

### Características del Sistema de Auth

1. **Autenticación Firebase + Backend**
   - Firebase maneja la autenticación del usuario
   - El backend valida el token y retorna información de roles/permisos
   - Sistema de doble validación para máxima seguridad

2. **Control de Accesos Granular**
   - **Roles múltiples**: Un usuario puede tener varios roles (ej: `admin_general`, `coordinador`, `operativo`)
   - **Permisos permanentes**: Heredados de los roles asignados
   - **Permisos temporales**: Con fecha de expiración automática
   - **Jerarquía de admins**: Super Admin > Admin > Usuario

3. **Endpoints Disponibles**
   - `/auth/login` - Login con Firebase token
   - `/auth/validate-session` - Validación de sesión activa
   - `/auth/register` - Registro de nuevos usuarios
   - `/auth/google` - Autenticación con Google
   - `/auth/admin/users` - Administración de usuarios
   - `/auth/admin/roles` - Administración de roles
   - Ver [API_ENDPOINTS.md](./API_ENDPOINTS.md) para la lista completa

4. **Manejo de Errores Mejorado**
   - Mensajes de error específicos para cada tipo de fallo
   - Validación de formato de email y contraseña
   - Manejo de límite de intentos
   - Detección de cuentas deshabilitadas

## 🏗️ Arquitectura

- **Frontend**: Svelte 4 + TypeScript + Vite
- **Backend APIs**:
  - Auth API: `https://web-production-79739.up.railway.app`
  - Project API: `https://gestorproyectoapi-production.up.railway.app`
- **Base de datos**: Firebase + APIs externas
- **PWA**: Service Worker con Workbox

## 📡 APIs

Ver [API_ENDPOINTS.md](./API_ENDPOINTS.md) para documentación completa de endpoints.

### APIs disponibles

- **Auth API** (Control de Accesos):
  - Base: `https://web-production-79739.up.railway.app`
  - Incluye: Autenticación, administración de usuarios y roles, permisos
- **Project API** (Catálogo de Proyectos):
  - Base: `https://gestorproyectoapi-production.up.railway.app`
  - Incluye: Unidades de proyecto, datos de seguimiento

## 🚀 Despliegue en Vercel

Ver [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para instrucciones completas de despliegue y configuración de variables de entorno.

### Configuración rápida

```bash
# Instalar Vercel CLI
npm install -g vercel

# Configurar secretos de Firebase
vercel secrets add firebase_api_key "TU_API_KEY"
vercel secrets add firebase_auth_domain "tu-proyecto.firebaseapp.com"
vercel secrets add firebase_project_id "tu-proyecto-id"
# ... (ver DEPLOY_VERCEL.md para lista completa)

# Desplegar
vercel --prod
```

## 🔒 Seguridad

- Credenciales sensibles excluidas del repositorio
- Variables de entorno validadas con TypeScript
- Autenticación JWT con Firebase
- HTTPS obligatorio en producción
