package scheduler

import (
	"fmt"
	"log"
	"net/http"
	"time"
	"uptrackai/internal/monitoring/domain"
	notificationdomain "uptrackai/internal/notifications/domain"
)

type Scheduler struct {
	targets                    []*domain.MonitoringTarget
	checkResultRepository      domain.CheckResultRepository
	metricsRepository          domain.MetricsRepository
	monitoringTargetRepository domain.MonitoringTargetRepository
	statisticsRepository       domain.TargetStatisticsRepository
}

func NewScheduler(
	targets []*domain.MonitoringTarget,
	checkResultRepo domain.CheckResultRepository,
	metricsRepo domain.MetricsRepository,
	targetRepo domain.MonitoringTargetRepository,
	statsRepo domain.TargetStatisticsRepository,
) *Scheduler {
	return &Scheduler{
		targets:                    targets,
		checkResultRepository:      checkResultRepo,
		metricsRepository:          metricsRepo,
		monitoringTargetRepository: targetRepo,
		statisticsRepository:       statsRepo,
	}
}

// Start inicia el scheduler que pingea cada target hasta conseguir 3 iguales o máximo 12 intentos
func (s *Scheduler) Start() {
	fmt.Println("🚀 Scheduler iniciado...")

	for _, target := range s.targets {
		s.checkTargetUntilStable(target)
	}

	fmt.Println("✅ Scheduler completado")
}

func (s *Scheduler) checkTargetUntilStable(target *domain.MonitoringTarget) {
	const maxPings = 12
	results := make([]*domain.CheckResult, 0, maxPings)

	// Hacer pings hasta conseguir 3 iguales consecutivos o llegar al límite
	for i := 0; i < maxPings; i++ {
		result := s.performCheck(target)
		results = append(results, result)

		// Verificar si tenemos 3 consecutivos iguales
		if len(results) >= 3 && s.hasThreeConsecutive(results) {
			s.handleStableState(target, results)
			return
		}

		// Pausa de 30ms antes del siguiente ping
		time.Sleep(30 * time.Millisecond)
	}

	// No se lograron 3 consecutivos en 12 pings → FLAPPING
	s.handleFlappingState(target, results)
}

// hasThreeConsecutive verifica si los últimos 3 checks tienen el mismo estado
func (s *Scheduler) hasThreeConsecutive(results []*domain.CheckResult) bool {
	if len(results) < 3 {
		return false
	}

	n := len(results)
	lastThree := results[n-3 : n]

	return lastThree[0].Status() == lastThree[1].Status() &&
		lastThree[1].Status() == lastThree[2].Status()
}

// handleStableState procesa cuando se consiguen 3 checks consecutivos iguales
func (s *Scheduler) handleStableState(target *domain.MonitoringTarget, results []*domain.CheckResult) {
	totalPings := len(results)
	confirmedStatus := results[len(results)-1].Status()

	// Calcular promedio de respuesta
	avgResponseTime := s.calculateAvgResponseTime(results)

	// Obtener estadísticas históricas ANTES de actualizar
	historicalStats, _ := s.statisticsRepository.Get(target.ID())
	historicalAvg := historicalStats.AvgResponseTimeMs()

	// Actualizar estadísticas
	s.updateStatistics(target, avgResponseTime, totalPings)

	// Guardar métrica solo si es UP estable (confirmado en ≤4 pings)
	if confirmedStatus == domain.TargetStatusUp && totalPings <= 4 {
		s.saveMetricAverage(target, avgResponseTime, confirmedStatus)
	}

	// Determinar el estado final basado en cuántos pings tomó
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
		// Caso especial: primer chequeo (UNKNOWN -> cualquier estado)
		if target.CurrentStatus() == domain.TargetStatusUnknown {
			s.reportWelcomeMessage(target, finalStatus, avgResponseTime)
		} else {
			alert := notificationdomain.NewAlertMessage(target.Name(), target.Url(), target.CurrentStatus(), finalStatus, avgResponseTime)
			fmt.Print(alert.BuildMessage())
		}

		target.UpdateStatus(finalStatus)
		s.saveToSQL(target, finalStatus, results)
	} else {
		s.reportStatus(target, finalStatus, avgResponseTime)
	}
}

// handleFlappingState procesa cuando NO se consiguen 3 iguales en 12 intentos
func (s *Scheduler) handleFlappingState(target *domain.MonitoringTarget, results []*domain.CheckResult) {
	avgResponseTime := s.calculateAvgResponseTime(results)

	// Actualizar estadísticas
	s.updateStatistics(target, avgResponseTime, len(results))

	// NO guardar métrica en FLAPPING (no es estado estable)

	// Cambiar a FLAPPING
	if domain.TargetStatusFlapping != target.CurrentStatus() {
		// Caso especial: primer chequeo (UNKNOWN -> FLAPPING)
		if target.CurrentStatus() == domain.TargetStatusUnknown {
			s.reportWelcomeMessage(target, domain.TargetStatusFlapping, avgResponseTime)
		} else {
			alert := notificationdomain.NewAlertMessage(target.Name(), target.Url(), target.CurrentStatus(), domain.TargetStatusFlapping, avgResponseTime)
			fmt.Print(alert.BuildMessage())
		}

		target.UpdateStatus(domain.TargetStatusFlapping)
		s.saveToSQL(target, domain.TargetStatusFlapping, results)
	} else {
		s.reportStatus(target, domain.TargetStatusFlapping, avgResponseTime)
	}
}

