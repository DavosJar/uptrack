package scheduler

import (
	notificationdomain "uptrackai/internal/notifications/domain"
)

type NotificationDispatcher struct {
	alertChannel chan notificationdomain.AlertEvent
}

func NewNotificationDispatcher(bufferSize int) *NotificationDispatcher {
	return &NotificationDispatcher{
		alertChannel: make(chan notificationdomain.AlertEvent, bufferSize),
	}
}

// Dispatch envía un evento al canal de alertas.
// Es thread-safe y diseñado para ser usado por múltiples workers.
func (d *NotificationDispatcher) Dispatch(event notificationdomain.AlertEvent) {
	// Enviamos al canal. Si el buffer está lleno, esto bloqueará al worker.
	// En un sistema real de alta carga, podríamos querer métricas de "dropped events" o un buffer muy grande.
	d.alertChannel <- event
}

// Events retorna el canal de lectura para el worker de notificaciones
func (d *NotificationDispatcher) Events() <-chan notificationdomain.AlertEvent {
	return d.alertChannel
}

// Close cierra el canal
func (d *NotificationDispatcher) Close() {
	close(d.alertChannel)
}
