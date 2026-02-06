package presentation

import (
	"net/http"
	"uptrackai/internal/app"
	"uptrackai/internal/notifications/application"
	"uptrackai/internal/server/middleware"

	"github.com/gin-gonic/gin"
)

type TelegramLinkingHandler struct {
	service *application.TelegramLinkingService
}

func NewTelegramLinkingHandler(service *application.TelegramLinkingService) *TelegramLinkingHandler {
	return &TelegramLinkingHandler{service: service}
}

func (h *TelegramLinkingHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/notifications/telegram/link", h.GenerateLink)
}

// GenerateLink creates a magic link for Telegram account linking
// @Summary Generate Telegram linking URL
// @Description Creates a secure one-time link for connecting user's Telegram account. The link expires in 15 minutes.
// @Tags notifications
// @Accept json
// @Produce json
// @Success 200 {object} app.APIResponse{data=TelegramLinkResponse} "Telegram link generated"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /notifications/telegram/link [get]
func (h *TelegramLinkingHandler) GenerateLink(c *gin.Context) {
	// Get authenticated user
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("Unauthorized", false))
		return
	}

	// Generate link
	deepLink, err := h.service.GenerateLink(string(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to generate link", false))
		return
	}

	response := TelegramLinkResponse{
		Link:      deepLink,
		ExpiresIn: 900, // 15 minutes in seconds
		Message:   "Click the link to connect your Telegram account. Works on desktop and mobile.",
	}

	c.JSON(http.StatusOK, app.BuildOKResponse("telegram_link_generated", true, response))
}

type TelegramLinkResponse struct {
	Link      string `json:"link" example:"https://t.me/Uptrackapp_bot?start=abc123..."`
	ExpiresIn int    `json:"expires_in" example:"900"`
	Message   string `json:"message" example:"Click the link to connect your Telegram account"`
}
