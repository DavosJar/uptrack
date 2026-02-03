# Documentación de Integración: Aplicación Móvil con API REST

**Proyecto:** UpTrack - Sistema de Monitoreo de Aplicaciones  
**Fecha:** 31 de Enero de 2026  
**Unidad:** 3 - Integración Cliente Móvil con Backend  
**Stack Tecnológico:**  
- **Frontend Móvil:** React Native + Expo  
- **Backend:** Go (Golang) + Fiber Framework  
- **Base de Datos:** PostgreSQL  
- **Autenticación:** JWT (JSON Web Tokens)

---

## Tabla de Contenidos

1. [Revisión de Arquitectura](#1-revisión-de-arquitectura)
2. [Configuración de Conexión](#2-configuración-de-conexión)
3. [Catálogo de Endpoints Consumidos](#3-catálogo-de-endpoints-consumidos)
4. [Implementación del Cliente HTTP](#4-implementación-del-cliente-http)
5. [Funcionalidades Implementadas](#5-funcionalidades-implementadas)
6. [Manejo de Errores](#6-manejo-de-errores)
7. [Pruebas de Integración](#7-pruebas-de-integración)
8. [Evidencias Visuales](#8-evidencias-visuales)
9. [Control de Versiones](#9-control-de-versiones)
10. [Preguntas de Control](#10-preguntas-de-control)

---

## 1. Revisión de Arquitectura

### 1.1 Diagrama de Comunicación

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE MÓVIL                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │   Screens   │───>│  API Layer  │───>│  Context (AuthProvider) │  │
│  │  (UI/UX)    │    │  fetch.ts   │    │  Estado Global          │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────────┘  │
└────────────────────────────│────────────────────────────────────────┘
                             │ HTTPS (Ngrok Tunnel)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Go/Fiber)                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │  Handlers   │───>│  Services   │───>│  Repositories           │  │
│  │  (API REST) │    │  (Lógica)   │    │  (PostgreSQL)           │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Autenticación JWT

```
┌──────────┐          ┌──────────┐          ┌──────────┐
│  MÓVIL   │          │  BACKEND │          │    DB    │
└────┬─────┘          └────┬─────┘          └────┬─────┘
     │  POST /login        │                     │
     │  {email, password}  │                     │
     │────────────────────>│                     │
     │                     │  Validar usuario    │
     │                     │────────────────────>│
     │                     │<────────────────────│
     │                     │  Generar JWT        │
     │  {token: "eyJ..."}  │                     │
     │<────────────────────│                     │
     │                     │                     │
     │  GET /targets       │                     │
     │  Authorization:     │                     │
     │  Bearer eyJ...      │                     │
     │────────────────────>│                     │
     │                     │  Verificar JWT      │
     │                     │  Extraer user_id    │
     │                     │────────────────────>│
     │  {data: [...]}      │<────────────────────│
     │<────────────────────│                     │
```

### 1.3 Estructura del Proyecto Móvil

```
up-track-mobile/
├── src/
│   ├── api/
│   │   ├── config.ts      # URL base del backend
│   │   └── fetch.ts       # Cliente HTTP + interceptores
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Autenticación
│   │   ├── DashboardScreen.tsx    # Listado de targets
│   │   ├── AddTargetScreen.tsx    # Crear nuevo target
│   │   └── TargetDetailsScreen.tsx # Detalle y métricas
│   └── components/
│       └── Layout.tsx     # Componente base
```

---

## 2. Configuración de Conexión

### 2.1 Variable de Entorno Base

**Archivo:** `src/api/config.ts`

```typescript
export const API_BASE_URL = "https://<subdomain>.ngrok-free.dev";
```

### 2.2 Consideraciones de Red

| Entorno | URL | Notas |
|---------|-----|-------|
| Emulador Android | `http://10.0.2.2:8080` | IP especial del emulador |
| Emulador iOS | `http://localhost:8080` | Acceso directo |
| Dispositivo físico | `http://<IP_LOCAL>:8080` | Requiere misma red WiFi |
| **Producción/Túnel** | `https://*.ngrok-free.dev` | **Usado en este proyecto** |

> **Nota:** Ngrok permite exponer el servidor local a internet con HTTPS, facilitando pruebas en dispositivos físicos sin configurar certificados.

---

## 3. Catálogo de Endpoints Consumidos

### 3.1 Autenticación (Públicos)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `POST` | `/api/v1/login` | Iniciar sesión | `{email, password}` |
| `POST` | `/api/v1/register` | Crear cuenta | `{email, password}` |

### 3.2 Monitoreo (Protegidos con JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/targets` | Listar todos los sistemas monitoreados |
| `POST` | `/api/v1/targets` | Crear nuevo target de monitoreo |
| `GET` | `/api/v1/targets/{id}` | Obtener detalle de un target |
| `GET` | `/api/v1/targets/{id}/metrics` | Obtener métricas de respuesta |
| `GET` | `/api/v1/targets/{id}/history` | Historial de cambios de estado |
| `GET` | `/api/v1/targets/{id}/statistics` | Estadísticas agregadas |
| `POST` | `/api/v1/targets/{id}/toggle` | Activar/desactivar monitoreo |

### 3.3 Usuario (Protegido)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me` | Perfil del usuario actual |
| `PUT` | `/api/v1/users/me` | Actualizar perfil |

---

## 4. Implementación del Cliente HTTP

### 4.1 Función Base con Autenticación

**Archivo:** `src/api/fetch.ts`

**Propósito:** Wrapper de `fetch` que inyecta automáticamente el token JWT y maneja errores de sesión.

```typescript
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  
  // Cache busting para GET
  const method = options.method?.toUpperCase() || 'GET';
  let finalUrl = url;
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}_t=${Date.now()}`;
  }

  const response = await fetch(`${API_BASE_URL}${finalUrl}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // Interceptor: sesión expirada
  if (response.status === 401) {
    await AsyncStorage.removeItem('token');
    throw new Error('Unauthorized');
  }

  return response;
}
```

**Características clave:**
- **Inyección de Token:** Añade header `Authorization: Bearer <token>` automáticamente.
- **Cache Busting:** Parámetro `_t` evita respuestas cacheadas en GET.
- **Interceptor 401:** Limpia el token local si el servidor rechaza la sesión.

### 4.2 Función de Login

```typescript
export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  return data; // { success: true, data: { token: "eyJ..." } }
}
```

---

## 5. Funcionalidades Implementadas

### 5.1 Autenticación (LoginScreen)

**Flujo completo:**
1. Usuario ingresa email y contraseña.
2. Se validan campos vacíos (validación local).
3. Se llama a `apiLogin()`.
4. Si es exitoso, se guarda el token en `AsyncStorage` y se actualiza el contexto.
5. Si falla, se muestra mensaje de error en pantalla.

**Ejemplo de solicitud:**
```json
POST /api/v1/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Respuesta error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 5.2 Listado de Targets (DashboardScreen)

**Flujo:**
1. Al montar el componente, se llama a `fetchWithAuth('/api/v1/targets')`.
2. Se procesan los datos y se renderizan las tarjetas.
3. **Pull-to-refresh** permite recargar manualmente.
4. Se calculan estadísticas: Total, Online, Alertas.

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "API Principal",
      "url": "https://api.ejemplo.com/health",
      "type": "API",
      "current_status": "UP",
      "avg_response_time_ms": 145,
      "last_checked_at": "2026-01-31T10:30:00Z"
    }
  ]
}
```

### 5.3 Crear Target (AddTargetScreen)

**Validaciones implementadas:**
- Campos obligatorios (nombre, URL).
- Validación de formato URL con `new URL()`.
- Tipo: WEB o API.

**Ejemplo de solicitud:**
```json
POST /api/v1/targets
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "Mi Sitio Web",
  "type": "WEB",
  "url": "https://misitio.com"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Target created successfully",
  "data": {
    "id": "nuevo-uuid-generado",
    "name": "Mi Sitio Web",
    "url": "https://misitio.com",
    "type": "WEB",
    "current_status": "PENDING"
  }
}
```

### 5.4 Detalle y Métricas (TargetDetailsScreen)

Esta pantalla consume múltiples endpoints para mostrar información completa:

| Endpoint | Datos obtenidos |
|----------|-----------------|
| `/targets/{id}` | Nombre, URL, estado, configuración |
| `/targets/{id}/metrics` | Tiempos de respuesta (gráfica) |
| `/targets/{id}/history` | Historial de uptime (barras) |

---

## 6. Manejo de Errores

### 6.1 Clasificación de Errores

| Tipo | Código HTTP | Causa | Acción en App |
|------|-------------|-------|---------------|
| **Validación** | 400 | Datos inválidos | Mostrar mensaje específico |
| **Autenticación** | 401 | Token inválido/expirado | Cerrar sesión, redirigir a login |
| **Autorización** | 403 | Sin permisos | Mostrar acceso denegado |
| **No encontrado** | 404 | Recurso inexistente | Mostrar "no existe" |
| **Conflicto** | 409 | Email ya registrado | Mostrar mensaje específico |
| **Servidor** | 500 | Error interno | "Error del servidor, intente más tarde" |
| **Red** | - | Sin conexión | "Error de red" |

### 6.2 Implementación por Capas

**Capa 1: Wrapper HTTP (`fetch.ts`)**
- Intercepta 401 globalmente.
- Propaga errores al caller.

**Capa 2: Pantallas (Screens)**
- Captura errores con `try-catch`.
- Actualiza estado `error` para mostrar en UI.
- Ofrece botón "Reintentar".

**Ejemplo en DashboardScreen:**
```typescript
const fetchTargets = useCallback(async () => {
  try {
    const response = await fetchWithAuth('/api/v1/targets');
    if (response.ok) {
      const data = await response.json();
      setTargets(data.data || []);
      setError(''); // Limpiar error previo
    } else {
      setError('Error al cargar los sistemas');
    }
  } catch (err) {
    setError('Error de red');
  } finally {
    setLoading(false);
  }
}, []);
```

### 6.3 Feedback Visual al Usuario

| Estado | Componente UI |
|--------|---------------|
| Cargando | `<ActivityIndicator />` con texto "Cargando..." |
| Error | Contenedor rojo con mensaje + botón "Reintentar" |
| Vacío | Ícono + texto "No hay sistemas configurados" |
| Éxito | Modal con ícono verde + mensaje |

---

## 7. Pruebas de Integración

### 7.1 Casos de Prueba Ejecutados

| # | Caso | Entrada | Resultado Esperado | Resultado |
|---|------|---------|-------------------|-----------|
| 1 | Login válido | Credenciales correctas | Token JWT, navega a Dashboard | ✅ |
| 2 | Login inválido | Password incorrecto | Mensaje "Invalid credentials" | ✅ |
| 3 | Campos vacíos | Email vacío | Mensaje "Todos los campos son obligatorios" | ✅ |
| 4 | Listar targets | Token válido | Array de targets en Dashboard | ✅ |
| 5 | Token expirado | Token viejo | Redirige a Login | ✅ |
| 6 | Crear target | Datos completos | Target creado, modal de éxito | ✅ |
| 7 | URL inválida | "no-es-url" | Mensaje "La URL no es válida" | ✅ |
| 8 | Sin conexión | WiFi apagado | Mensaje "Error de red" | ✅ |
| 9 | Pull-to-refresh | Deslizar hacia abajo | Lista actualizada | ✅ |

### 7.2 Herramientas de Depuración

- **React Native Debugger:** Inspección de red y estado.
- **Flipper:** Logs y network inspector.
- **Console.log:** Logs en terminal de Metro Bundler.
- **Ngrok Dashboard:** Inspección de requests HTTP.

---

## 8. Evidencias Visuales

> **Instrucciones:** Agregar capturas de pantalla en la carpeta `docs/img/mobile/` y referenciarlas aquí.

### 8.1 Pantalla de Login
<!-- ![Login Screen](./img/mobile/login.png) -->
- Formulario con campos de email y contraseña.
- Botón de mostrar/ocultar contraseña.
- Toggle entre Login y Registro.

### 8.2 Dashboard Principal
<!-- ![Dashboard](./img/mobile/dashboard.png) -->
- Tarjetas de estadísticas (Total, Online, Alertas).
- Lista de sistemas con estado y tiempo de respuesta.
- Pull-to-refresh implementado.

### 8.3 Detalle de Target
<!-- ![Target Details](./img/mobile/target-detail.png) -->
- Información del sistema.
- Gráfica de tiempos de respuesta.
- Historial de uptime.

### 8.4 Manejo de Error
<!-- ![Error State](./img/mobile/error.png) -->
- Mensaje de error visible.
- Botón de reintentar.

---

## 9. Control de Versiones

### 9.1 Commits Realizados

```bash
# Ejemplo de commits descriptivos
git add up-track-mobile/src/api/
git commit -m "feat(mobile): implementar cliente HTTP con interceptor JWT"

git add up-track-mobile/src/screens/
git commit -m "feat(mobile): agregar pantallas de login, dashboard y detalle"

git add docs/integracion_app_movil.md
git commit -m "docs: documentar integración app móvil con API REST"

git push origin main
```

### 9.2 Archivos Modificados/Creados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/api/config.ts` | Creado | URL base del backend |
| `src/api/fetch.ts` | Creado | Cliente HTTP con autenticación |
| `src/context/AuthContext.tsx` | Creado | Gestión de estado de sesión |
| `src/screens/*.tsx` | Creados | Pantallas de la aplicación |
| `docs/integracion_app_movil.md` | Creado | Esta documentación |

---

## 10. Preguntas de Control

### 10.1 ¿Qué endpoint del backend fue consumido por la aplicación móvil y con qué propósito?

Se consumieron **7 endpoints principales**:

| Endpoint | Propósito |
|----------|-----------|
| `POST /api/v1/login` | Autenticar usuario y obtener JWT |
| `POST /api/v1/register` | Crear nueva cuenta de usuario |
| `GET /api/v1/targets` | Listar sistemas monitoreados del usuario |
| `POST /api/v1/targets` | Agregar nuevo sistema a monitorear |
| `GET /api/v1/targets/{id}` | Obtener detalle de un sistema específico |
| `GET /api/v1/targets/{id}/metrics` | Obtener métricas de tiempo de respuesta |
| `GET /api/v1/targets/{id}/history` | Obtener historial de cambios de estado |

El endpoint **más crítico** es `/login` ya que establece la sesión del usuario y genera el token JWT necesario para todas las demás operaciones.

### 10.2 ¿Qué códigos de estado HTTP se validaron durante la práctica?

| Código | Significado | Escenario en la App |
|--------|-------------|---------------------|
| **200** | OK | Login exitoso, datos obtenidos correctamente |
| **201** | Created | Target creado exitosamente |
| **400** | Bad Request | Campos vacíos, formato de datos inválido |
| **401** | Unauthorized | Token expirado o inválido → cierre de sesión automático |
| **403** | Forbidden | Intento de acceder a target de otro usuario |
| **404** | Not Found | Target eliminado o ID inexistente |
| **409** | Conflict | Email ya registrado al intentar registro |
| **500** | Internal Server Error | Error no controlado del backend |

### 10.3 ¿Cómo se gestionan los errores de red o respuestas fallidas en la app móvil?

La gestión se realiza en **tres niveles**:

1. **Nivel de Transporte (fetch.ts):**
   - Interceptor global para código 401 que limpia `AsyncStorage` y lanza excepción.
   - Si `fetch()` falla (sin conexión), se propaga el error como excepción.

2. **Nivel de Pantalla (Screens):**
   - Bloques `try-catch` capturan excepciones.
   - Estado `error` se actualiza con mensaje descriptivo.
   - Estado `loading` se desactiva en `finally`.

3. **Nivel Visual (UI):**
   - Componente de error con mensaje y botón "Reintentar".
   - Modales para errores de formulario.
   - `ActivityIndicator` durante carga.

### 10.4 ¿Qué diferencias encontraste entre consumir la API desde web y desde móvil?

| Aspecto | Web (React) | Móvil (React Native) |
|---------|-------------|----------------------|
| **Persistencia** | `localStorage` / Cookies | `AsyncStorage` (asíncrono) |
| **CORS** | Requiere configuración en backend | No aplica (entorno nativo) |
| **localhost** | Funciona directamente | Requiere IP local o túnel (Ngrok) |
| **Conectividad** | Estable (WiFi/Ethernet) | Inestable (4G, cambios de red) |
| **Caché** | Headers HTTP / Service Workers | Timestamp manual en URLs |
| **Debugging** | DevTools del navegador | Flipper / React Native Debugger |
| **Certificados** | Automático (navegador) | Puede requerir configuración |

### 10.5 ¿Qué mejoras aplicarías para fortalecer la experiencia del usuario en caso de error?

**Mejoras de corto plazo:**
1. **Detector de conectividad:** Usar `@react-native-community/netinfo` para mostrar banner "Sin conexión" antes de intentar peticiones.
2. **Toast notifications:** Reemplazar alertas nativas por toasts (react-native-toast-message) menos intrusivos.
3. **Retry automático:** Implementar retry con backoff exponencial para errores de red transitorios.

**Mejoras de mediano plazo:**
4. **Caché offline:** Almacenar última respuesta válida en AsyncStorage para mostrar datos aunque falle la red.
5. **Skeleton loaders:** Mostrar placeholders animados durante carga en lugar de spinner genérico.
6. **Mensajes contextuales:** Mapear códigos de error a mensajes específicos del dominio (ej: "El sistema no existe o fue eliminado" en lugar de "404").

**Mejoras de largo plazo:**
7. **Sincronización en background:** Actualizar datos cuando la app está en segundo plano.
8. **Queue de operaciones:** Encolar operaciones de escritura cuando no hay red y ejecutar al reconectar.

---

## Conclusiones

La integración entre la aplicación móvil React Native y la API REST del backend Go se completó exitosamente. Se implementaron todas las funcionalidades requeridas: autenticación, listado de datos, creación de registros y manejo de errores.

**Logros principales:**
- ✅ Cliente HTTP reutilizable con inyección automática de JWT.
- ✅ Interceptor de sesión expirada (401).
- ✅ Feedback visual en todos los estados (carga, error, vacío, éxito).
- ✅ Validaciones tanto locales como remotas.
- ✅ Pull-to-refresh para actualización manual.

**Áreas de mejora identificadas:**
- Implementar caché offline para mejor UX sin conexión.
- Agregar retry automático en errores transitorios.
- Mejorar mensajes de error para usuarios no técnicos.
