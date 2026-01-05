package scheduler

import (
	"net/http"
	"time"
	"uptrackai/internal/monitoring/domain"
)

// CheckSessionResult contiene los resultados crudos de una sesión de verificación
type CheckSessionResult struct {
	TargetID    domain.TargetId
	Results     []*domain.CheckResult
	Stable      bool // True si se encontraron 3 consecutivos iguales
	TotalChecks int
}

type HealthChecker struct {
	// Podríamos inyectar un cliente HTTP custom si quisiéramos mockear
}

func NewHealthChecker() *HealthChecker {
	return &HealthChecker{}
}

// Check ejecuta la estrategia de "Ping hasta estabilidad"
// Realiza hasta 12 pings buscando 3 estados consecutivos iguales.
func (h *HealthChecker) Check(target *domain.MonitoringTarget) CheckSessionResult {
	const maxPings = 12
	results := make([]*domain.CheckResult, 0, maxPings)

	// Configurar cliente con timeout específico del target
	client := &http.Client{
		Timeout: time.Duration(target.Configuration().TimeoutSeconds()) * time.Second,
	}

	for i := 0; i < maxPings; i++ {
		result := h.performSingleCheck(client, target)
		results = append(results, result)

		// Verificar estabilidad (3 consecutivos iguales)
		if h.hasThreeConsecutive(results) {
			return CheckSessionResult{
				TargetID: target.ID(),
				Results:  results,
				Stable:   true,
			}
		}

		// Pequeña pausa entre pings para no saturar (hardcoded por ahora, podría ser config)
		time.Sleep(30 * time.Millisecond)
	}

	// Si llegamos aquí, no hubo estabilidad en 12 intentos
	return CheckSessionResult{
		TargetID: target.ID(),
		Results:  results,
		Stable:   false,
	}
}

func (h *HealthChecker) performSingleCheck(client *http.Client, target *domain.MonitoringTarget) *domain.CheckResult {
	start := time.Now()

	resp, err := client.Get(target.Url())
	elapsed := int(time.Since(start).Milliseconds())

	if err != nil {
		return domain.NewCheckResultWithError(target.ID(), elapsed, err.Error())
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

	// Reachable es true si no es error de red y status < 500 (aunque 500 es reachable técnicamente, depende de la def)
	// En el código original: reachable := resp.StatusCode < 500
	reachable := resp.StatusCode < 500

	return domain.NewCheckResult(target.ID(), elapsed, reachable, status)
}

func (h *HealthChecker) hasThreeConsecutive(results []*domain.CheckResult) bool {
	if len(results) < 3 {
		return false
	}
	n := len(results)
	lastThree := results[n-3 : n]

	return lastThree[0].Status() == lastThree[1].Status() &&
		lastThree[1].Status() == lastThree[2].Status()
}
