# 🚀 UptracKAI - Intelligent Monitoring System

Sistema de monitoreo inteligente que detecta cambios de estado reales en APIs y servicios. Elimina falsos positivos usando confirmación adaptativa y clasifica problemas en 6 estados: UP, DOWN, DEGRADED, UNSTABLE, FLAPPING, UNKNOWN.

## ✨ Características

- **Monitoreo Inteligente**: Detección de 6 estados de servicio con eliminación de falsos positivos
- **Notificaciones en Tiempo Real**: Integración con Telegram vía magic link
- **Arquitectura Limpia**: Separación clara de responsabilidades con Clean Architecture
- **API REST**: Documentada con Swagger/OpenAPI
- **Autenticación JWT**: Sistema de usuarios seguro
- **Base de Datos PostgreSQL**: Persistencia robusta con GORM
- **Modo Simulador**: Para testing y demostraciones sin requests reales
- **Interfaz Web**: Dashboard moderno con React + Vite + Tailwind CSS
- **Docker**: Despliegue completo con docker-compose

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Levantar todo el sistema
make docker-up

# O en segundo plano
make docker-up-d
```

### Desarrollo Local

```bash
# Instalar dependencias
go mod tidy

# Ejecutar con hot reload
make air-local

# O compilar y ejecutar
go build -o main .
./main
```

## 📋 Requisitos

- Go 1.21+
- PostgreSQL 13+
- Docker & Docker Compose (opcional)
- Node.js 18+ (para el frontend)

## 🏗️ Arquitectura

```
uptrack/
├── cmd/uptrackai/          # Punto de entrada
├── internal/
│   ├── monitoring/         # Sistema de monitoreo
│   │   ├── domain/         # Reglas de negocio
│   │   ├── application/    # Casos de uso
│   │   ├── infrastructure/ # Persistencia
│   │   └── presentation/   # API HTTP
│   ├── notifications/      # Sistema de notificaciones
│   ├── security/          # Autenticación JWT
│   └── user/              # Gestión de usuarios
├── uptrack-gui/           # Frontend React
├── config/                # Configuración BD y migraciones
└── docs/                  # Documentación API
```

## 🔧 Configuración

### Variables de Entorno

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=uptrackai

# JWT
JWT_SECRET=your-secret-key

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_NAME=your-bot-name

# Webhook (opcional, para producción)
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/telegram
```

### Telegram Notifications

1. Crear un bot con @BotFather en Telegram
2. Obtener el token del bot
3. Configurar variables de entorno
4. Los usuarios pueden vincular su Telegram vía magic link desde la app

## 📊 API Endpoints

### Monitoring
- `GET /api/v1/monitoring/targets` - Listar targets
- `POST /api/v1/monitoring/targets` - Crear target
- `GET /api/v1/monitoring/targets/{id}/stats` - Estadísticas

### Notifications
- `GET /api/v1/notifications/telegram/link` - Generar magic link
- `GET /api/v1/notifications/channels` - Listar canales

### Auth
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro

Documentación completa en `/docs` cuando el servidor esté corriendo.

## 🧪 Testing

```bash
# Ejecutar tests
make test

# Con verbose
make test-verbose
```

## 🐳 Comandos Docker

```bash
make help  # Ver todos los comandos

# Desarrollo
make docker-up      # Levantar servicios
make docker-logs    # Ver logs
make docker-shell   # Terminal del contenedor
make docker-restart # Reiniciar

# Base de datos
make db-connect     # Conectar a PostgreSQL
```

## 🎯 Estados de Servicio

- **UP**: Servicio funcionando correctamente
- **DOWN**: Servicio completamente caído
- **DEGRADED**: Rendimiento reducido
- **UNSTABLE**: Comportamiento inestable
- **FLAPPING**: Cambios frecuentes de estado
- **UNKNOWN**: Estado no determinado

## 🤖 Modo Simulador

Para testing sin requests reales:

```go
// En internal/monitoring/module.go
// Cambiar executeScheduler() para usar SimulatorScheduler
```

El simulador genera comportamientos realistas y ciclos de degradación.

## 📱 Frontend

```bash
cd uptrack-gui
pnpm install
pnpm dev
```

Dashboard moderno con gráficos de estado de servicios.

## 📝 Roadmap

Ver ROADMAP.md para futuras características.

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
