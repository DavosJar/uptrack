package config

import (
	"log"
	"time"
	"uptrackai/internal/monitoring/scheduler"
)

// RunScheduler ejecuta el scheduler oficial periódicamente
// El scheduler real debe ejecutarse cada 5 minutos (intervalo de monitoreo en producción)
func RunScheduler(repos *Repositories) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// Primera ejecución inmediata
	executeScheduler(repos)

	// Luego cada 5 minutos
	for range ticker.C {
		executeScheduler(repos)
	}
}

func executeScheduler(repos *Repositories) {
	targets, err := repos.TargetRepo.List()
	if err != nil {
		log.Printf("❌ Error fetching targets: %v", err)
		return
	}

	s := scheduler.NewScheduler(
		targets,
		repos.CheckRepo,
		repos.MetricsRepo,
		repos.TargetRepo,
		repos.StatsRepo,
	)
	s.Start()
}
