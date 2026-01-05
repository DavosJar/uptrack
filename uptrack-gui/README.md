# UpTrack GUI - Dashboard de Monitoreo

Interfaz web moderna para el sistema de monitoreo UpTrackAI, construida con React, TypeScript y Vite.

## ✨ Características

- **Dashboard en Tiempo Real**: Visualización del estado de servicios
- **Gráficos Interactivos**: Métricas de rendimiento y uptime
- **Notificaciones**: Gestión de alertas y canales
- **Interfaz Moderna**: Diseño con Tailwind CSS
- **TypeScript**: Type safety completo
- **Vite**: Desarrollo rápido con HMR

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- pnpm (recomendado) o npm

### Instalación
```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Construir para producción
pnpm build

# Preview de producción
pnpm preview
```

### Configuración
```bash
# Variables de entorno (.env)
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 🏗️ Arquitectura

```
uptrack-gui/
├── src/
│   ├── api/           # Cliente HTTP para la API
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas principales
│   ├── hooks/         # Hooks personalizados
│   └── types/         # Definiciones TypeScript
├── public/            # Assets estáticos
└── dist/              # Build output
```

## 🎨 Tecnologías

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Styling utility-first
- **React Router** - Navegación
- **Axios** - HTTP client
- **Chart.js** - Gráficos

## 📱 Páginas

### Dashboard
- Estado general del sistema
- Lista de targets con status
- Gráficos de uptime
- Alertas recientes

### Targets
- Gestión CRUD de servicios monitoreados
- Configuración de checks
- Historial de estados

### Notificaciones
- Configuración de canales (Telegram, Email)
- Historial de alertas
- Gestión de suscripciones

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Servidor de desarrollo
pnpm build        # Build de producción
pnpm preview      # Preview del build
pnpm lint         # Ejecutar ESLint

# Testing (futuro)
pnpm test         # Ejecutar tests
pnpm test:ui      # Tests con UI
```

## 🌐 API Integration

La GUI se conecta a la API REST de UpTrackAI:

```typescript
// Ejemplo de llamada a la API
const response = await api.get('/monitoring/targets');
const targets = response.data;
```

### Endpoints Principales
- `GET /monitoring/targets` - Listar targets
- `POST /monitoring/targets` - Crear target
- `GET /notifications/channels` - Canales de notificación
- `GET /notifications/telegram/link` - Magic link Telegram

## 🎯 Roadmap

### Próximas Características
- [ ] **Real-time Updates**: WebSocket para actualizaciones live
- [ ] **Advanced Charts**: Gráficos históricos detallados
- [ ] **Alert Management**: Ack y escalado de alertas
- [ ] **User Management**: Perfiles y permisos
- [ ] **Dark Mode**: Tema oscuro
- [ ] **Mobile App**: PWA responsive

### Mejoras Técnicas
- [ ] **Testing**: Unit tests con Vitest
- [ ] **E2E Testing**: Playwright
- [ ] **Performance**: Code splitting y lazy loading
- [ ] **Accessibility**: WCAG compliance
- [ ] **i18n**: Internacionalización

## 🤝 Desarrollo

### Estructura de Componentes
```typescript
// Componente típico
interface TargetCardProps {
  target: Target;
  onStatusChange: (status: TargetStatus) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({
  target,
  onStatusChange
}) => {
  // Lógica del componente
};
```

### Convenciones
- **Nombres**: PascalCase para componentes, camelCase para funciones
- **Hooks**: `use` prefix (ej: `useTargets`)
- **Types**: Definidos en `src/types/`
- **API**: Centralizado en `src/api/`

## 📦 Build y Deployment

### Producción
```bash
# Build optimizado
pnpm build

# Los archivos se generan en `dist/`
# Servir con nginx, vercel, etc.
```

### Docker (Opcional)
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## 🐛 Troubleshooting

### Problemas Comunes
- **CORS**: Verificar configuración del backend
- **API Connection**: Verificar `VITE_API_BASE_URL`
- **Build Errors**: Limpiar `node_modules` y reinstall

### Debug
```bash
# Ver logs del dev server
pnpm dev --debug

# Verificar build
pnpm build --mode development
```

## 📄 Licencia

Este proyecto es parte de UpTrackAI y está bajo la Licencia MIT.
