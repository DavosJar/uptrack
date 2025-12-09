package user

import (
	"uptrackai/internal/user/application"
	"uptrackai/internal/user/domain"
	"uptrackai/internal/user/presentation"
)

// Module encapsula la inicialización del dominio de usuarios
type Module struct {
	Handler *presentation.UserHandler
	Service *application.Service
}

// NewModule inicializa todo lo relacionado con usuarios
// Recibe las dependencias necesarias (repositorios, etc)
func NewModule(userRepo domain.UserRepository) *Module {
	// 1. Service
	service := application.NewService(userRepo)

	// 2. Handler
	handler := presentation.NewUserHandler(service)

	return &Module{
		Handler: handler,
		Service: service,
	}
}
