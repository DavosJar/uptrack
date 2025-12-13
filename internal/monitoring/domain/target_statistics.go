package domain

// TargetStatistics - Value object para estadísticas computadas
type TargetStatistics struct {
	targetId          TargetId
	avgResponseTimeMs int
	totalChecksCount  int // Total de checks realizados (Monotónico)
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

// UpdateState actualiza el estado de las estadísticas con valores ya calculados
// La matemática se delega a StatisticsCalculator
func (s *TargetStatistics) UpdateState(newAvgResponseTime int, maxChecks int) {
	if newAvgResponseTime > 0 {
		s.avgResponseTimeMs = newAvgResponseTime
	}

	// Solo incrementamos el contador si no hemos llegado al máximo (ventana deslizante)
	if s.totalChecksCount < maxChecks {
		s.totalChecksCount++
	}
}
