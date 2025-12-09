package notifications

import (
	"uptrackai/internal/notifications/presentation"

	"gorm.io/gorm"
)

type Module struct {
	Handler *presentation.NotificationConfigHandler
}

func NewModule(db *gorm.DB) *Module {
	// Por ahora no hay servicios ni repositorios reales
	handler := presentation.NewNotificationConfigHandler()

	return &Module{
		Handler: handler,
	}
}
