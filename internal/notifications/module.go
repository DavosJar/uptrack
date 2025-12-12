package notifications

import (
	"log"
	"os"
	"uptrackai/internal/notifications/application"
	"uptrackai/internal/notifications/domain"
	"uptrackai/internal/notifications/infrastructure/postgres"
	"uptrackai/internal/notifications/infrastructure/sender"
	"uptrackai/internal/notifications/presentation"

	"gorm.io/gorm"
)

type Module struct {
	ConfigHandler  *presentation.NotificationConfigHandler
	LinkingHandler *presentation.TelegramLinkingHandler
	WebhookHandler *presentation.TelegramWebhookHandler
	Service        *domain.NotificationService
	LinkingService *application.TelegramLinkingService
	PollingService *application.TelegramPollingService
	stopPoller     func()
}

func NewModule(db *gorm.DB) *Module {
	// 1. Setup Senders Registry
	registry := domain.NewSenderRegistry()

	telegramToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	telegramBotName := os.Getenv("TELEGRAM_BOT_NAME") // e.g., "Uptrackapp_bot"

	if telegramToken == "" {
		log.Println("⚠️  TELEGRAM_BOT_TOKEN not found. Telegram notifications disabled.")
	}

	if telegramBotName == "" {
		telegramBotName = "Uptrackapp_bot" // Default fallback
	}

	var telegramSender *sender.TelegramSender
	if telegramToken != "" {
		telegramSender = sender.NewTelegramSender(telegramToken)
		registry.Register(domain.ChannelTypeTelegram, telegramSender)
	}

	// 2. Setup Repositories
	tokenRepo := postgres.NewLinkingTokenRepository(db)
	// TODO: Implement full NotificationChannelRepository
	// For now, we'll use nil and log a warning in the polling service
	var channelRepo domain.NotificationChannelRepository = nil

	// 3. Setup Services
	linkingService := application.NewTelegramLinkingService(tokenRepo, telegramBotName)

	// Polling Service (for local development without webhook)
	var pollingService *application.TelegramPollingService
	var stopPollerFunc func()

	if telegramToken != "" && telegramSender != nil {
		pollingService = application.NewTelegramPollingService(linkingService, channelRepo, telegramSender)

		// Start polling in background if no webhook URL is configured
		webhookURL := os.Getenv("TELEGRAM_WEBHOOK_URL")
		if webhookURL == "" {
			poller := sender.NewTelegramPoller(telegramToken, pollingService.HandleUpdate)
			go poller.Start()
			stopPollerFunc = poller.Stop
			log.Println("🤖 Telegram Polling mode enabled (no webhook URL configured)")
		}
	}

	// TODO: notificationService := domain.NewNotificationService(channelRepo, registry)

	// 4. Setup Handlers
	configHandler := presentation.NewNotificationConfigHandler()
	linkingHandler := presentation.NewTelegramLinkingHandler(linkingService)
	// TODO: webhookHandler := presentation.NewTelegramWebhookHandler(linkingService, channelRepo, notificationService)

	// 5. Setup Webhook (if configured)
	webhookURL := os.Getenv("TELEGRAM_WEBHOOK_URL") // e.g., "https://yourdomain.com/api/webhooks/telegram"
	if telegramToken != "" && webhookURL != "" {
		webhookConfig := sender.NewTelegramSender(telegramToken)
		err := webhookConfig.SetWebhook(webhookURL)
		if err != nil {
			log.Printf("⚠️  Failed to set Telegram webhook: %v", err)
		} else {
			log.Println("✅ Telegram webhook configured")
		}
	}

	return &Module{
		ConfigHandler:  configHandler,
		LinkingHandler: linkingHandler,
		// WebhookHandler: webhookHandler,
		LinkingService: linkingService,
		PollingService: pollingService,
		stopPoller:     stopPollerFunc,
		// Service:        notificationService,
	}
}
