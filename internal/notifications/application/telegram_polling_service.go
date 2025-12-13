package application

import (
	"fmt"
	"log"
	"strings"
	"uptrackai/internal/notifications/domain"
	"uptrackai/internal/notifications/infrastructure/sender"
)

// TelegramPollingService handles incoming Telegram messages via polling
type TelegramPollingService struct {
	linkingService *TelegramLinkingService
	channelRepo    domain.NotificationChannelRepository
	telegramSender *sender.TelegramSender
}

func NewTelegramPollingService(
	linkingService *TelegramLinkingService,
	channelRepo domain.NotificationChannelRepository,
	telegramSender *sender.TelegramSender,
) *TelegramPollingService {
	return &TelegramPollingService{
		linkingService: linkingService,
		channelRepo:    channelRepo,
		telegramSender: telegramSender,
	}
}

// HandleUpdate processes a Telegram update
func (s *TelegramPollingService) HandleUpdate(update sender.TelegramUpdate) {
	// Only process messages with text
	if update.Message == nil || update.Message.Text == "" {
		return
	}

	// Check if it's a /start command with token
	if strings.HasPrefix(update.Message.Text, "/start ") {
		s.handleStartCommand(update)
		return
	}

	// Ignore other messages
}

func (s *TelegramPollingService) handleStartCommand(update sender.TelegramUpdate) {
	// Extract token from "/start TOKEN"
	parts := strings.SplitN(update.Message.Text, " ", 2)
	if len(parts) != 2 {
		return
	}

	token := strings.TrimSpace(parts[1])
	chatID := fmt.Sprintf("%d", update.Message.Chat.ID)

	log.Printf("📩 Received /start command from chat_id=%s with token=%s...", chatID, token[:10])

	// Validate and consume token
	userID, err := s.linkingService.ValidateAndConsume(token)
	if err != nil {
		log.Printf("❌ Invalid token: %v", err)
		s.sendMessage(chatID, "❌ Invalid or expired link. Please generate a new one from the app.")
		return
	}

	log.Printf("✅ Token valid for user_id=%s", userID)

	// Create NotificationChannel
	channelID := fmt.Sprintf("telegram_%s_%s", userID, chatID)
	channel, err := domain.NewNotificationChannel(channelID, userID, "TELEGRAM", chatID, 10)
	if err != nil {
		log.Printf("❌ Failed to create channel: %v", err)
		s.sendMessage(chatID, "❌ Failed to link account. Please try again.")
		return
	}

	// Save to database
	if s.channelRepo != nil {
		err = s.channelRepo.Save(channel)
		if err != nil {
			log.Printf("❌ Failed to save channel: %v", err)
			s.sendMessage(chatID, "❌ Failed to link account. Please try again.")
			return
		}
	} else {
		log.Printf("⚠️  Channel repository not available. Channel NOT saved to DB (channelID=%s)", channelID)
	}

	log.Printf("💾 Channel saved: %s", channelID)

	// Send success message
	s.sendMessage(chatID, "✅ Your Telegram account has been successfully linked! You'll now receive alerts here.")
}

func (s *TelegramPollingService) sendMessage(chatID string, message string) {
	if s.telegramSender != nil {
		err := s.telegramSender.Send(chatID, message)
		if err != nil {
			log.Printf("⚠️  Failed to send Telegram message: %v", err)
		}
	}
}
