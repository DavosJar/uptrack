package main

import (
	"fmt"
	"log"

	"uptrackai/config"
	_ "uptrackai/docs" // This is required for swagger
	"uptrackai/internal/monitoring"
	"uptrackai/internal/notifications"
	"uptrackai/internal/security"
	"uptrackai/internal/user"

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
	//config.SeedMonitoringTargets(db) // Seed temporal para testing

	// 2. Inicializar Módulos (Application & Infrastructure)
	monitoringModule := monitoring.NewModule(db)
	securityModule := security.NewModule(db)
	userModule := user.NewModule(db)
	notificationsModule := notifications.NewModule(db)

	// 3. HTTP Server en goroutine separada
	go config.StartHTTPServer("8080",
		monitoringModule.Handler,
		securityModule.Handler,
		userModule.Handler,
		notificationsModule.ConfigHandler,
		notificationsModule.LinkingHandler,
		// TODO: Add WebhookHandler when channel repository is ready
		// notificationsModule.WebhookHandler,
	)

	// 4. Scheduler bloquea el main thread
	monitoringModule.StartScheduler()
}
