package presentation

import "time"

// NotificationMethodResponse representa un método de notificación en la respuesta HTTP
type NotificationMethodResponse struct {
	ID        string    `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Type      string    `json:"type" example:"TELEGRAM"` // TELEGRAM, SLACK
	Value     string    `json:"value" example:"123456789"`
	Priority  int       `json:"priority" example:"10"`
	IsActive  bool      `json:"is_active" example:"true"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateNotificationMethodRequest representa la petición para crear un método de notificación
type CreateNotificationMethodRequest struct {
	Type     string `json:"type" binding:"required,oneof=TELEGRAM SLACK" example:"TELEGRAM"`
	Value    string `json:"value" binding:"required" example:"123456789"`
	Priority int    `json:"priority" binding:"required,min=1,max=10" example:"10"`
}

// NotificationResponse representa una notificación en la interfaz
type NotificationResponse struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Severity  string `json:"severity"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}
