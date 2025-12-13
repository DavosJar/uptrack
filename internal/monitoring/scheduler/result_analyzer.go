package scheduler

import (
	"uptrackai/internal/monitoring/domain"
)

type ResultAnalyzer struct{}

func NewResultAnalyzer() *ResultAnalyzer {
	return &ResultAnalyzer{}
}

// Analyze determina el estado final del target basado en la sesión actual y el histórico
func (a *ResultAnalyzer) Analyze(
	session CheckSessionResult,
	metrics SessionMetrics,
	historical *domain.TargetStatistics,
) domain.TargetStatus {

	// 1. Si no hubo estabilidad (no se consiguieron 3 iguales en 12 intentos) -> FLAPPING
	if !session.Stable {
		return domain.TargetStatusFlapping
	}

	// 2. Estado base confirmado (el de los 3 iguales)
	finalStatus := metrics.LastStatus

	// 3. Regla de Degradación de Performance
	// Si es UP pero lento (> 3x promedio histórico) -> DEGRADED
	// EXCEPCIÓN: Si el tiempo actual es muy bajo (ej: < 200ms), no consideramos degradación
	// para evitar falsos positivos en sistemas hiper-rápidos (ej: 10ms -> 25ms).
	const MinLatencyThreshold = 200 // ms

	if finalStatus == domain.TargetStatusUp {
		historicalAvg := historical.AvgResponseTimeMs()

		// Solo marcamos DEGRADED si supera el TRIPLE del histórico Y ADEMÁS supera el umbral mínimo perceptible
		if historicalAvg > 0 && metrics.AvgResponseTimeMs >= historicalAvg*3 && metrics.AvgResponseTimeMs > MinLatencyThreshold {
			finalStatus = domain.TargetStatusDegraded
		}
	}

	// 4. Regla de Inestabilidad (Costó estabilizarse)
	// Si tardó entre 5 y 9 pings en conseguir 3 iguales -> UNSTABLE
	// (Menos de 5 es normal/rápido, más de 9 es casi flapping pero lo logró)
	if session.TotalChecks >= 5 && session.TotalChecks <= 9 {
		finalStatus = domain.TargetStatusUnstable
	}

	return finalStatus
}
