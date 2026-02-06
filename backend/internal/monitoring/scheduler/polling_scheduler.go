package scheduler

import (
	"log"
	"net"
	"os"
	"sync"
	"time"
	"uptrackai/internal/monitoring/domain"
)

type PollingScheduler struct {
	targetRepo   domain.MonitoringTargetRepository
	orchestrator *Orchestrator
	inFlight     sync.Map
	stopChan     chan struct{}
}

// TriggerImmediateCheck schedules a target for immediate execution
func (s *PollingScheduler) TriggerImmediateCheck(target *domain.MonitoringTarget) {
	// Verificar si ya está siendo procesado
	if _, loading := s.inFlight.LoadOrStore(target.ID(), true); loading {
		log.Printf("⚠️ Skip Immediate Check for %s (Already in flight)", target.Name())
		return
	}

	// Double check connectivity before submitting
	if !s.verifyConnectivity() {
		s.inFlight.Delete(target.ID()) // Liberar lock
		log.Printf("⚠️ Skip Immediate Check for %s (No Internet)", target.Name())
		return
	}

	log.Printf("⚡ Immediate Check Triggered for target: %s", target.Name())

	// Enviar al orquestador (Worker Pool)
	// Como el WorkerPool acepta batch, le pasamos un slice de 1.
	s.orchestrator.Schedule([]*domain.MonitoringTarget{target})
}

func NewPollingScheduler(
	targetRepo domain.MonitoringTargetRepository,
	orchestrator *Orchestrator,
) *PollingScheduler {
	s := &PollingScheduler{
		targetRepo:   targetRepo,
		orchestrator: orchestrator,
		stopChan:     make(chan struct{}),
	}

	// Register callback to clear in-flight status when a task is done
	orchestrator.SetOnProcessingComplete(s.markComplete)

	return s
}

func (s *PollingScheduler) markComplete(targetId domain.TargetId) {
	s.inFlight.Delete(targetId)
}

// Start initiates the polling loop
// It runs in a separate goroutine, so it's non-blocking
func (s *PollingScheduler) Start() {
	log.Println("🚀 Polling Scheduler iniciado (Intervalo check: 10s)")

	// Iniciar el Orchestrator (workers)
	s.orchestrator.Start()

	go s.runLoop()
}

func (s *PollingScheduler) Stop() {
	close(s.stopChan)
	s.orchestrator.Stop()
}

func (s *PollingScheduler) runLoop() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.processDueTargets()
		case <-s.stopChan:
			return
		}
	}
}

func (s *PollingScheduler) processDueTargets() {
	// 0. SELF-CHECK: Verificar conectividad propia
	if !s.verifyConnectivity() {
		log.Println("🛑 SELF-DOWN DETECTADO: Sin conexión a internet. Pausando monitoreo para evitar falsos positivos.")
		return
	}

	// Optimización: Usamos GetDueTargets que filtra por SQL (NextCheckAt <= Now)
	dueTargetsFromDB, err := s.targetRepo.GetDueTargets()
	if err != nil {
		log.Printf("❌ Error al listar targets para scheduling: %v", err)
		return
	}

	now := time.Now()
	var finalDueTargets []*domain.MonitoringTarget

	for _, t := range dueTargetsFromDB {
		// 1. Double check de NextCheckAt en memoria (por si acaso o lógica extra)
		nextCheck := t.NextCheckAt()
		if nextCheck.After(now) {
			// Esto indicaría que la DB trajo algo que en memoria se ve futuro.
			// Puede pasar si el reloj de la DB y la App están desfasados o si el mapeo falló.
			// log.Printf("⚠️ Target %s filtrado en memoria (NextCheck: %v > Now)", t.Name(), nextCheck)
			continue
		}

		// 2. Verificar coordinación (evitar race conditions/doble check)
		if _, loaded := s.inFlight.LoadOrStore(t.ID(), now); loaded {
			continue
		}

		finalDueTargets = append(finalDueTargets, t)
	}

	if len(finalDueTargets) > 0 {
		// Loguear solo si hay actividad para no spammear
		log.Printf("📅 Scheduling %d targets (Total Due DB: %d)...", len(finalDueTargets), len(dueTargetsFromDB))
		s.orchestrator.Schedule(finalDueTargets)
	}
}

func (s *PollingScheduler) verifyConnectivity() bool {
	// Si SKIP_CONNECTIVITY_CHECK está habilitado, no hacer la comprobación
	if os.Getenv("SKIP_CONNECTIVITY_CHECK") == "true" {
		log.Println("⚠️ SKIP_CONNECTIVITY_CHECK habilitado: Omitiendo verificación de conectividad.")
		return true // No comprobar, continuar sin verificación
	}

	// Ping Google DNS as a simple connectivity check
	conn, err := net.DialTimeout("tcp", "8.8.8.8:53", 2*time.Second)
	log.Printf("🌐 Conectividad verificada: %v", err == nil)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}
