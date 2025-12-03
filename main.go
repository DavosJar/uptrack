package main

import (
	"fmt"
	"log"

	"uptrackai/config"
	_ "uptrackai/docs" // This is required for swagger
	"uptrackai/internal/monitoring/application"
	"uptrackai/internal/monitoring/presentation"
	sec "uptrackai/internal/security"
	sechand "uptrackai/internal/security/presentation"

	"github.com/joho/godotenv"
)

// @title UpTrackAI API
// @version 1.0
// @description API for monitoring targets and managing users
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Cargar .env si existe (opcional, no falla si no existe)
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  Archivo .env no encontrado, usando variables de entorno del sistema")
	}

	// 1. Inicializar infraestructura
	db, err := config.InitDatabase()
	if err != nil {
		panic(fmt.Sprintf("❌ Error conectando a la base de datos: %v\nVerifica que PostgreSQL esté corriendo y las variables de entorno estén configuradas correctamente.", err))
	}

	config.RunMigrations(db)
	config.SeedMonitoringTargets(db) // Seed temporal para testing

	// 2. Inicializar repositorios (capa de infraestructura)
	repos := config.InitRepositories(db)

	// 3. Inicializar application services (capa de aplicación)
	monitoringAppService := application.NewMonitoringApplicationService(
		repos.TargetRepo,
		repos.MetricsRepo,
		repos.CheckRepo,
		repos.StatsRepo,
	)

	// Security: service + handler (sigue el mismo estándar de handlers)
	authService := sec.NewAuthService(db, repos.UserRepo, repos.CredentialRepo)
	securityHandler := sechand.NewSecurityHandler(authService)

	// 4. Inicializar handlers (capa de presentación)
	monitoringHandler := presentation.NewMonitoringHandler(monitoringAppService)
	// 5. HTTP Server en goroutine separada
	go config.StartHTTPServer("8080", monitoringHandler, securityHandler)

	// 6. Scheduler bloquea el main thread
	config.RunScheduler(repos)
}
