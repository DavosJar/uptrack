package security

import (
	"uptrackai/internal/security/application"
	"uptrackai/internal/security/domain"
	"uptrackai/internal/security/infrastructure/crypto"
	"uptrackai/internal/security/infrastructure/jwt"
	"uptrackai/internal/security/presentation"
	userdomain "uptrackai/internal/user/domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Module encapsula la inicialización del dominio de seguridad
type Module struct {
	Handler               *presentation.SecurityHandler
	Service               *application.AuthService
	ExtractUserMiddleware gin.HandlerFunc
}

// NewModule inicializa todo lo relacionado con seguridad
func NewModule(db *gorm.DB, userRepo userdomain.UserRepository, credRepo domain.CredentialRepository) *Module {
	// 1. Infrastructure Services
	tokenService := jwt.NewJWTService()
	cryptoService := crypto.NewBcryptService()

	// 2. Application Service
	service := application.NewAuthService(db, userRepo, credRepo, cryptoService, tokenService)

	// 3. Handler
	handler := presentation.NewSecurityHandler(service)

	// 4. Middleware
	// Inyectamos el servicio de tokens directamente al middleware
	extractUserMiddleware := presentation.ExtractUserID(tokenService)

	return &Module{
		Handler:               handler,
		Service:               service,
		ExtractUserMiddleware: extractUserMiddleware,
	}
}
