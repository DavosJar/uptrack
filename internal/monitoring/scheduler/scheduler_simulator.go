package scheduler

import (
	"fmt"
	"log"
	"math/rand"
	"time"
	"uptrackai/internal/monitoring/domain"
	notificationdomain "uptrackai/internal/notifications/domain"
)

// SimulatorScheduler simula un scheduler con data fake sin hacer requests HTTP reales
type SimulatorScheduler struct {
	targets                    []*domain.MonitoringTarget
	checkResultRepository      domain.CheckResultRepository
	metricsRepository          domain.MetricsRepository
	monitoringTargetRepository domain.MonitoringTargetRepository
	statisticsRepository       domain.TargetStatisticsRepository
	targetBehaviors            map[string]string // targetName -> behavior type
	executionCount             int               // Contador de ejecuciones
}

var globalExecutionCount int = 0

func NewSimulatorScheduler(
	targets []*domain.MonitoringTarget,
	checkResultRepo domain.CheckResultRepository,
	metricsRepo domain.MetricsRepository,
	targetRepo domain.MonitoringTargetRepository,
	statsRepo domain.TargetStatisticsRepository,
) *SimulatorScheduler {
	globalExecutionCount++

	// Ciclo de comportamientos que evoluciona con cada ejecución
	cycle := globalExecutionCount % 8

	var behaviors map[string]string

	switch cycle {
	case 1:
		// Ciclo 1: Mayormente estable
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "stable",
			"Legacy Database Service":     "stable",
			"User Authentication Service": "stable",
			"Notification Microservice":   "stable",
			"Analytics Engine":            "slow",
			"External Integration API":    "stable",
			"Third-Party Webhook":         "stable",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "stable",
		}
	case 2:
		// Ciclo 2: Algunos servicios empiezan a degradarse
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "slow",
			"Legacy Database Service":     "slow",
			"User Authentication Service": "slow",
			"Notification Microservice":   "stable",
			"Analytics Engine":            "slow",
			"External Integration API":    "stable",
			"Third-Party Webhook":         "stable",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "slow",
		}
	case 3:
		// Ciclo 3: Aparece inestabilidad
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "unstable",
			"Legacy Database Service":     "slow",
			"User Authentication Service": "unstable",
			"Notification Microservice":   "unstable",
			"Analytics Engine":            "slow",
			"External Integration API":    "unstable",
			"Third-Party Webhook":         "stable",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "slow",
		}
	case 4:
		// Ciclo 4: Flapping crítico
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "flapping",
			"Legacy Database Service":     "slow",
			"User Authentication Service": "flapping",
			"Notification Microservice":   "flapping",
			"Analytics Engine":            "unstable",
			"External Integration API":    "flapping",
			"Third-Party Webhook":         "flapping",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "unstable",
		}
	case 5:
		// Ciclo 5: Algunos servicios caen
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "down",
			"Legacy Database Service":     "down",
			"User Authentication Service": "flapping",
			"Notification Microservice":   "down",
			"Analytics Engine":            "slow",
			"External Integration API":    "flapping",
			"Third-Party Webhook":         "down",
			"Crashed Background Worker":   "down",
			"Failed Cache Service":        "down",
		}
	case 6:
		// Ciclo 6: Recuperación progresiva
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "unstable",
			"Legacy Database Service":     "unstable",
			"User Authentication Service": "slow",
			"Notification Microservice":   "unstable",
			"Analytics Engine":            "stable",
			"External Integration API":    "unstable",
			"Third-Party Webhook":         "unstable",
			"Crashed Background Worker":   "unstable",
			"Failed Cache Service":        "slow",
		}
	case 7:
		// Ciclo 7: Mejora continua
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "slow",
			"Legacy Database Service":     "slow",
			"User Authentication Service": "stable",
			"Notification Microservice":   "stable",
			"Analytics Engine":            "stable",
			"External Integration API":    "slow",
			"Third-Party Webhook":         "stable",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "stable",
		}
	default: // case 0
		// Ciclo 0/8: Todo vuelve a la normalidad
		behaviors = map[string]string{
			"E-Commerce Frontend":         "stable",
			"Payment Gateway API":         "stable",
			"Legacy Database Service":     "stable",
			"User Authentication Service": "stable",
			"Notification Microservice":   "stable",
			"Analytics Engine":            "stable",
			"External Integration API":    "stable",
			"Third-Party Webhook":         "stable",
			"Crashed Background Worker":   "stable",
			"Failed Cache Service":        "stable",
		}
	}

	return &SimulatorScheduler{
		targets:                    targets,
		checkResultRepository:      checkResultRepo,
		metricsRepository:          metricsRepo,
		monitoringTargetRepository: targetRepo,
		statisticsRepository:       statsRepo,
		targetBehaviors:            behaviors,
		executionCount:             globalExecutionCount,
	}
}

