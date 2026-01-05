package scheduler

import (
	"fmt"
	"log"
	"uptrackai/internal/monitoring/domain"
	notificationdomain "uptrackai/internal/notifications/domain"
)

// NotificationChecker interface to check if a user has active notification channels
type NotificationChecker interface {
	HasActiveChannel(userId string) bool
}

type Orchestrator struct {
	config              OrchestratorConfig
	healthChecker       *HealthChecker
	metricsCalc         *MetricsCalculator
	resultAnalyzer      *ResultAnalyzer
	stateUpdater        *StateUpdater
	dispatcher          *NotificationDispatcher
	statsRepo           domain.TargetStatisticsRepository
	notificationChecker NotificationChecker
	severityMapper      *notificationdomain.SeverityMapper

	workerPool *WorkerPool
}

type OrchestratorConfig struct {
	WorkerCount int
	BufferSize  int
}

func NewOrchestrator(
	config OrchestratorConfig,
	targetRepo domain.MonitoringTargetRepository,
	metricsRepo domain.MetricsRepository,
	checkRepo domain.CheckResultRepository,
	statsRepo domain.TargetStatisticsRepository,
	dispatcher *NotificationDispatcher,
	notificationChecker NotificationChecker,
) *Orchestrator {
	orch := &Orchestrator{
		config:              config,
		healthChecker:       NewHealthChecker(),
		metricsCalc:         NewMetricsCalculator(),
		resultAnalyzer:      NewResultAnalyzer(),
		stateUpdater:        NewStateUpdater(targetRepo, metricsRepo, checkRepo),
		dispatcher:          dispatcher,
		statsRepo:           statsRepo,
		notificationChecker: notificationChecker,
		severityMapper:      notificationdomain.NewSeverityMapper(),
	}

	// Create worker pool with processing function
	workerPoolConfig := WorkerPoolConfig{
		WorkerCount: config.WorkerCount,
		BufferSize:  config.BufferSize,
	}
	orch.workerPool = NewWorkerPool(workerPoolConfig, orch.processTarget)

	return orch
}

// Start inicia el pool de workers
func (o *Orchestrator) Start() {
	o.workerPool.Start()
}

// Stop detiene el orchestrator y espera a que terminen los workers
func (o *Orchestrator) Stop() {
	log.Println("Deteniendo Scheduler Orchestrator...")
	o.workerPool.Stop()
	log.Println("Scheduler Orchestrator detenido")
}

// Schedule agrega una lista de targets para ser procesados
func (o *Orchestrator) Schedule(targets []*domain.MonitoringTarget) {
	o.workerPool.SubmitBatch(targets)
}

func (o *Orchestrator) processTarget(target *domain.MonitoringTarget) {
	// 1. Health Check
	session := o.healthChecker.Check(target)

	// 2. Calcular Métricas
	metrics := o.metricsCalc.Calculate(session)

	// 3. Obtener Histórico (para análisis)
	historical, err := o.statsRepo.Get(target.ID())
	if err != nil {
		// Si falla, usamos uno vacío para no detener el proceso
		historical = domain.NewTargetStatistics(target.ID())
	}

	// 4. Analizar Resultados
	newStatus := o.resultAnalyzer.Analyze(session, metrics, historical)

	// Capturar estado previo para detectar cambios (Eventos)
	previousStatus := target.CurrentStatus()

	// 5. Actualizar Estado (DB & Memoria)
	o.stateUpdater.Update(target, newStatus, metrics)

	// 6. Actualizar Estadísticas Históricas (Async o Sync?)
	// Lo hacemos aquí sync por simplicidad, pero podría ser otro job
	checkInterval := target.Configuration().CheckIntervalSeconds()
	if checkInterval <= 0 {
		checkInterval = 300
	}

	const WINDOW_DAYS = 7
	const SECONDS_IN_DAY = 86400
	maxChecks := (WINDOW_DAYS * SECONDS_IN_DAY) / checkInterval

	// 1. Calcular nuevo promedio (Matemática pura)
	// Solo actualizamos el promedio si la sesión fue estable y rápida (<= 4 pings)
	// Si tomó más pings (ej. 7), el sistema está inestable y no debe ensuciar la línea base.
	currentAvg := historical.AvgResponseTimeMs()
	newAvg := currentAvg

	if metrics.TotalChecks <= 4 {
		newAvg = domain.CalculateNewAverage(
			currentAvg,
			historical.TotalChecksCount(),
			metrics.AvgResponseTimeMs,
			1, // 1 Check Session
		)
	}

	// 2. Actualizar estado (Mutación)
	historical.UpdateState(newAvg, maxChecks)
	_ = o.statsRepo.Save(historical)

	// 7. Notificar si es necesario
	if o.notificationChecker != nil && o.notificationChecker.HasActiveChannel(target.UserId().String()) {
		newSeverity := o.severityMapper.Map(string(newStatus))
		prevSeverity := o.severityMapper.Map(string(previousStatus))

		message := fmt.Sprintf("Target %s is now %s", target.Name(), newStatus)

		event := notificationdomain.NewAlertEvent(
			target.UserId().String(),
			"Status Change: "+target.Name(),
			message,
			newSeverity,
			prevSeverity,
			"Target: "+target.Name(),
			notificationdomain.AlertTypeMonitoring,
			map[string]string{
				"url":           target.Url(),
				"response_time": fmt.Sprintf("%dms", metrics.AvgResponseTimeMs),
			},
		)

		if event.ShouldNotify() {
			if o.dispatcher != nil {
				o.dispatcher.Dispatch(*event)
				log.Printf("📢 ALERT DISPATCHED | Target: %s | Severity: %s", target.Name(), newSeverity)
			}
		}
	}

	// 8. Log de Transición de Estado (Solo si hubo cambio relevante)
	// Si el estado cambió, imprimimos la transición clara: PREV -> NEW
	// Esto valida que la lógica de detección funciona, independientemente de si se notifica o no.
	if previousStatus != newStatus {
		log.Printf("🔄 STATE_CHANGE | Target: %s (%s) | %s ➡️  %s | Time: %dms",
			target.Name(), target.Url(), previousStatus, newStatus, metrics.AvgResponseTimeMs)
	}
}

// RunBatch ejecuta un lote de targets de manera asíncrona
func (o *Orchestrator) RunBatch(targets []*domain.MonitoringTarget) {
	// Enviar trabajos de manera asíncrona
	o.Schedule(targets)

	// NO esperamos - los workers procesan en background
	// El próximo ciclo del scheduler vendrá en el intervalo configurado
}
