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
	channelRepo      domain.NotificationChannelRepository
	notificationRepo domain.NotificationRepository
}

func NewNotificationConfigHandler(
	channelRepo domain.NotificationChannelRepository,
	notificationRepo domain.NotificationRepository,
) *NotificationConfigHandler {
	return &NotificationConfigHandler{
		channelRepo:      channelRepo,
		notificationRepo: notificationRepo,
	}
}

func (h *NotificationConfigHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/notifications/methods", h.GetNotificationMethods)
	router.GET("/notifications/methods/:id", h.GetNotificationMethod)
	router.POST("/notifications/methods", h.CreateNotificationMethod)
	router.GET("/notifications/channels", h.GetNotificationChannels)

	// New endpoints for in-app notifications
	router.GET("/notifications/history", h.GetNotifications)
	router.GET("/notifications/history/:id", h.GetNotification)
	router.PUT("/notifications/:id/read", h.MarkAsRead)
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

// GetNotifications returns the history of notifications for the user
func (h *NotificationConfigHandler) GetNotifications(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("Unauthorized", false))
		return
	}

	if h.notificationRepo == nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Notification repository not available", false))
		return
	}

	// Default limit 50, offset 0
	notifications, err := h.notificationRepo.FindByUserId(string(userID), 50, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to fetch notifications", false))
		return
	}

	var responseData []NotificationResponse
	for _, n := range notifications {
		responseData = append(responseData, NotificationResponse{
			ID:        string(n.ID()),
			Title:     n.Title(),
			Message:   n.Message(),
			Severity:  string(n.Severity()),
			IsRead:    n.IsRead(),
			CreatedAt: n.CreatedAt().Format(time.RFC3339),
		})
	}

	response := app.BuildOKResponse("notifications_retrieved", true, responseData)
	c.JSON(http.StatusOK, response)
}

func (h *NotificationConfigHandler) GetNotification(c *gin.Context) {
	id := c.Param("id")
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("Unauthorized", false))
		return
	}

	if h.notificationRepo == nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Repo not available", false))
		return
	}

	notification, err := h.notificationRepo.FindById(domain.NotificationId(id))
	if err != nil {
		c.JSON(http.StatusNotFound, app.BuildErrorResponse("Notification not found", false))
		return
	}

	if notification.UserID() != string(userID) {
		c.JSON(http.StatusForbidden, app.BuildErrorResponse("Forbidden", false))
		return
	}

	responseData := NotificationResponse{
		ID:        string(notification.ID()),
		Title:     notification.Title(),
		Message:   notification.Message(),
		Severity:  string(notification.Severity()),
		IsRead:    notification.IsRead(),
		CreatedAt: notification.CreatedAt().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, app.BuildOKResponse("notification_retrieved", true, responseData))
}

// MarkAsRead marks a notification as read
func (h *NotificationConfigHandler) MarkAsRead(c *gin.Context) {
	id := c.Param("id")

	if h.notificationRepo == nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Repo not available", false))
		return
	}

	err := h.notificationRepo.MarkAsRead(domain.NotificationId(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to mark as read", false))
		return
	}

	c.JSON(http.StatusOK, app.BuildOKResponse("notification_marked_read", true, nil))
}

type NotificationChannelResponse struct {
	ID       string `json:"id"`
	UserID   string `json:"user_id"`
	Type     string `json:"type"`
	Value    string `json:"value"`
	Priority int    `json:"priority"`
	IsActive bool   `json:"is_active"`
}
