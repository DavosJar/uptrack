package scheduler

import (
	"log"
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
