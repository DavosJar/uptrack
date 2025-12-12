package presentation

import (
	"fmt"
	"net/http"
	"strings"
	"uptrackai/internal/app"
	"uptrackai/internal/notifications/application"
	"uptrackai/internal/notifications/domain"

	"github.com/gin-gonic/gin"
)

type TelegramWebhookHandler struct {
	linkingService      *application.TelegramLinkingService
	channelRepository   domain.NotificationChannelRepository
	notificationService *domain.NotificationService
}

func NewTelegramWebhookHandler(
	linkingService *application.TelegramLinkingService,
	channelRepo domain.NotificationChannelRepository,
	notificationService *domain.NotificationService,
) *TelegramWebhookHandler {
	return &TelegramWebhookHandler{
		linkingService:      linkingService,
		channelRepository:   channelRepo,
		notificationService: notificationService,
	}
}

func (h *TelegramWebhookHandler) RegisterRoutes(router *gin.RouterGroup) {
	// Public endpoint (no auth) - Telegram will call this
	router.POST("/webhooks/telegram", h.HandleWebhook)
}

// HandleWebhook processes incoming Telegram updates
// @Summary Telegram webhook endpoint
// @Description Receives updates from Telegram Bot API (messages, commands, etc.)
// @Tags webhooks
// @Accept json
// @Produce json
// @Param update body TelegramUpdate true "Telegram Update"
// @Success 200 {object} app.SuccessResponse
// @Router /webhooks/telegram [post]
func (h *TelegramWebhookHandler) HandleWebhook(c *gin.Context) {
	var update TelegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, app.BuildErrorResponse("Invalid update format", false))
		return
	}

	// Only process messages with text (ignore photos, stickers, etc.)
	if update.Message == nil || update.Message.Text == "" {
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	// Check if it's a /start command with token
	if strings.HasPrefix(update.Message.Text, "/start ") {
		h.handleStartCommand(c, update)
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *TelegramWebhookHandler) handleStartCommand(c *gin.Context, update TelegramUpdate) {
	// Extract token from "/start TOKEN"
	parts := strings.SplitN(update.Message.Text, " ", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusOK, gin.H{"status": "no_token"})
		return
	}

	token := strings.TrimSpace(parts[1])
	chatID := fmt.Sprintf("%d", update.Message.Chat.ID)

	// Validate and consume token
	userID, err := h.linkingService.ValidateAndConsume(token)
	if err != nil {
		// Send error message to user
		h.sendTelegramMessage(chatID, "❌ Invalid or expired link. Please generate a new one from the app.")
		c.JSON(http.StatusOK, gin.H{"status": "invalid_token"})
		return
	}

	// Create NotificationChannel
	channelID := fmt.Sprintf("telegram_%s_%s", userID, chatID)
	_, err = domain.NewNotificationChannel(channelID, userID, "TELEGRAM", chatID, 10)
	if err != nil {
		h.sendTelegramMessage(chatID, "❌ Failed to link account. Please try again.")
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to create channel", false))
		return
	}

	// TODO: Save channel to repository
	// h.channelRepository.Save(channel)

	// Send success message
	h.sendTelegramMessage(chatID, "✅ Your Telegram account has been successfully linked! You'll now receive alerts here.")

	c.JSON(http.StatusOK, gin.H{"status": "linked"})
}

func (h *TelegramWebhookHandler) sendTelegramMessage(chatID string, message string) {
	// Use the NotificationService to send the message
	// This will use the TelegramSender already configured in the registry
	_ = h.notificationService.SendNotification(chatID, message)
}

// Telegram API Types (simplified)
type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message"`
}

type TelegramMessage struct {
	MessageID int           `json:"message_id"`
	From      *TelegramUser `json:"from"`
	Chat      *TelegramChat `json:"chat"`
	Date      int64         `json:"date"`
	Text      string        `json:"text"`
}

type TelegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type TelegramChat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}
