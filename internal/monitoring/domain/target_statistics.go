package domain

// TargetStatistics - Value object para estadísticas computadas
type TargetStatistics struct {
	targetId          TargetId
	avgResponseTimeMs int
	totalChecksCount  int
}

func NewTargetStatistics(targetId TargetId) *TargetStatistics {
	return &TargetStatistics{
		targetId:          targetId,
		avgResponseTimeMs: 0,
		totalChecksCount:  0,
	}
}

func NewFullTargetStatistics(targetId TargetId, avgResponseTimeMs int, totalChecksCount int) *TargetStatistics {
	return &TargetStatistics{
		targetId:          targetId,
		avgResponseTimeMs: avgResponseTimeMs,
		totalChecksCount:  totalChecksCount,
	}
}

// Getters
func (s *TargetStatistics) TargetId() TargetId {
	return s.targetId
}

func (s *TargetStatistics) AvgResponseTimeMs() int {
	return s.avgResponseTimeMs
}

func (s *TargetStatistics) TotalChecksCount() int {
	return s.totalChecksCount
}

// UpdateWithNewChecks actualiza las estadísticas con nuevos checks
func (s *TargetStatistics) UpdateWithNewChecks(newAvgResponseTime int, newChecksCount int, checkIntervalSeconds int) {
	// Si no hay muestras válidas de tiempo de respuesta (ej. todo fue DOWN o DEGRADED),
	// no actualizamos el promedio histórico para no corromper la línea base de "sistema sano".
	if newAvgResponseTime <= 0 {
		return
	}

	// Definimos una ventana de tiempo relevante para el promedio histórico: 7 días.
	const WINDOW_DAYS = 7
	const SECONDS_IN_DAY = 86400

	// Evitar división por cero
	if checkIntervalSeconds <= 0 {
		checkIntervalSeconds = 300 // Default 5 min
	}

	// Calcular MAX_CHECKS dinámicamente basado en la configuración del target
	// MAX_CHECKS = (7 días * segundos/día) / intervalo_segundos
	maxChecks := (WINDOW_DAYS * SECONDS_IN_DAY) / checkIntervalSeconds

	if s.totalChecksCount == 0 {
		// Arranque en frío
		s.avgResponseTimeMs = newAvgResponseTime
		s.totalChecksCount = newChecksCount
	} else if s.totalChecksCount < maxChecks {
		// Fase de acumulación: promedio ponderado
		pesoHistorico := float64(s.totalChecksCount) / float64(s.totalChecksCount+newChecksCount)
		pesoNuevo := float64(newChecksCount) / float64(s.totalChecksCount+newChecksCount)

		s.avgResponseTimeMs = int(float64(s.avgResponseTimeMs)*pesoHistorico + float64(newAvgResponseTime)*pesoNuevo)
		s.totalChecksCount += newChecksCount

		// Cap totalChecksCount at maxChecks
		if s.totalChecksCount > maxChecks {
			s.totalChecksCount = maxChecks
		}
	} else {
		// Fase estable: Ventana deslizante
		// El peso de los nuevos datos es proporcional a su tamaño respecto a la ventana total.
		// ratio = newChecks / maxChecks
		ratio := float64(newChecksCount) / float64(maxChecks)
		if ratio > 1.0 {
			ratio = 1.0
		}

		// EMA: NewAvg = OldAvg * (1 - ratio) + NewVal * ratio
		s.avgResponseTimeMs = int(float64(s.avgResponseTimeMs)*(1.0-ratio) + float64(newAvgResponseTime)*ratio)

		// Mantenemos el contador en el máximo para indicar que la ventana está llena
		s.totalChecksCount = maxChecks
	}
}
