package presentation

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"uptrackai/internal/app"
	"uptrackai/internal/notifications/application"
	"uptrackai/internal/notifications/domain"
	"uptrackai/internal/notifications/infrastructure/sender"

	"github.com/gin-gonic/gin"
)

type TelegramWebhookHandler struct {
	linkingService    *application.TelegramLinkingService
	channelRepository domain.NotificationChannelRepository
	telegramSender    *sender.TelegramSender
}

func NewTelegramWebhookHandler(
	linkingService *application.TelegramLinkingService,
	channelRepo domain.NotificationChannelRepository,
	telegramSender *sender.TelegramSender,
) *TelegramWebhookHandler {
	return &TelegramWebhookHandler{
		linkingService:    linkingService,
		channelRepository: channelRepo,
		telegramSender:    telegramSender,
	}
}

func (h *TelegramWebhookHandler) RegisterRoutes(router *gin.RouterGroup) {
	// Public endpoint (no auth) - Telegram will call this
	router.POST("/webhooks/telegram", h.HandleWebhook)
}

// HandleWebhook processes incoming Telegram updates
// @Summary Telegram webhook endpoint
// @Description Receives updates from Telegram Bot API (messages, commands, etc.). This endpoint is called by Telegram servers.
// @Tags webhooks
// @Accept json
// @Produce json
// @Param update body TelegramUpdate true "Telegram Update object"
// @Success 200 {object} app.APIResponse "Webhook processed successfully"
// @Failure 400 {object} app.APIResponse "Invalid update format"
// @Router /webhooks/telegram [post]
func (h *TelegramWebhookHandler) HandleWebhook(c *gin.Context) {
	log.Printf("🌐 Webhook received - processing Telegram update")

	var update TelegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		log.Printf("❌ Failed to bind webhook JSON: %v", err)
		c.JSON(http.StatusBadRequest, app.BuildErrorResponse("Invalid update format", false))
		return
	}

	log.Printf("📨 Webhook update received: %+v", update)

	// Only process messages with text (ignore photos, stickers, etc.)
	if update.Message == nil || update.Message.Text == "" {
		log.Printf("⚠️  Ignoring webhook update - no message or text")
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	log.Printf("💬 Webhook message text: %s", update.Message.Text)

	// Check if it's a /start command with token
	if strings.HasPrefix(update.Message.Text, "/start ") {
		log.Printf("🚀 Webhook detected /start command")
		h.handleStartCommand(c, update)
		return
	}

	log.Printf("🤷 Webhook ignoring non-/start message")
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *TelegramWebhookHandler) handleStartCommand(c *gin.Context, update TelegramUpdate) {
	log.Printf("🔄 Webhook handling /start command")

	// Extract token from "/start TOKEN"
	parts := strings.SplitN(update.Message.Text, " ", 2)
	if len(parts) != 2 {
		log.Printf("❌ Webhook /start command without token")
		c.JSON(http.StatusOK, gin.H{"status": "no_token"})
		return
	}

	token := strings.TrimSpace(parts[1])
	chatID := fmt.Sprintf("%d", update.Message.Chat.ID)

	log.Printf("📩 Webhook received /start command from chat_id=%s with token=%s...", chatID, token[:10]+"...")

	// Validate and consume token
	userID, err := h.linkingService.ValidateAndConsume(token)
	if err != nil {
		log.Printf("❌ Webhook invalid token: %v", err)
		// Send error message to user
		h.sendTelegramMessage(chatID, "❌ Invalid or expired link. Please generate a new one from the app.")
		c.JSON(http.StatusOK, gin.H{"status": "invalid_token"})
		return
	}

	log.Printf("✅ Webhook token valid for user_id=%s", userID)

	// Create NotificationChannel
	channelID := fmt.Sprintf("telegram_%s_%s", userID, chatID)
	log.Printf("🏗️  Webhook creating channel: %s", channelID)
	channel, err := domain.NewNotificationChannel(channelID, userID, "TELEGRAM", chatID, 10)
	if err != nil {
		log.Printf("❌ Webhook failed to create channel: %v", err)
		h.sendTelegramMessage(chatID, "❌ Failed to link account. Please try again.")
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to create channel", false))
		return
	}

	log.Printf("💾 Webhook saving channel to repository")
	// Save channel to repository
	err = h.channelRepository.Save(channel)
	if err != nil {
		log.Printf("❌ Webhook failed to save channel: %v", err)
		h.sendTelegramMessage(chatID, "❌ Failed to save channel. Please try again.")
		c.JSON(http.StatusInternalServerError, app.BuildErrorResponse("Failed to save channel", false))
		return
	}

	log.Printf("✅ Webhook channel saved successfully: %s", channelID)

	// Send success message
	log.Printf("📤 Webhook sending success message")
	h.sendTelegramMessage(chatID, "✅ Your Telegram account has been successfully linked! You'll now receive alerts here.")

	log.Printf("🎉 Webhook linking completed successfully")
	c.JSON(http.StatusOK, gin.H{"status": "linked"})
}

func (h *TelegramWebhookHandler) sendTelegramMessage(chatID string, message string) {
	log.Printf("📤 Webhook sending message to chat_id=%s: %s", chatID, message)
	// Use the TelegramSender to send the message
	if h.telegramSender != nil {
		err := h.telegramSender.Send(chatID, message)
		if err != nil {
			log.Printf("❌ Webhook failed to send message: %v", err)
		} else {
			log.Printf("✅ Webhook message sent successfully")
		}
	} else {
		log.Printf("⚠️  Webhook TelegramSender not available")
	}
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
