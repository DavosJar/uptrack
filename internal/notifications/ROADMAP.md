# Roadmap: Módulo de Notificaciones (100% Completion)

Este documento detalla los pasos necesarios para finalizar el módulo de notificaciones, migrando de la implementación legacy (`AlertMessage`) a la nueva arquitectura basada en Eventos y Severidad (`AlertEvent`).

## 1. Dominio y Lógica de Alertas (✅ En Progreso)
- [x] **Definir `AlertEvent`**: Estructura agnóstica para eventos de alerta.
- [x] **Definir `AlertSeverity`**: Niveles de severidad universales (OK, WARNING, CRITICAL).
- [x] **Implementar `SeverityMapper`**: Traducción de estados de monitoreo a severidades sin `switch/case`.
- [ ] **Unit Tests**: Tests para `AlertEvent.ShouldNotify()` y `SeverityMapper`.

## 2. Integración con Monitoring (Adapter Pattern)
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

## 3. Servicio de Aplicación (Notification Service)
- [ ] **Refactorizar `NotificationService`**:
    - Método principal: `Notify(event domain.AlertEvent)`.
    - Lógica:
        1. Verificar `event.ShouldNotify()`.
        2. Si es true, obtener canales configurados.
        3. Despachar el evento a los canales.
- [ ] **Eliminar dependencia de `AlertMessage`**: El servicio solo debe conocer `AlertEvent`.

## 4. Infraestructura de Canales (Telegram / Slack)
- [ ] **Implementar `ChannelSender` Interface**:
    - Método `Send(event domain.AlertEvent) error`.
- [ ] **Telegram Implementation**:
    - Integrar con API de Telegram (HTTP Client).
    - Formatear mensaje usando `event.BuildMessage()`.
- [ ] **Slack Implementation**:
    - Integrar con Webhooks de Slack.
    - Formatear mensaje (Blocks/Attachments).
- [ ] **Factory de Canales**:
    - `GetSender(type ChannelType, config map[string]string) ChannelSender`.

## 5. Persistencia y Configuración
- [ ] **Repositorio de Canales**:
    - Implementar `PostgresNotificationRepository`.
    - CRUD para `NotificationChannel` (Guardar tokens, chat_ids, etc. de forma segura).
- [ ] **API Endpoints**:
    - `POST /notifications/channels`: Crear/Configurar canal.
    - `GET /notifications/channels`: Listar canales.
    - `DELETE /notifications/channels/:id`: Eliminar canal.
    - `POST /notifications/test`: Enviar notificación de prueba.

## 6. Limpieza (Cleanup)
- [ ] **Eliminar `AlertMessage`**: Una vez que el Scheduler use `AlertEvent` y el servicio también, borrar `internal/notifications/domain/alert_message.go`.
- [ ] **Revisar TODOs**: Buscar y resolver comentarios pendientes.

## 7. Testing Final
- [ ] **Integration Test**: Simular caída de servicio -> Verificar llamada a Mock de Telegram.
- [ ] **E2E**: Configurar canal vía API -> Disparar alerta -> Recibir mensaje real.
