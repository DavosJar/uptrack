package security

import (
	"uptrackai/internal/security/application"
	"uptrackai/internal/security/infrastructure/crypto"
	"uptrackai/internal/security/infrastructure/jwt"
	"uptrackai/internal/security/infrastructure/postgres"
	"uptrackai/internal/security/presentation"
	userpostgres "uptrackai/internal/user/infrastructure/postgres"

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
func NewModule(db *gorm.DB) *Module {
	userRepo := userpostgres.NewUserRepository(db)
	credRepo := postgres.NewCredentialRepository(db)

	tokenService := jwt.NewJWTService()
	cryptoService := crypto.NewBcryptService()

	service := application.NewAuthService(db, userRepo, credRepo, cryptoService, tokenService)

	handler := presentation.NewSecurityHandler(service)

	extractUserMiddleware := presentation.ExtractUserID(tokenService)

	return &Module{
		Handler:               handler,
		Service:               service,
		ExtractUserMiddleware: extractUserMiddleware,
	}
}
