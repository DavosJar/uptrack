package scheduler

import (
	"log"
	"sync"
	"time"
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

	jobQueue chan *domain.MonitoringTarget
	wg       sync.WaitGroup
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
	return &Orchestrator{
		config:              config,
		healthChecker:       NewHealthChecker(),
		metricsCalc:         NewMetricsCalculator(),
		resultAnalyzer:      NewResultAnalyzer(),
		stateUpdater:        NewStateUpdater(targetRepo, metricsRepo, checkRepo),
		dispatcher:          dispatcher,
		statsRepo:           statsRepo,
		notificationChecker: notificationChecker,
		severityMapper:      notificationdomain.NewSeverityMapper(),
		jobQueue:            make(chan *domain.MonitoringTarget, config.BufferSize),
	}
}

// Start inicia el pool de workers y queda listo para recibir trabajos
func (o *Orchestrator) Start() {
	log.Printf("🚀 Iniciando Scheduler Orchestrator con %d workers", o.config.WorkerCount)

	for i := 0; i < o.config.WorkerCount; i++ {
		o.wg.Add(1)
		go o.worker(i)
	}
}

// Stop detiene el orchestrator y espera a que terminen los workers
func (o *Orchestrator) Stop() {
	close(o.jobQueue)
	o.wg.Wait()
	log.Println("🛑 Scheduler Orchestrator detenido")
}

// Schedule agrega una lista de targets para ser procesados
func (o *Orchestrator) Schedule(targets []*domain.MonitoringTarget) {
	go func() {
		for _, t := range targets {
			o.jobQueue <- t
		}
	}()
}

func (o *Orchestrator) worker(id int) {
	defer o.wg.Done()
	start := time.Now()
	processedCount := 0

	for target := range o.jobQueue {
		o.processTarget(target)
		processedCount++
	}

	duration := time.Since(start)
	// Log de rendimiento por worker
	log.Printf("👷 WORKER_FINISH | ID: %d | Processed: %d | Duration: %v", id, processedCount, duration)
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

	// 7. Notificar si es necesario (Logic pending integration with SeverityMapper)
	// TODO: Integrar SeverityMapper y NotificationDispatcher aquí

	// 8. Log de Transición de Estado (Solo si hubo cambio relevante)
	// Si el estado cambió, imprimimos la transición clara: PREV -> NEW
	// Esto valida que la lógica de detección funciona, independientemente de si se notifica o no.
	if previousStatus != newStatus {
		log.Printf("🔄 STATE_CHANGE | Target: %s (%s) | %s ➡️  %s | Time: %dms",
			target.Name(), target.Url(), previousStatus, newStatus, metrics.AvgResponseTimeMs)
	}
}

// RunBatch ejecuta un lote de targets y espera a que terminen
func (o *Orchestrator) RunBatch(targets []*domain.MonitoringTarget) {
	start := time.Now()
	o.Start()

	// Enviar trabajos
	for _, t := range targets {
		o.jobQueue <- t
	}

	// Cerrar cola y esperar workers
	o.Stop()
	duration := time.Since(start)

	// Log de tiempo de ejecución del pool
	log.Printf("POOL_EXECUTION | Targets: %d | Workers: %d | Duration: %v",
		len(targets), o.config.WorkerCount, duration)
}
