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
	// Intervalo de ejecución del scheduler (Modificar aquí a voluntad)
	const SchedulerInterval = 1 * time.Minute
	ticker := time.NewTicker(SchedulerInterval)
	defer ticker.Stop()

	// Primera ejecución inmediata
	m.executeScheduler()

	// Luego cada intervalo
	for range ticker.C {
		m.executeScheduler()
	}
}

// DummyNotificationChecker para cumplir con la interfaz cuando no hay repo real
type DummyNotificationChecker struct{}

func (d *DummyNotificationChecker) HasActiveChannel(userId string) bool {
	// Por ahora retornamos false para probar la alerta en consola
	return false
}

func (m *Module) executeScheduler() {
	targets, err := m.targetRepo.List()
	if err != nil {
		log.Printf("❌ Error fetching targets: %v", err)
		return
	}

	// Configuración dinámica del pool
	// TargetsPerWorker = 1 -> Modo "Hilo por Target" (Máxima velocidad, mayor consumo de recursos)
	// TargetsPerWorker = 5 -> Modo "Pool Balanceado" (Recomendado para producción)
	const TargetsPerWorker = 1
	workerCount := (len(targets) + TargetsPerWorker - 1) / TargetsPerWorker
	if workerCount == 0 {
		workerCount = 1
	}

	config := scheduler.OrchestratorConfig{
		WorkerCount: workerCount,
		BufferSize:  len(targets),
	}

	// Usar Orchestrator en lugar del Scheduler legacy
	orch := scheduler.NewOrchestrator(
		config,
		m.targetRepo,
		m.metricsRepo,
		m.checkRepo,
		m.statsRepo,
		nil, // Dispatcher (nil por ahora)
		&DummyNotificationChecker{},
	)

	// Ejecutar lote y medir tiempo (log incluido en RunBatch)
	orch.RunBatch(targets)
}