// calculateAvgResponseTime calcula el promedio de tiempo de respuesta
func (s *Scheduler) calculateAvgResponseTime(results []*domain.CheckResult) int {
	if len(results) == 0 {
		return 0
	}

	total := 0
	for _, r := range results {
		total += r.ResponseTimeMs()
	}
	return total / len(results)
}

func (s *Scheduler) reportStatus(target *domain.MonitoringTarget, status domain.TargetStatus, avgResponseTime int) {
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

func (s *Scheduler) reportWelcomeMessage(target *domain.MonitoringTarget, status domain.TargetStatus, avgResponseTime int) {
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

	fmt.Printf("\n┌─────────────────────────────────────────────────────────────┐\n")
	fmt.Printf("│ ✅ NUEVO TARGET CONFIRMADO                                  │\n")
	fmt.Printf("├─────────────────────────────────────────────────────────────┤\n")
	fmt.Printf("│ Nombre: %-50s │\n", target.Name())
	fmt.Printf("│ URL:    %-50s │\n", target.Url())
	fmt.Printf("│ Estado: %s %-47s │\n", emoji, status)
	fmt.Printf("│ Tiempo: %-47dms │\n", avgResponseTime)
	fmt.Printf("└─────────────────────────────────────────────────────────────┘\n\n")
}

func (s *Scheduler) performCheck(target *domain.MonitoringTarget) *domain.CheckResult {
	start := time.Now()
	id := target.ID()
	client := &http.Client{
		Timeout: time.Duration(target.Configuration().TimeoutSeconds()) * time.Second,
	}

	resp, err := client.Get(target.Url())
	elapsed := int(time.Since(start).Milliseconds())

	if err != nil {
		return domain.NewCheckResultWithError(id, elapsed, err.Error())
	}
	defer resp.Body.Close()

	var status domain.TargetStatus
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		status = domain.TargetStatusUp
	} else if resp.StatusCode >= 500 {
		status = domain.TargetStatusDown
	} else {
		status = domain.TargetStatusDegraded
	}

	reachable := resp.StatusCode < 500

	return domain.NewCheckResult(id, elapsed, reachable, status)
}

// saveMetricAverage guarda UNA métrica con el promedio calculado (no pings individuales)
func (s *Scheduler) saveMetricAverage(target *domain.MonitoringTarget, avgResponseTime int, status domain.TargetStatus) {
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

// saveToSQL guarda cambio de estado confirmado
func (s *Scheduler) saveToSQL(target *domain.MonitoringTarget, status domain.TargetStatus, results []*domain.CheckResult) {
	avgResponseTime := 0
	for _, r := range results {
		avgResponseTime += r.ResponseTimeMs()
	}
	avgResponseTime /= len(results)

	// Usar el timestamp del último check para el cambio de estado
	lastCheckTimestamp := results[len(results)-1].Timestamp()

	// Crear CheckResult con promedio de los 3 checks y timestamp correcto
	checkResult := domain.NewFullCheckResult(
		domain.CheckResultId(""), // Se generará automáticamente en el repository
		target.ID(),
		lastCheckTimestamp, // Usar timestamp del último check
		avgResponseTime,
		status != domain.TargetStatusDown,
		status,
		"", // No error message for status changes
	)

	// Guardar cambio de estado en check_results
	_, err := s.checkResultRepository.Save(checkResult)
	if err != nil {
		log.Printf("⚠️  Error guardando check result: %v", err)
		return
	}

	// Actualizar el target en la base de datos con nuevo status
	if _, err := s.monitoringTargetRepository.Save(target); err != nil {
		log.Printf("⚠️  Error actualizando target: %v", err)
	}
}

// updateStatistics actualiza las estadísticas del target con nuevos checks
func (s *Scheduler) updateStatistics(target *domain.MonitoringTarget, avgResponseTime int, checksCount int) {
	// Obtener estadísticas actuales
	stats, err := s.statisticsRepository.Get(target.ID())
	if err != nil {
		log.Printf("⚠️  Error obteniendo statistics: %v", err)
		return
	}

	// Actualizar con nuevos datos (lógica de ponderación en domain)
	// Calcular maxChecks basado en política de 7 días
	const WINDOW_DAYS = 7
	const SECONDS_IN_DAY = 86400
	checkInterval := target.Configuration().CheckIntervalSeconds()
	if checkInterval <= 0 {
		checkInterval = 300 // Fallback default 5 min
	}
	maxChecks := (WINDOW_DAYS * SECONDS_IN_DAY) / checkInterval

	// 1. Calcular nuevo promedio (Matemática pura)
	// Solo actualizamos el promedio si la sesión fue estable y rápida (<= 4 pings)
	currentAvg := stats.AvgResponseTimeMs()
	newAvg := currentAvg

	if checksCount <= 4 {
		newAvg = domain.CalculateNewAverage(
			currentAvg,
			stats.TotalChecksCount(),
			avgResponseTime,
			1, // 1 Check Session
		)
	}

	// 2. Actualizar estado (Mutación)
	stats.UpdateState(newAvg, maxChecks)

	// Guardar en DB
	err = s.statisticsRepository.Save(stats)
	if err != nil {
		log.Printf("⚠️  Error guardando statistics: %v", err)
	}
}