func (s *SimulatorScheduler) Start() {
	cycle := s.executionCount % 8
	fmt.Printf("🎭 Scheduler Simulador iniciado (data fake) - Ciclo %d/8...\n", cycle)

	for _, target := range s.targets {
		s.simulateTargetChecks(target)
	}

	fmt.Println("✅ Scheduler Simulador completado")
}

func (s *SimulatorScheduler) simulateTargetChecks(target *domain.MonitoringTarget) {
	const maxPings = 12
	results := make([]*domain.CheckResult, 0, maxPings)

	behavior := s.targetBehaviors[target.Name()]
	if behavior == "" {
		behavior = "stable" // Default
	}

	// Simular pings según comportamiento
	for i := 0; i < maxPings; i++ {
		result := s.generateFakeCheckResult(target, behavior, i)
		results = append(results, result)

		// Verificar si tenemos 3 consecutivos iguales
		if len(results) >= 3 && s.hasThreeConsecutive(results) {
			s.handleStableState(target, results)
			return
		}

		// Pausa de 5ms (simulada)
		time.Sleep(5 * time.Millisecond)
	}

	// No se lograron 3 consecutivos → FLAPPING
	s.handleFlappingState(target, results)
}

// generateFakeCheckResult genera un CheckResult fake según el comportamiento
func (s *SimulatorScheduler) generateFakeCheckResult(target *domain.MonitoringTarget, behavior string, pingIndex int) *domain.CheckResult {
	var responseTime int
	var status domain.TargetStatus
	var reachable bool

	switch behavior {
	case "stable":
		// Siempre UP, 100-300ms
		responseTime = 100 + rand.Intn(200)
		status = domain.TargetStatusUp
		reachable = true

	case "slow":
		// Siempre UP pero lento, 2000-4000ms → DEGRADED
		responseTime = 2000 + rand.Intn(2000)
		status = domain.TargetStatusUp
		reachable = true

	case "unstable":
		// Patrón: DOWN, UP, DOWN, UP, DOWN, UP, UP, UP (3 UP al final en pings 5-6-7)
		responseTime = 150 + rand.Intn(100)
		if pingIndex >= 5 && pingIndex <= 7 {
			status = domain.TargetStatusUp
			reachable = true
		} else if pingIndex%2 == 0 {
			status = domain.TargetStatusDown
			reachable = false
		} else {
			status = domain.TargetStatusUp
			reachable = true
		}

	case "flapping":
		// Alterna perfectamente: UP, DOWN, UP, DOWN... nunca 3 iguales
		responseTime = 100 + rand.Intn(150)
		if pingIndex%2 == 0 {
			status = domain.TargetStatusUp
			reachable = true
		} else {
			status = domain.TargetStatusDown
			reachable = false
		}

	case "down":
		// Siempre DOWN
		responseTime = 50 + rand.Intn(100)
		status = domain.TargetStatusDown
		reachable = false

	default:
		responseTime = 200
		status = domain.TargetStatusUp
		reachable = true
	}

	return domain.NewCheckResult(target.ID(), responseTime, reachable, status)
}

func (s *SimulatorScheduler) hasThreeConsecutive(results []*domain.CheckResult) bool {
	if len(results) < 3 {
		return false
	}

	n := len(results)
	lastThree := results[n-3 : n]

	return lastThree[0].Status() == lastThree[1].Status() &&
		lastThree[1].Status() == lastThree[2].Status()
}

func (s *SimulatorScheduler) handleStableState(target *domain.MonitoringTarget, results []*domain.CheckResult) {
	totalPings := len(results)
	confirmedStatus := results[len(results)-1].Status()

	avgResponseTime := s.calculateAvgResponseTime(results)

	// Obtener estadísticas históricas ANTES de actualizar
	historicalStats, _ := s.statisticsRepository.Get(target.ID())
	historicalAvg := historicalStats.AvgResponseTimeMs()

	s.updateStatistics(target, avgResponseTime, totalPings)

	// Guardar métrica solo si es UP estable (confirmado en ≤4 pings)
	if confirmedStatus == domain.TargetStatusUp && totalPings <= 4 {
		s.saveMetricAverage(target, avgResponseTime, confirmedStatus)
	}

	finalStatus := confirmedStatus

	// DEGRADED: Si es UP pero el tiempo de respuesta >= 2.0x del promedio histórico
	if confirmedStatus == domain.TargetStatusUp && historicalAvg > 0 && avgResponseTime >= historicalAvg*2 {
		finalStatus = domain.TargetStatusDegraded
	}

	// UNSTABLE: Si tardó entre 5-9 pings en conseguir 3 iguales
	if totalPings >= 5 && totalPings <= 9 {
		finalStatus = domain.TargetStatusUnstable
	}

	// Si cambió el estado, mostrar alerta
	if finalStatus != target.CurrentStatus() {
		alert := notificationdomain.NewAlertMessage(target.Name(), target.Url(), target.CurrentStatus(), finalStatus, avgResponseTime)
		fmt.Print(alert.BuildMessage())

		target.UpdateStatus(finalStatus)
		s.saveToSQL(target, finalStatus, results)
	} else {
		s.reportStatus(target, finalStatus, avgResponseTime)
	}
}

