# Roadmap: Módulo de Notificaciones (✅ 80% Completion)

Este documento detalla los pasos necesarios para finalizar el módulo de notificaciones, migrando de la implementación legacy (`AlertMessage`) a la nueva arquitectura basada en Eventos y Severidad (`AlertEvent`).

## 1. Dominio y Lógica de Alertas (✅ Completado)
- [x] **Definir `AlertEvent`**: Estructura agnóstica para eventos de alerta.
- [x] **Definir `AlertSeverity`**: Niveles de severidad universales (OK, WARNING, CRITICAL).
- [x] **Implementar `SeverityMapper`**: Traducción de estados de monitoreo a severidades sin `switch/case`.
- [x] **Unit Tests**: Tests para `AlertEvent.ShouldNotify()` y `SeverityMapper`.

## 2. Vinculación de Canales (Magic Link) (✅ Completado)
- [x] **Value Objects**: `LinkingToken` (Seguro, expiración 15 min).
- [x] **Repositorio**: `LinkingTokenRepository` (Postgres).
- [x] **Servicio de Aplicación**: `TelegramLinkingService` (Generación y validación de links).
- [x] **Handlers**:
    - `GET /notifications/telegram/link`: Genera deep link `t.me/Bot?start=TOKEN`.
    - `POST /webhooks/telegram`: Procesa `/start TOKEN` y vincula automáticamente.
- [x] **Polling Service**: Soporte para desarrollo local sin webhooks públicos.

## 3. Infraestructura de Envio (Senders) (✅ Completado)
- [x] **`Sender` Interface**: Abstracción para envío de mensajes.
- [x] **`SenderRegistry`**: Registro dinámico de senders (evita switch/case).
- [x] **Telegram Sender**: Implementación HTTP para enviar mensajes.
- [x] **Telegram Webhook Config**: Utilidad para registrar/borrar webhooks.

## 4. Integración con Monitoring (Adapter Pattern) (🚧 Pendiente)
- [ ] **Crear Adapter en Monitoring**:
    - Implementar una función o servicio que reciba `TargetStatus` (viejo y nuevo).
    - Usar `SeverityMapper` para convertir a `AlertSeverity`.
    - Generar un `AlertEvent`.
- [ ] **Actualizar Scheduler**:
    - Modificar `internal/monitoring/infrastructure/scheduler/scheduler.go`.
    - Reemplazar la construcción directa de `AlertMessage` por el uso del Adapter.
    - **Nota**: Mantener `AlertMessage` temporalmente si es necesario, pero el objetivo es que el Scheduler envíe `AlertEvent` al servicio de notificaciones.
- [ ] **Control de Estabilidad (Anti-Flapping)**:
    - Evaluar lógica de "Reminder" o notas en el Scheduler para evitar el "ping-pong" de severidades (cambios constantes).

## 5. Servicio de Aplicación (Notification Service) (🚧 En Progreso)
- [x] **Refactorizar `NotificationService`**:
    - Actualizado para usar `SenderRegistry`.
- [ ] **Método `Notify(event domain.AlertEvent)`**:
    - Falta implementar la lógica de recibir el evento, buscar canales del usuario y despachar.
- [ ] **Eliminar dependencia de `AlertMessage`**: El servicio solo debe conocer `AlertEvent`.

## 6. Persistencia y Configuración (🚧 En Progreso)
- [ ] **Repositorio de Canales**:
    - Implementar `PostgresNotificationRepository`.
    - CRUD para `NotificationChannel` (Guardar tokens, chat_ids, etc. de forma segura).
- [x] **API Endpoints (Vinculación)**:
    - `GET /notifications/telegram/link`.
- [ ] **API Endpoints (Gestión)**:
    - `GET /notifications/channels`: Listar canales.
    - `DELETE /notifications/channels/:id`: Eliminar canal.
    - `POST /notifications/test`: Enviar notificación de prueba.

## 7. Limpieza (Cleanup)
- [ ] **Eliminar `AlertMessage`**: Una vez que el Scheduler use `AlertEvent` y el servicio también, borrar `internal/notifications/domain/alert_message.go`.
- [ ] **Revisar TODOs**: Buscar y resolver comentarios pendientes.

## 7. Testing Final
- [ ] **Integration Test**: Simular caída de servicio -> Verificar llamada a Mock de Telegram.
- [ ] **E2E**: Configurar canal vía API -> Disparar alerta -> Recibir mensaje real.
