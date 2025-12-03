package domain

import (
	"fmt"
	"time"
	monitoringdomain "uptrackai/internal/monitoring/domain"
)

// AlertMessage representa un mensaje de alerta de cambio de estado
type AlertMessage struct {
	targetName    string
	url           string
	previousState monitoringdomain.TargetStatus
	currentState  monitoringdomain.TargetStatus
	avgResponse   int
	timestamp     time.Time
}

func NewAlertMessage(targetName, url string, previous, current monitoringdomain.TargetStatus, avgResponse int) *AlertMessage {
	return &AlertMessage{
		targetName:    targetName,
		url:           url,
		previousState: previous,
		currentState:  current,
		avgResponse:   avgResponse,
		timestamp:     time.Now(),
	}
}

// BuildMessage genera el mensaje formateado según el tipo de cambio
func (a *AlertMessage) BuildMessage() string {
	emoji := a.getEmoji()
	severity := a.getSeverity()
	contextMsg := a.getContextMessage()

	return fmt.Sprintf("\n%s %s\n"+
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"+
		"Target: %s\n"+
		"URL: %s\n"+
		"Estado: %s → %s\n"+
		"%s\n"+
		"Hora: %s\n"+
		"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
		emoji, severity,
		a.targetName, a.url,
		a.previousState, a.currentState,
		contextMsg,
		a.timestamp.Format("15:04:05"))
}

func (a *AlertMessage) getEmoji() string {
	switch a.currentState {
	case monitoringdomain.TargetStatusDown:
		return "🔴"
	case monitoringdomain.TargetStatusDegraded:
		return "🟡"
	case monitoringdomain.TargetStatusUp:
		return "🟢"
	case monitoringdomain.TargetStatusFlapping:
		return "🟠"
	case monitoringdomain.TargetStatusUnstable:
		return "🟡"
	default:
		return "⚪"
	}
}

func (a *AlertMessage) getSeverity() string {
	switch a.currentState {
	case monitoringdomain.TargetStatusDown:
		return "ALERTA CRÍTICA"
	case monitoringdomain.TargetStatusDegraded:
		return "ADVERTENCIA"
	case monitoringdomain.TargetStatusUp:
		if a.previousState == monitoringdomain.TargetStatusDown {
			return "SERVICIO RECUPERADO"
		}
		return "PERFORMANCE NORMALIZADO"
	case monitoringdomain.TargetStatusFlapping:
		return "INESTABILIDAD DETECTADA"
	case monitoringdomain.TargetStatusUnstable:
		return "SERVICIO INESTABLE"
	default:
		return "CAMBIO DE ESTADO"
	}
}

func (a *AlertMessage) getContextMessage() string {
	switch a.currentState {
	case monitoringdomain.TargetStatusDown:
		return "⚠️  El servicio no responde. Verifica conexión y estado del servidor."
	case monitoringdomain.TargetStatusDegraded:
		return fmt.Sprintf("⏱️  Latencia elevada detectada: %dms. Posible sobrecarga o degradación.", a.avgResponse)
	case monitoringdomain.TargetStatusUp:
		if a.previousState == monitoringdomain.TargetStatusDown {
			return "✅ Servicio restaurado completamente. Monitoreo continuo activo."
		}
		return fmt.Sprintf("✅ Performance normalizado: %dms. Sistema operando correctamente.", a.avgResponse)
	case monitoringdomain.TargetStatusFlapping:
		return "🔄 Estado intermitente detectado. Revisa conectividad de red o balanceadores."
	case monitoringdomain.TargetStatusUnstable:
		return "⚡ Servicio con intermitencias pero logró estabilizarse. Requiere monitoreo cercano."
	default:
		return "Estado actualizado."
	}
}
