package monitoring

import (
	"log"
	"time"
	"uptrackai/internal/monitoring/application"
	"uptrackai/internal/monitoring/domain"
	"uptrackai/internal/monitoring/infrastructure/postgres"
	"uptrackai/internal/monitoring/presentation"
	"uptrackai/internal/monitoring/scheduler"
	notificationApp "uptrackai/internal/notifications/application"

	"gorm.io/gorm"
)

type Module struct {
	Handler             *presentation.MonitoringHandler
	Service             *application.MonitoringApplicationService
	targetRepo          domain.MonitoringTargetRepository
	metricsRepo         domain.MetricsRepository
	checkRepo           domain.CheckResultRepository
	statsRepo           domain.TargetStatisticsRepository
	NotificationService *notificationApp.NotificationService
	Dispatcher          *scheduler.NotificationDispatcher
	Orchestrator        *scheduler.Orchestrator
}

func NewModule(db *gorm.DB, notificationService *notificationApp.NotificationService) *Module {
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

	// Initialize Notification Dispatcher
	dispatcher := scheduler.NewNotificationDispatcher(100)

	// Start Notification Consumer
	// This runs in the background and processes alerts from the monitoring system
	go func() {
		log.Println("🔔 Notification Dispatcher started")
		for event := range dispatcher.Events() {
			err := notificationService.Notify(event)
			if err != nil {
				log.Printf("❌ Error processing notification: %v", err)
			}
		}
	}()

	return &Module{
		Handler:             handler,
		Service:             service,
		targetRepo:          targetRepo,
		metricsRepo:         metricsRepo,
		checkRepo:           checkRepo,
		statsRepo:           statsRepo,
		NotificationService: notificationService,
		Dispatcher:          dispatcher,
	}
}

// StartScheduler ejecuta el scheduler oficial periódicamente
func (m *Module) StartScheduler() {
	// Crear Orchestrator una sola vez con configuración por defecto
	const TargetsPerWorker = 5
	workerCount := 4 // Default worker count, will be adjusted based on targets

	config := scheduler.OrchestratorConfig{
		WorkerCount: workerCount,
		BufferSize:  100, // Buffer suficiente para múltiples lotes
	}

	// Crear notification checker (el service implementa la interfaz)
	var notificationChecker scheduler.NotificationChecker
	if m.NotificationService != nil {
		notificationChecker = m.NotificationService
	}

	m.Orchestrator = scheduler.NewOrchestrator(
		config,
		m.targetRepo,
		m.metricsRepo,
		m.checkRepo,
		m.statsRepo,
		m.Dispatcher,
		notificationChecker,
	)

	// Iniciar workers una vez
	m.Orchestrator.Start()

	// Intervalo de ejecución del scheduler
	const SchedulerInterval = 1 * time.Minute
	ticker := time.NewTicker(SchedulerInterval)
	defer ticker.Stop()

	// Primera ejecución inmediata
	m.scheduleBatch()

	// Luego cada intervalo
	for range ticker.C {
		m.scheduleBatch()
	}
}

func (m *Module) scheduleBatch() {
	targets, err := m.targetRepo.List()
	if err != nil {
		log.Printf("❌ Error fetching targets: %v", err)
		return
	}

	if len(targets) == 0 {
		log.Println("ℹ️  No targets to monitor")
		return
	}

	// Enviar targets al orchestrator persistente (procesamiento asíncrono)
	m.Orchestrator.Schedule(targets)
	log.Printf("📤 Scheduled %d targets for monitoring", len(targets))
}
