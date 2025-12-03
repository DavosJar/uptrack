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
func (s *TargetStatistics) UpdateWithNewChecks(newAvgResponseTime int, newChecksCount int) {
	const MAX_CHECKS = 1080 // 72 horas * 12 ciclos/hora * 3 checks = ~1080

	if s.totalChecksCount == 0 {
		// Arranque en frío: usar directamente los nuevos checks
		s.avgResponseTimeMs = newAvgResponseTime
		s.totalChecksCount = newChecksCount
	} else if s.totalChecksCount < MAX_CHECKS {
		// Fase de acumulación: promedio ponderado
		pesoHistorico := float64(s.totalChecksCount) / float64(s.totalChecksCount+newChecksCount)
		pesoNuevo := float64(newChecksCount) / float64(s.totalChecksCount+newChecksCount)

		s.avgResponseTimeMs = int(float64(s.avgResponseTimeMs)*pesoHistorico + float64(newAvgResponseTime)*pesoNuevo)
		s.totalChecksCount += newChecksCount
	} else {
		// Fase estable: EMA con alpha = 0.997 (~99.3% peso histórico)
		alpha := 0.997
		s.avgResponseTimeMs = int(float64(s.avgResponseTimeMs)*alpha + float64(newAvgResponseTime)*(1-alpha))
		// total_checks_count ya no crece
	}
}
