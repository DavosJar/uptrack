package scheduler

import (
	"uptrackai/internal/monitoring/domain"
)

// SessionMetrics contiene las estadísticas calculadas de una sesión de checks
type SessionMetrics struct {
	AvgResponseTimeMs int
	MaxResponseTimeMs int // Pico máximo detectado
	TotalChecks       int
	SuccessCount      int
	FailureCount      int
	LastStatus        domain.TargetStatus
}

type MetricsCalculator struct{}

func NewMetricsCalculator() *MetricsCalculator {
	return &MetricsCalculator{}
}

// Calculate procesa los resultados crudos y genera métricas agregadas
func (m *MetricsCalculator) Calculate(session CheckSessionResult) SessionMetrics {
	if len(session.Results) == 0 {
		return SessionMetrics{LastStatus: domain.TargetStatusUnknown}
	}

	totalTimeUp := 0
	upCount := 0
	maxTime := 0
	success := 0
	failure := 0

	for _, r := range session.Results {
		rt := r.ResponseTimeMs()

		// Detectar pico máximo (incluso si falló, el tiempo es real)
		if rt > maxTime {
			maxTime = rt
		}

		if r.Status() == domain.TargetStatusUp {
			totalTimeUp += rt
			upCount++
			success++
		} else if r.Status() == domain.TargetStatusDegraded {
			// Degraded cuenta como éxito de disponibilidad, pero NO para el promedio de latencia sana
			// para evitar ensuciar la línea base con tiempos degradados.
			success++
		} else {
			failure++
		}
	}

	// Calcular promedio solo con los UP (Sanos)
	avg := 0
	if upCount > 0 {
		avg = totalTimeUp / upCount
	}

	lastStatus := session.Results[len(session.Results)-1].Status()

	return SessionMetrics{
		AvgResponseTimeMs: avg,
		MaxResponseTimeMs: maxTime,
		TotalChecks:       len(session.Results),
		SuccessCount:      success,
		FailureCount:      failure,
		LastStatus:        lastStatus,
	}
}
