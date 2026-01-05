package domain

import (
	"fmt"
	"time"
)

// AlertSeverity define el nivel de gravedad de la alerta de forma universal
type AlertSeverity int

const (
	SeverityOk AlertSeverity = iota
	SeverityWarning
	SeverityCritical
	SeverityInfo
)

var severityNames = map[AlertSeverity]string{
	SeverityOk:       "OK",
	SeverityWarning:  "WARNING",
	SeverityCritical: "CRITICAL",
	SeverityInfo:     "INFO",
}

var severityEmojis = map[AlertSeverity]string{
	SeverityOk:       "✅",
	SeverityWarning:  "⚠️",
	SeverityCritical: "🚨",
	SeverityInfo:     "ℹ️",
}

func (s AlertSeverity) String() string {
	if name, ok := severityNames[s]; ok {
		return name
	}
	return "UNKNOWN"
}

// AlertType define el origen de la alerta (Monitoring, System, Billing, etc)
type AlertType string

const (
	AlertTypeMonitoring AlertType = "MONITORING"
	AlertTypeSystem     AlertType = "SYSTEM"
)

// AlertEvent es la NUEVA estructura agnóstica que reemplazará eventualmente a AlertMessage
type AlertEvent struct {
	UserID           string // ID del usuario propietario del recurso
	Title            string
	Message          string
	Severity         AlertSeverity
	PreviousSeverity AlertSeverity
	Source           string // Ej: "Target: Google", "System: Database"
	Type             AlertType
	Timestamp        time.Time
	Metadata         map[string]string // Datos extra (response_time, error_code, etc)
}

// NewAlertEvent crea una nueva instancia de AlertEvent
func NewAlertEvent(userId, title, message string, severity, prevSeverity AlertSeverity, source string, alertType AlertType, metadata map[string]string) *AlertEvent {
	return &AlertEvent{
		UserID:           userId,
		Title:            title,
		Message:          message,
		Severity:         severity,
		PreviousSeverity: prevSeverity,
		Source:           source,
		Type:             alertType,
		Timestamp:        time.Now(),
		Metadata:         metadata,
	}
}

// ShouldNotify encapsula la lógica de negocio para decidir si se debe enviar una notificación
// Esta es la implementación de la "Regla de Oro"
func (e *AlertEvent) ShouldNotify() bool {
	// Regla: Solo notificamos si hay un cambio de Severidad.
	// Esto cubre:
	// - OK -> WARNING (Degradación)
	// - WARNING -> CRITICAL (Caída total)
	// - CRITICAL -> OK (Recuperación)
	// - WARNING -> OK (Recuperación parcial)
	// Y evita ruido en:
	// - CRITICAL -> CRITICAL (Ya sabemos que está caído)
	// - WARNING -> WARNING (Sigue lento)
	return e.Severity != e.PreviousSeverity
}

// BuildMessage genera el mensaje formateado para los canales de notificación
func (e *AlertEvent) BuildMessage() string {
	emoji := e.getEmoji()
	return fmt.Sprintf("\n%s [%s] %s\n"+
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
		"Origen: %s\n"+
		"Estado: %s → %s\n"+
		"Mensaje: %s\n"+
		"Hora: %s\n"+
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
		emoji, e.Type, e.Title,
		e.Source,
		e.PreviousSeverity, e.Severity,
		e.Message,
		e.Timestamp.Format("15:04:05"))
}

func (e *AlertEvent) getEmoji() string {
	if emoji, ok := severityEmojis[e.Severity]; ok {
		return emoji
	}
	return "❓"
}
