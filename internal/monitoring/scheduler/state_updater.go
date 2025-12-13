package scheduler

import (
	"log"
	"uptrackai/internal/monitoring/domain"
)

type StateUpdater struct {
	targetRepo  domain.MonitoringTargetRepository
	metricsRepo domain.MetricsRepository
	checkRepo   domain.CheckResultRepository
}

func NewStateUpdater(
	targetRepo domain.MonitoringTargetRepository,
	metricsRepo domain.MetricsRepository,
	checkRepo domain.CheckResultRepository,
) *StateUpdater {
	return &StateUpdater{
		targetRepo:  targetRepo,
		metricsRepo: metricsRepo,
		checkRepo:   checkRepo,
	}
}

// Update actualiza el estado del target en memoria y en base de datos
func (u *StateUpdater) Update(target *domain.MonitoringTarget, newStatus domain.TargetStatus, metrics SessionMetrics) {
	// Detectar cambio de estado antes de modificar el target
	statusChanged := target.CurrentStatus() != newStatus

	// 1. Actualizar estado si hubo cambio
	if statusChanged {
		if err := target.UpdateStatus(newStatus); err != nil {
			log.Printf("⚠️  Error actualizando estado del target %s: %v", target.Name(), err)
		}
	}

	// 2. Actualizar métricas de ejecución (LastResponseTime, LastCheckedAt)
	// Esto asegura que el dashboard tenga el dato más fresco
	target.UpdateExecutionInfo(metrics.AvgResponseTimeMs)

	// 3. Persistir cambios en Target
	if _, err := u.targetRepo.Save(target); err != nil {
		log.Printf("⚠️  Error guardando target %s: %v", target.Name(), err)
	}

	// 4. Guardar métrica (para gráficas - Time Series)
	// Siempre guardamos el punto de datos para que la gráfica no tenga huecos
	metricResult := domain.NewCheckResult(
		target.ID(),
		metrics.AvgResponseTimeMs,
		newStatus != domain.TargetStatusDown,
		newStatus,
	)
	if err := u.metricsRepo.Save(metricResult); err != nil {
		log.Printf("⚠️  Error guardando métrica para %s: %v", target.Name(), err)
	}

	// 5. Guardar en historial de eventos (CheckResultRepo)
	// Solo si hubo cambio de estado, para registrar el evento en la bitácora
	if statusChanged {
		if _, err := u.checkRepo.Save(metricResult); err != nil {
			log.Printf("⚠️  Error guardando historial de estado para %s: %v", target.Name(), err)
		} else {
			log.Printf("📝 EVENTO REGISTRADO: %s cambió a %s", target.Name(), newStatus)
		}
	}
}
