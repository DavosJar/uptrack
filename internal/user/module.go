package user

import (
	"uptrackai/internal/user/application"
	"uptrackai/internal/user/infrastructure/postgres"
	"uptrackai/internal/user/presentation"

	"gorm.io/gorm"
)

// Module encapsula la inicialización del dominio de usuarios
type Module struct {
	Handler *presentation.UserHandler
	Service *application.Service
}

// NewModule inicializa todo lo relacionado con usuarios
func NewModule(db *gorm.DB) *Module {
	userRepo := postgres.NewUserRepository(db)

	// 1. Service
	service := application.NewService(userRepo)

	// 2. Handler
	handler := presentation.NewUserHandler(service)

	return &Module{
		Handler: handler,
		Service: service,
	}
}
