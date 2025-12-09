<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SystemWatch Pro

Sistema de monitoreo y gestión de servidores construido con React, TypeScript y Tailwind CSS.

## 🚀 Características

- 📊 Dashboard de monitoreo de sistemas en tiempo real
- 📈 Visualización de métricas con gráficos interactivos
- 👥 Gestión de equipos y usuarios
- 📝 Generación de reportes personalizados
- 🎨 Interfaz moderna con modo oscuro
- 📱 Diseño completamente responsive
- 🔐 Sistema de autenticación

## 🛠️ Tecnologías

- **React 19** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconografía
- **Recharts** - Visualización de datos

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd plataformas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno (opcional)

Si es necesario, crea un archivo `.env.local` en la raíz del proyecto:

```env
# Agrega tus variables de entorno aquí
```

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne automáticamente).

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build de producción
npm run preview
```

## 🏗️ Estructura del Proyecto

```
plataformas/
├── App.tsx           # Componente principal con todas las vistas
├── types.ts          # Definiciones de tipos TypeScript
├── index.tsx         # Punto de entrada
├── index.html        # HTML base
├── vite.config.ts    # Configuración de Vite
├── tsconfig.json     # Configuración de TypeScript
├── package.json      # Dependencias y scripts
└── docs/             # Documentación del proyecto
    ├── ui_prototipo_stitch.md  # Documentación del prototipo UI
    └── img/          # Imágenes y capturas de pantalla
```

## 📚 Documentación

Para más información sobre el prototipo de UI y las pantallas del sistema, consulta la [documentación del prototipo](docs/ui_prototipo_stitch.md).

## 🎨 Características de UI

- **Sidebar colapsable**: En desktop se puede ocultar/mostrar
- **Header fijo en móvil**: Navegación siempre accesible
- **Burger menu**: Para navegación en dispositivos móviles
- **Responsive design**: Adaptado a todos los tamaños de pantalla
