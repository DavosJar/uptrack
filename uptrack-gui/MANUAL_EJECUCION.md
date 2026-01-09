# Manual de Ejecución y Diseño - UpTrack GUI

Este documento proporciona una guía detallada para la ejecución local de la aplicación, conexión con el backend, estándares de diseño y una descripción visual de la interfaz.

## 1. Capturas de la Aplicación en Funcionamiento

*(Nota: Como asistente de texto, no puedo generar capturas de pantalla reales, pero a continuación describo lo que observarás en cada vista)*

### 🔐 Login / Registro
- **Login:** Diseño dividido (split-screen). A la izquierda, branding con fondo abstracto y logo de UpTrack. A la derecha, formulario de inicio de sesión limpio con campos para email y contraseña.
- **Registro:** Modalidad similar, permitiendo crear nuevas cuentas de usuario.

### 📊 Dashboard Principal
- **KPIs Superiores:** Tres tarjetas mostrando métricas clave: "Total Sistemas", "Sistemas Online" (verde), "Con Alertas" (rojo).
- **Lista de Sistemas:** Grid de tarjetas para cada sistema monitoreado, mostrando indicadores de estado (color del borde/texto), tiempo de respuesta y última verificación.

### 📈 Detalles del Sistema (Target Detail)
- **Barra de Estado Temporal:** Visualización tipo "timeline" segmentada por colores (verde/rojo) mostrando el historial de disponibilidad.
- **Gráficos:** Gráficos de línea (Recharts) mostrando la latencia (ms) en las últimas 24 horas.
- **Heatmap:** Mapa de calor semanal (si disponible) mostrando patrones de disponibilidad.

### 📝 Reportes
- Formulario para seleccionar un sistema y un rango de fechas.
- Botón "Generate Report" que despliega estadísticas detalladas y una vista imprimible de los datos.

---

## 2. Instrucciones de Ejecución Local

### Prerrequisitos
*   **Node.js:** Versión 18 o superior.
*   **pnpm:** Gestor de paquetes recomendado (o npm).
*   **Go:** (Para el backend) Versión 1.21+.
*   **Docker:** (Opcional, si se usa docker-compose para la base de datos).

### Configuración del Entorno (Frontend)
El archivo `.env` en la raíz de `uptrack-gui` debe apuntar a la dirección donde corre tu backend.

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Ejecución en Windows 🪟

**1. Levantar el Backend:**
Abre una terminal (PowerShell o CMD) en la carpeta `uptrack/backend`:
```powershell
# Instalar dependencias
go mod download

# Ejecutar el servidor
go run main.go
# El servidor debería iniciar en el puerto 8080
```

**2. Levantar el Frontend:**
Abre una **nueva** terminal en `uptrack/uptrack-gui`:
```powershell
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Ejecución en Linux 🐧

**1. Levantar el Backend:**
Terminal en `uptrack/backend`:
```bash
# Dependencias y ejecución
go mod download
go run main.go
```

**2. Levantar el Frontend:**
Terminal en `uptrack/uptrack-gui`:
```bash
pnpm install
pnpm dev
```

---

## 3. Conexión Backend-Frontend

*   **CORS:** El backend (`backend/config/server.go`) está configurado para permitir peticiones desde cualquier origen (`Access-Control-Allow-Origin: *`) durante el desarrollo, por lo que no deberías tener problemas de bloqueo CORS.
*   **Endpoint Base:** Todas las peticiones del frontend se prefijan con la URL definida en `VITE_API_BASE_URL`.
*   **Autenticación:** El sistema usa JWT. El frontend almacena el token en `localStorage` tras el login y lo inyecta automáticamente en el header `Authorization: Bearer <token>` mediante la utilidad `fetchWithAuth`.

---

## 4. Estándares de Diseño Aplicados

### 🎨 Estilos y CSS
*   **Framework:** Tailwind CSS v4.
*   **Metodología:** Utility-first CSS. No se usan archivos CSS/SCSS separados por componente, sino clases utilitarias directamente en el JSX.
*   **Tema Personalizado:** Se utilizan variables CSS nativas (`--color-background`, `--color-primary`) definidas en `@theme` dentro de `src/index.css`. Esto facilita el cambio de temas y mantiene la consistencia.
*   **Diseño Oscuro (Dark Mode):** La aplicación es nativamente oscura ("Dark Interface") para reducir la fatiga visual en tareas de monitoreo.
*   **Accesibilidad (A11y):** Se han implementado atributos ARIA (`role`, `aria-label`, `aria-live`) en componentes interactivos para soporte de lectores de pantalla.

### 🧩 Estructura de Componentes
*   **Atomic Design (Simplificado):**
    *   `components/ui`: Átomos y moléculas básicas (Botones, Inputs, Modales). Son componentes puros, sin lógica de negocio, solo presentación.
    *   `components/layout`: Organismos estructurales (Sidebar, Header).
    *   `pages`: Plantillas/Páginas completas que conectan los componentes con la lógica de datos y el estado.
*   **Hooks:** La lógica de estado compleja o reutilizable se extrae (aunque actualmente mucha lógica reside en las páginas para simplicidad).
*   **Principio de Responsabilidad Única:** Los componentes UI (`Button`, `FormField`) son genéricos y reusables. Las páginas (`Dashboard`, `Systems`) manejan la llamada a la API y el estado de la vista.

### 📂 Nomenclatura
*   **Archivos:** PascalCase para componentes (`TargetDetail.tsx`) y camelCase para utilidades (`fetch.ts`).
*   **Clases CSS:** Clases estándar de Tailwind (`flex`, `p-4`, `text-white`).
*   **Variables de Entorno:** Prefijo `VITE_` obligatorio para exposición al cliente (ej. `VITE_API_BASE_URL`).
