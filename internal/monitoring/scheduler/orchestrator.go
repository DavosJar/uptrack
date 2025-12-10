package scheduler

import (
	"log"
	"sync"
	"uptrackai/internal/monitoring/domain"
)

type Orchestrator struct {
	config         OrchestratorConfig
	healthChecker  *HealthChecker
	metricsCalc    *MetricsCalculator
	resultAnalyzer *ResultAnalyzer
	stateUpdater   *StateUpdater
	dispatcher     *NotificationDispatcher
	statsRepo      domain.TargetStatisticsRepository

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
	statsRepo domain.TargetStatisticsRepository,
	dispatcher *NotificationDispatcher,
) *Orchestrator {
	return &Orchestrator{
		config:         config,
		healthChecker:  NewHealthChecker(),
		metricsCalc:    NewMetricsCalculator(),
		resultAnalyzer: NewResultAnalyzer(),
		stateUpdater:   NewStateUpdater(targetRepo),
		dispatcher:     dispatcher,
		statsRepo:      statsRepo,
		jobQueue:       make(chan *domain.MonitoringTarget, config.BufferSize),
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

func (o *Orchestrator) worker(_ int) {
	defer o.wg.Done()
	// log.Printf("Worker %d iniciado", id)

	for target := range o.jobQueue {
		o.processTarget(target)
	}
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

	// 5. Actualizar Estado (DB & Memoria)
	o.stateUpdater.Update(target, newStatus, metrics)

	// 6. Actualizar Estadísticas Históricas (Async o Sync?)
	// Lo hacemos aquí sync por simplicidad, pero podría ser otro job
	checkInterval := target.Configuration().CheckIntervalSeconds()
	historical.UpdateWithNewChecks(metrics.AvgResponseTimeMs, metrics.TotalChecks, checkInterval)
	_ = o.statsRepo.Save(historical)

	// 7. Notificar si es necesario (Logic pending integration with SeverityMapper)
	// TODO: Integrar SeverityMapper y NotificationDispatcher aquí
}
