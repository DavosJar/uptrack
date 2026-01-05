# Roadmap: Módulo de Notificaciones (✅ 95% Completion)

Este documento detalla el estado actual del módulo de notificaciones, completamente funcional con integración Telegram vía magic link.

## ✅ 1. Dominio y Lógica de Alertas (Completado)
- [x] **Definir `AlertEvent`**: Estructura agnóstica para eventos de alerta.
- [x] **Definir `AlertSeverity`**: Niveles de severidad universales (OK, WARNING, CRITICAL).
- [x] **Implementar `SeverityMapper`**: Traducción de estados de monitoreo a severidades sin `switch/case`.
- [x] **Unit Tests**: Tests para `AlertEvent.ShouldNotify()` y `SeverityMapper`.

## ✅ 2. Vinculación de Canales (Magic Link) (Completado)
- [x] **Value Objects**: `LinkingToken` (Seguro, expiración 15 min).
- [x] **Repositorio**: `LinkingTokenRepository` (Postgres).
- [x] **Servicio de Aplicación**: `TelegramLinkingService` (Generación y validación de links).
- [x] **Handlers**:
    - `GET /notifications/telegram/link`: Genera deep link `t.me/Bot?start=TOKEN`.
    - `POST /webhooks/telegram`: Procesa `/start TOKEN` y vincula automáticamente.
- [x] **Polling Service**: Soporte para desarrollo local sin webhooks públicos.
- [x] **Base de Datos**: Tabla `notification_channels` con ID varchar(100).

## ✅ 3. Infraestructura de Envio (Senders) (Completado)
- [x] **`Sender` Interface**: Abstracción para envío de mensajes.
- [x] **`SenderRegistry`**: Registro dinámico de senders (evita switch/case).
- [x] **Telegram Sender**: Implementación HTTP para enviar mensajes.
- [x] **Telegram Webhook Config**: Utilidad para registrar/borrar webhooks.

## ✅ 4. Integración con Monitoring (Completado)
- [x] **NotificationDispatcher**: Queue asíncrono con Go channels.
- [x] **Adapter en Monitoring**: Conversión de `TargetStatus` a `AlertEvent`.
- [x] **Scheduler Integration**: `Orchestrator` envía eventos al dispatcher.
- [x] **Control de Estabilidad**: Lógica anti-flapping implementada.

## ✅ 5. Servicio de Aplicación (Notification Service) (Completado)
- [x] **Refactorizar `NotificationService`**: Usa `SenderRegistry`.
- [x] **Método `Notify(event domain.AlertEvent)`**:
    - Recibe `AlertEvent`.
    - **Paso 1 (Persistencia)**: Guarda notificación en DB.
    - **Paso 2 (Despacho)**: Busca canales activos del usuario.
    - **Paso 3 (Envío)**: Usa `SenderRegistry` para enviar a cada canal.
- [x] **Eliminada dependencia de `AlertMessage`**.

## ✅ 6. Persistencia y Configuración (Completado)
- [x] **Repositorio de Notificaciones**: `PostgresNotificationRepository`.
    - Tabla `notifications` (id, user_id, title, message, severity, read_at, created_at).
    - Métodos: `Save(notification)`, `GetUnread(userId)`, `MarkAsRead(id)`.
- [x] **Repositorio de Canales**: `PostgresChannelRepository`.
    - CRUD para `NotificationChannel` (Guardar tokens, chat_ids, etc.).
- [x] **API Endpoints (Vinculación)**:
    - `GET /notifications/telegram/link`.
    - `GET /notifications/channels`.

## ✅ 7. API para GUI (Completado)
- [x] **Endpoints de Notificaciones**:
    - `GET /api/v1/notifications`: Listar notificaciones (paginado).
    - `POST /api/v1/notifications/:id/read`: Marcar como leída.
    - `POST /api/v1/notifications/read-all`: Marcar todas como leídas.

- [x] **API Endpoints (Gestión)**:
    - `GET /notifications/channels`: Listar canales.
    - `DELETE /notifications/channels/:id`: Eliminar canal.
    - `POST /notifications/test`: Enviar notificación de prueba.

## ✅ 8. Testing y Calidad (Completado)
- [x] **Integration Test**: Simular caída de servicio -> Verificar notificaciones.
- [x] **E2E**: Configurar canal vía API -> Disparar alerta -> Recibir mensaje real.
- [x] **Modo Simulador**: Para testing sin requests HTTP reales.

## 🎯 Características Implementadas

### Notificaciones Asíncronas
- Queue con Go channels (buffered)
- Procesamiento en background
- No bloquea el monitoring

### Telegram Integration
- Magic link para vinculación automática
- Polling para desarrollo local
- Webhook support para producción
- Mensajes formateados con emojis

### Persistencia Segura
- Tokens de vinculación con expiración
- Canales encriptados en BD
- Migraciones automáticas GORM

### Arquitectura Clean
- Separación clara de capas
- Dependency injection
- Interfaces para testabilidad

## 🔄 Próximos Pasos (Opcionales)

- [ ] **Email Notifications**: Extender `SenderRegistry` para SMTP
- [ ] **SMS Notifications**: Integración con Twilio/SMS gateways
- [ ] **Webhook Outgoing**: Notificar a sistemas externos
- [ ] **Templates**: Sistema de plantillas para mensajes
- [ ] **Rate Limiting**: Control de frecuencia de notificaciones
- [ ] **Notification Groups**: Agrupar alertas similares
- [ ] **Escalation**: Notificaciones progresivas por severidad
