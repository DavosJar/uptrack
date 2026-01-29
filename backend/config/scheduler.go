package config

import (
	"log"
	"uptrackai/internal/monitoring/scheduler"
)

// RunScheduler ejecuta el sistema de monitoreo (Coordinator & Scheduler)
func RunScheduler(repos *Repositories) {
	log.Println("⚙️  Configurando Sistema de Monitoreo...")

	// 1. Configurar Dispatcher de Notificaciones
	dispatcher := scheduler.NewNotificationDispatcher(100)
	// TODO: Iniciar aquí también el worker que consume del dispatcher

	// 2. Configurar Orchestrator (Worker Pool)
	orchConfig := scheduler.OrchestratorConfig{
		WorkerCount: 10,  // Podemos ajustar según CPU
		BufferSize:  100, // Buffer de trabajos pendientes
	}

	orchestrator := scheduler.NewOrchestrator(
		orchConfig,
		repos.TargetRepo,
		repos.MetricsRepo,
		repos.CheckRepo,
		repos.StatsRepo,
		dispatcher,
		nil, // TODO: Inyectar NotificationChecker real
	)

	// 3. Iniciar Polling Scheduler (La parte que "tickea" cada 10s)
	pollingScheduler := scheduler.NewPollingScheduler(repos.TargetRepo, orchestrator)

	// Start es no-bloqueante (lanza goroutines)
	pollingScheduler.Start()

	log.Println("✅ Sistema de Monitoreo corriendo.")

	// Mantener el hilo principal vivo (si este método se corre como goroutine en main, esto bloquea esa goroutine)
	select {}
}
