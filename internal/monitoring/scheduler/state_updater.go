package scheduler

import (
	"log"
	"uptrackai/internal/monitoring/domain"
)

type StateUpdater struct {
	targetRepo domain.MonitoringTargetRepository
}

func NewStateUpdater(targetRepo domain.MonitoringTargetRepository) *StateUpdater {
	return &StateUpdater{
		targetRepo: targetRepo,
	}
}

// Update actualiza el estado del target en memoria y en base de datos
func (u *StateUpdater) Update(target *domain.MonitoringTarget, newStatus domain.TargetStatus, metrics SessionMetrics) {
	// 1. Actualizar estado si hubo cambio
	if target.CurrentStatus() != newStatus {
		if err := target.UpdateStatus(newStatus); err != nil {
			log.Printf("⚠️  Error actualizando estado del target %s: %v", target.Name(), err)
		}
	}

	// 2. Actualizar métricas de ejecución (LastResponseTime, LastCheckedAt)
	// Esto asegura que el dashboard tenga el dato más fresco
	target.UpdateExecutionInfo(metrics.AvgResponseTimeMs)

	// 3. Persistir cambios
	if _, err := u.targetRepo.Save(target); err != nil {
		log.Printf("⚠️  Error guardando target %s: %v", target.Name(), err)
	}
}
