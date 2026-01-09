# Descripción del Diseño de la Interfaz (UpTrack GUI)

Este documento describe la arquitectura, estructura, estilos y dependencias del frontend de UpTrack (`uptrack-gui`).

## 1. Stack Tecnológico y Dependencias

El proyecto está construido utilizando modernas tecnologías de desarrollo web:

*   **Framework Core:** React 19.x
*   **Lenguaje:** TypeScript
*   **Build Tool:** Vite 7.x
*   **Enrutamiento:** React Router DOM 7.x
*   **Estilos:** Tailwind CSS 4.x
*   **Visualización de Datos:** Recharts (Gráficos y analíticas)
*   **Iconografía:** Lucide React

## 2. Estructura del Proyecto

El código fuente se organiza dentro del directorio `src` siguiendo una estructura modular:

```
src/
├── api/             # Lógica de comunicación con el backend (fetch wrappers)
├── assets/          # Recursos estáticos (imágenes, fuentes)
├── components/      # Componentes reutilizables
│   ├── layout/      # Componentes de estructura (MainLayout, Sidebar, Header, MobileHeader)
│   └── ui/          # Componentes primitivos (Button, Modal, FormField, etc.)
├── data/            # Datos estáticos o mocks
├── pages/           # Vistas principales de la aplicación
│   ├── Dashboard.tsx    # Vista principal con métricas
│   ├── TargetDetail.tsx # Detalles específicos de un sistema
│   ├── Systems.tsx      # Gestión de sistemas (CRUD)
│   ├── Reports.tsx      # Generación de reportes
│   ├── Login.tsx        # Autenticación
│   ├── Register.tsx     # Registro de usuarios
│   └── ...              # Otras páginas (Profile, Settings, etc.)
├── App.tsx          # Configuración de rutas y layout principal
├── index.css        # Estilos globales y configuración del tema
└── main.tsx         # Punto de entrada de la aplicación
```

## 3. Sistema de Diseño y Estilos

El diseño visual utiliza **Tailwind CSS** con una configuración de tema personalizada definida en CSS variables (CSS-first configuration de Tailwind v4).

### Paleta de Colores (Tema Oscuro)

El esquema de colores es principalmente oscuro, optimizado para dashboards y monitoreo prolongado. Las variables principales son:

| Variable CSS | Uso | Color Hex |
| :--- | :--- | :--- |
| `--color-background` | Fondo principal | `#101622` |
| `--color-background-surface` | Superficies (Navbars) | `#111722` |
| `--color-background-card` | Tarjetas y contenedores | `#181F2D` |
| `--color-background-input` | Inputs de formularios | `#192233` |
| `--color-text-main` | Texto principal | `#ffffff` |
| `--color-text-muted` | Texto secundario | `#92a4c9` |
| `--color-primary` | Color de acento/acciones | `#135bec` |

### Estados de Sistema
Se utilizan colores semánticos para indicar el estado de los servicios monitoreados:
*   🟢 **Success (UP):** `#28a745`
*   🔴 **Danger (DOWN):** `#dc3545`
*   🟡 **Warning (DEGRADED):** `#ffc107`

### Accesibilidad (ARIA)
La interfaz implementa atributos ARIA para garantizar la accesibilidad:
*   Roles semánticos (`banner`, `navigation`, `main`, `contentinfo`).
*   Etiquetas ARIA (`aria-label`, `aria-labelledby`, `aria-describedby`).
*   Estados dinámicos (`aria-busy`, `aria-live`, `aria-expanded`).
*   Navegación por teclado optimizada.

### Diseño Responsivo
La interfaz es totalmente responsiva ("Mobile First" en Tailwind), adaptándose desde dispositivos móviles hasta pantallas de escritorio grandes:
*   Sidebar colapsable/oculto en móviles.
*   Tablas que se transforman en tarjetas en vistas compactas.
*   Gráficos que ajustan su tamaño al contenedor.

## 4. Componentes Clave

### Layout Principal (`MainLayout`)
Envuelve la aplicación autenticada, gestionando:
*   Sidebar de navegación (Desktop).
*   Header móvil con menú hamburguesa (Mobile).
*   Área de contenido principal (`role="main"`).

### Dashboard
Ofrece una vista resumen con KPIs (Sistemas Totales, Online, Alertas) y un listado filtrable de tarjetas de estado de los sistemas.

### Gráficos (`Recharts`)
Implementados principalmente en la vista de reportes y detalles para visualizar:
*   Historial de latencia.
*   Tiempos de respuesta.
*   Uptime.

## 5. Build y Despliegue

La aplicación se compila utilizando Vite, generando activos estáticos optimizados en la carpeta `dist`.
Scripts disponibles:
*   `pnpm dev`: Servidor de desarrollo.
*   `pnpm build`: Compilación para producción (TypeScript + Vite).
*   `pnpm preview`: Vista previa del build de producción.
