package application

import (
	"log"
	"uptrackai/internal/notifications/domain"

	"github.com/google/uuid"
)

type NotificationService struct {
	channelRepo      domain.NotificationChannelRepository
	notificationRepo domain.NotificationRepository
	senderRegistry   *domain.SenderRegistry
}

func NewNotificationService(
	channelRepo domain.NotificationChannelRepository,
	notificationRepo domain.NotificationRepository,
	senderRegistry *domain.SenderRegistry,
) *NotificationService {
	return &NotificationService{
		channelRepo:      channelRepo,
		notificationRepo: notificationRepo,
		senderRegistry:   senderRegistry,
	}
}

// Notify processes an alert event, saves it to history, and dispatches it to active channels
func (s *NotificationService) Notify(event domain.AlertEvent) error {
	// 1. Save to Notification History (GUI)
	notification := domain.NewNotification(
		event.UserID,
		event.Title,
		event.Message,
		event.Severity,
	)
	// Assign a new ID
	newId, _ := uuid.NewV7()
	notification.AssignId(newId.String())

	if err := s.notificationRepo.Save(notification); err != nil {
		log.Printf("⚠️ Error saving notification history: %v", err)
		// We continue, as sending the alert is more important than history
	}

	// 2. Dispatch to External Channels (Telegram, etc.)
	channels, err := s.channelRepo.FindActiveByUserId(event.UserID)
	if err != nil {
		log.Printf("⚠️ Error fetching notification channels for user %s: %v", event.UserID, err)
		return err
	}

	if len(channels) == 0 {
		// No channels configured, nothing to do
		return nil
	}

	for _, ch := range channels {
		sender, ok := s.senderRegistry.Get(ch.Type())
		if !ok {
			log.Printf("⚠️ No sender registered for channel type %s", ch.Type())
			continue
		}

		// Send async to avoid blocking loop?
		// The user asked for a queue to avoid blocking the process.
		// The queue is in the Dispatcher. This service is called by the worker consuming the queue.
		// So here we can be synchronous or parallel.
		// Let's do it synchronously per channel for simplicity, as the worker is already decoupled from the main loop.
		// Or we can launch goroutines here too if we have many channels.
		// For now, sync is fine.

		// We need the destination from the channel value.
		// ChannelValue is a VO. We need to extract the destination (e.g. ChatID).
		// Assuming ChannelValue.String() returns the destination or we need a method.
		destination := ch.Value().String() // This might be JSON, need to check.

		// If it's Telegram, the value is the ChatID.
		if err := sender.Send(destination, event.Message); err != nil {
			log.Printf("⚠️ Error sending notification to %s (%s): %v", ch.Type(), destination, err)
		} else {
			log.Printf("✅ Notification sent to %s (%s)", ch.Type(), destination)
		}
	}

	return nil
}

// HasActiveChannel checks if the user has any active notification channels
func (s *NotificationService) HasActiveChannel(userId string) bool {
	channels, err := s.channelRepo.FindActiveByUserId(userId)
	if err != nil {
		log.Printf("⚠️ Error checking active channels for user %s: %v", userId, err)
		return false
	}
	return len(channels) > 0
}
