package monitoring

import (
	"log"
	"time"
	"uptrackai/internal/monitoring/application"
	"uptrackai/internal/monitoring/domain"
	"uptrackai/internal/monitoring/infrastructure/postgres"
	"uptrackai/internal/monitoring/presentation"
	"uptrackai/internal/monitoring/scheduler"

	"gorm.io/gorm"
)

type Module struct {
	Handler     *presentation.MonitoringHandler
	Service     *application.MonitoringApplicationService
	targetRepo  domain.MonitoringTargetRepository
	metricsRepo domain.MetricsRepository
	checkRepo   domain.CheckResultRepository
	statsRepo   domain.TargetStatisticsRepository
}

func NewModule(db *gorm.DB) *Module {
	targetRepo := postgres.NewPostgresMonitoringTargetRepository(db)
	metricsRepo := postgres.NewPostgresMetricsRepository(db)
	checkRepo := postgres.NewPostgresCheckResultRepository(db)
	statsRepo := postgres.NewPostgresTargetStatisticsRepository(db)

	service := application.NewMonitoringApplicationService(
		targetRepo,
		metricsRepo,
		checkRepo,
		statsRepo,
	)

	handler := presentation.NewMonitoringHandler(service)

	return &Module{
		Handler:     handler,
		Service:     service,
		targetRepo:  targetRepo,
		metricsRepo: metricsRepo,
		checkRepo:   checkRepo,
		statsRepo:   statsRepo,
	}
}

// StartScheduler ejecuta el scheduler oficial periódicamente
func (m *Module) StartScheduler() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	// Primera ejecución inmediata
	m.executeScheduler()

	// Luego cada 5 minutos
	for range ticker.C {
		m.executeScheduler()
	}
}

func (m *Module) executeScheduler() {
	targets, err := m.targetRepo.List()
	if err != nil {
		log.Printf("❌ Error fetching targets: %v", err)
		return
	}

	s := scheduler.NewScheduler(
		targets,
		m.checkRepo,
		m.metricsRepo,
		m.targetRepo,
		m.statsRepo,
	)
	s.Start()
}
