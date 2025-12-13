package main

import (
	"fmt"
	monitoringdomain "uptrackai/internal/monitoring/domain"
	"uptrackai/internal/monitoring/scheduler"
	userdomain "uptrackai/internal/user/domain"
)

// --- Mocks ---

type InMemoryTargetRepo struct {
	targets map[monitoringdomain.TargetId]*monitoringdomain.MonitoringTarget
}

func NewInMemoryTargetRepo() *InMemoryTargetRepo {
	return &InMemoryTargetRepo{targets: make(map[monitoringdomain.TargetId]*monitoringdomain.MonitoringTarget)}
}

func (r *InMemoryTargetRepo) Save(target *monitoringdomain.MonitoringTarget) (*monitoringdomain.MonitoringTarget, error) {
	r.targets[target.ID()] = target
	fmt.Printf("💾 [DB] Target guardado: %s | Estado: %s | LastChecked: %s\n", target.Name(), target.CurrentStatus(), target.LastCheckedAt().Format("15:04:05"))
	return target, nil
}
func (r *InMemoryTargetRepo) List() ([]*monitoringdomain.MonitoringTarget, error) { return nil, nil }
func (r *InMemoryTargetRepo) ListByUserAndRole(userID userdomain.UserId, role string) ([]*monitoringdomain.MonitoringTarget, error) {
	return nil,
		nil
}
func (r *InMemoryTargetRepo) GetByID(id monitoringdomain.TargetId) (*monitoringdomain.MonitoringTarget, error) {
	return r.targets[id], nil
}

// --- Simulator ---

func main() {
	fmt.Println("🚀 Iniciando Simulador del Scheduler (Real HTTP Requests)...")

	// 1. Setup Repos & Components
	targetRepo := NewInMemoryTargetRepo()

	healthChecker := scheduler.NewHealthChecker()
	metricsCalc := scheduler.NewMetricsCalculator()
	resultAnalyzer := scheduler.NewResultAnalyzer()
	stateUpdater := scheduler.NewStateUpdater(targetRepo, nil, nil)

	// 2. Definir Escenarios Reales usando httpbin.org
	scenarios := []struct {
		name string
		url  string
		desc string
	}{
		{
			name: "Google (Stable UP)",
			url:  "https://www.google.com",
			desc: "Debería ser UP y rápido",
		},
		{
			name: "HttpBin 200 (Stable UP)",
			url:  "https://httpbin.org/status/200",
			desc: "Debería ser UP",
		},
		{
			name: "HttpBin 500 (Stable DOWN)",
			url:  "https://httpbin.org/status/500",
			desc: "Debería ser DOWN (Error 500)",
		},
		{
			name: "HttpBin Delay 2s (Degraded/Timeout)",
			url:  "https://httpbin.org/delay/2",
			desc: "Debería ser DEGRADED si el histórico es bajo, o UP lento",
		},
	}

	userId, _ := userdomain.NewUserId("user-1")

	for _, sc := range scenarios {
		fmt.Printf("\n--------------------------------------------------\n")
		fmt.Printf("🧪 Escenario: %s\n", sc.name)
		fmt.Printf("📝 Descripción: %s\n", sc.desc)
		fmt.Printf("🔗 URL: %s\n", sc.url)
		fmt.Printf("--------------------------------------------------\n")

		// Crear Target
		target := monitoringdomain.NewMinimalMonitoringTarget(
			sc.name,
			sc.url,
			monitoringdomain.TargetTypeAPI,
			userId,
		)

		// Configuración: Timeout 5s para permitir el delay de 2s
		config := monitoringdomain.NewCheckConfiguration(5, 3, 1, 60)
		target.UpdateConfiguration(config)
		targetRepo.Save(target)

		runCycle(target, healthChecker, metricsCalc, resultAnalyzer, stateUpdater)
	}
}

func runCycle(
	target *monitoringdomain.MonitoringTarget,
	checker *scheduler.HealthChecker,
	calc *scheduler.MetricsCalculator,
	analyzer *scheduler.ResultAnalyzer,
	updater *scheduler.StateUpdater,
) {
	// A. Health Check
	fmt.Print("1. Checking Health... ")
	sessionResult := checker.Check(target)
	fmt.Printf("Done. Stable: %v, Pings: %d\n", sessionResult.Stable, len(sessionResult.Results))

	// B. Metrics
	metrics := calc.Calculate(sessionResult)
	fmt.Printf("2. Metrics Calculated: Avg=%dms, Max=%dms, Success=%d, Fail=%d\n",
		metrics.AvgResponseTimeMs, metrics.MaxResponseTimeMs, metrics.SuccessCount, metrics.FailureCount)

	// C. Analysis
	// Simulamos estadísticas históricas sanas (100ms) para ver si detecta degradación en el caso de delay
	historicalStats := monitoringdomain.NewFullTargetStatistics(target.ID(), 100, 1000)

	newStatus := analyzer.Analyze(sessionResult, metrics, historicalStats)
	fmt.Printf("3. Analysis Result: %s (Previous: %s)\n", newStatus, target.CurrentStatus())

	// D. Update State
	updater.Update(target, newStatus, metrics)
	fmt.Println("4. State Updated.")
}
