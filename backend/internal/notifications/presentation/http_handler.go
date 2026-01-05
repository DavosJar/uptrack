package presentation

import (
	"net/http"
	"sort"
	"time"
	"uptrackai/internal/app"
	"uptrackai/internal/notifications/domain"
	"uptrackai/internal/server/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationConfigHandler struct {
	channelRepo domain.NotificationChannelRepository
}

func NewNotificationConfigHandler(channelRepo domain.NotificationChannelRepository) *NotificationConfigHandler {
	return &NotificationConfigHandler{channelRepo: channelRepo}
}

func (h *NotificationConfigHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/notifications/methods", h.GetNotificationMethods)
	router.GET("/notifications/methods/:id", h.GetNotificationMethod)
	router.POST("/notifications/methods", h.CreateNotificationMethod)
	router.GET("/notifications/channels", h.GetNotificationChannels)
}

// GetNotificationMethods retorna la lista de métodos de notificación del usuario
func (h *NotificationConfigHandler) GetNotificationMethods(c *gin.Context) {
	// Validar autenticación
	_, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("Unauthorized", false))
		return
	}

	// Mock Data
	mockData := []NotificationMethodResponse{
		{
			ID:        uuid.New().String(),
			Type:      "SLACK",
			Value:     "https://hooks.slack.com/services/...",
			Priority:  5,
			IsActive:  false,
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID:        uuid.New().String(),
			Type:      "TELEGRAM",
			Value:     "123456789",
			Priority:  10,
			IsActive:  true,
			CreatedAt: time.Now(),
		},
	}

	// Ordenar por prioridad descendente (mayor prioridad primero)
	sort.Slice(mockData, func(i, j int) bool {
		return mockData[i].Priority > mockData[j].Priority
	})

	response := app.BuildOKResponse("notification_methods_retrieved", true, mockData).
		WithLink("self", "/api/v1/notifications/methods").
		WithLink("create", "/api/v1/notifications/methods")

	c.JSON(http.StatusOK, response)
}

// GetNotificationMethod retorna un método de notificación específico
func (h *NotificationConfigHandler) GetNotificationMethod(c *gin.Context) {
	id := c.Param("id")

	// Mock Data
	mockData := NotificationMethodResponse{
		ID:        id,
		Type:      "TELEGRAM",
		Value:     "123456789",
		Priority:  10,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	response := app.BuildOKResponse("notification_method_retrieved", true, mockData).
		WithLink("self", "/api/v1/notifications/methods/"+id).
		WithLink("list", "/api/v1/notifications/methods")

	c.JSON(http.StatusOK, response)
}

// CreateNotificationMethod crea un nuevo método de notificación
func (h *NotificationConfigHandler) CreateNotificationMethod(c *gin.Context) {
	var req CreateNotificationMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, app.BuildErrorResponse("Invalid request body", false))
		return
	}

	// Mock Response
	mockResponse := NotificationMethodResponse{
		ID:        uuid.New().String(),
		Type:      req.Type,
		Value:     req.Value,
		Priority:  req.Priority,
		IsActive:  true,
		CreatedAt: time.Now(),
	}

	response := app.BuildOKResponse("notification_method_created", true, mockResponse).
		WithLink("self", "/api/v1/notifications/methods/"+mockResponse.ID).
		WithLink("list", "/api/v1/notifications/methods")

	c.JSON(http.StatusCreated, response)
}

// GetNotificationChannels retorna los canales de notificación del usuario
func (h *NotificationConfigHandler) GetNotificationChannels(c *gin.Context) {
	// Validar autenticación
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("Unauthorized", false))
		return
	}

	if h.channelRepo == nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Channel repository not available", false))
		return
	}

	channels, err := h.channelRepo.FindByUserId(string(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to fetch channels", false))
		return
	}

	// Convert to response format
	var channelResponses []NotificationChannelResponse
	for _, ch := range channels {
		channelResponses = append(channelResponses, NotificationChannelResponse{
			ID:       ch.ID().String(),
			UserID:   ch.UserID(),
			Type:     ch.Type().String(),
			Value:    ch.Value().String(),
			Priority: ch.Priority().Int(),
			IsActive: ch.IsActive(),
		})
	}

	response := app.BuildOKResponse("channels_retrieved", true, channelResponses)
	c.JSON(http.StatusOK, response)
}

type NotificationChannelResponse struct {
	ID       string `json:"id"`
	UserID   string `json:"user_id"`
	Type     string `json:"type"`
	Value    string `json:"value"`
	Priority int    `json:"priority"`
	IsActive bool   `json:"is_active"`
}