func (s *SimulatorScheduler) handleFlappingState(target *domain.MonitoringTarget, results []*domain.CheckResult) {
	avgResponseTime := s.calculateAvgResponseTime(results)
	s.updateStatistics(target, avgResponseTime, len(results))

	// NO guardar métrica en FLAPPING (no es estado estable)

	if domain.TargetStatusFlapping != target.CurrentStatus() {
		alert := notificationdomain.NewAlertMessage(target.Name(), target.Url(), target.CurrentStatus(), domain.TargetStatusFlapping, avgResponseTime)
		fmt.Print(alert.BuildMessage())

		target.UpdateStatus(domain.TargetStatusFlapping)
		s.saveToSQL(target, domain.TargetStatusFlapping, results)
	} else {
		s.reportStatus(target, domain.TargetStatusFlapping, avgResponseTime)
	}
}

func (s *SimulatorScheduler) calculateAvgResponseTime(results []*domain.CheckResult) int {
	if len(results) == 0 {
		return 0
	}

	total := 0
	for _, r := range results {
		total += r.ResponseTimeMs()
	}
	return total / len(results)
}

func (s *SimulatorScheduler) reportStatus(target *domain.MonitoringTarget, status domain.TargetStatus, avgResponseTime int) {
	statusEmoji := map[domain.TargetStatus]string{
		domain.TargetStatusUp:       "🟢",
		domain.TargetStatusDown:     "🔴",
		domain.TargetStatusDegraded: "🟡",
		domain.TargetStatusFlapping: "🟠",
		domain.TargetStatusUnstable: "🟡",
	}

	emoji := statusEmoji[status]
	if emoji == "" {
		emoji = "⚪"
	}

	fmt.Printf("%s %s | Estado: %s | Tiempo: %dms\n", emoji, target.Name(), status, avgResponseTime)
}

func (s *SimulatorScheduler) saveMetricAverage(target *domain.MonitoringTarget, avgResponseTime int, status domain.TargetStatus) {
	if avgResponseTime <= 0 {
		return
	}

	// Crear CheckResult con promedio
	metricResult := domain.NewCheckResult(
		target.ID(),
		avgResponseTime,
		status != domain.TargetStatusDown,
		status,
	)

	err := s.metricsRepository.Save(metricResult)
	if err != nil {
		log.Printf("⚠️  Error guardando métrica: %v", err)
	}
}

func (s *SimulatorScheduler) saveToSQL(target *domain.MonitoringTarget, status domain.TargetStatus, results []*domain.CheckResult) {
	avgResponseTime := 0
	for _, r := range results {
		avgResponseTime += r.ResponseTimeMs()
	}
	avgResponseTime /= len(results)

	// Usar el timestamp del último check para el cambio de estado
	lastCheckTimestamp := results[len(results)-1].Timestamp()

	checkResult := domain.NewFullCheckResult(
		domain.CheckResultId(""), // Se generará automáticamente en el repository
		target.ID(),
		lastCheckTimestamp, // Usar timestamp del último check
		avgResponseTime,
		status != domain.TargetStatusDown,
		status,
		"", // No error message for status changes
	)

	_, err := s.checkResultRepository.Save(checkResult)
	if err != nil {
		log.Printf("⚠️  Error guardando check result: %v", err)
		return
	}

	if _, err := s.monitoringTargetRepository.Save(target); err != nil {
		log.Printf("⚠️  Error actualizando target: %v", err)
	}
}

func (s *SimulatorScheduler) updateStatistics(target *domain.MonitoringTarget, avgResponseTime int, checksCount int) {
	stats, err := s.statisticsRepository.Get(target.ID())
	if err != nil {
		log.Printf("⚠️  Error obteniendo statistics: %v", err)
		return
	}

	stats.UpdateWithNewChecks(avgResponseTime, checksCount)

	err = s.statisticsRepository.Save(stats)
	if err != nil {
		log.Printf("⚠️  Error guardando statistics: %v", err)
	}
}
