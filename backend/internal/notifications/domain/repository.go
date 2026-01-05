package domain

// Repository interface for NotificationChannel Aggregate
type NotificationChannelRepository interface {
	// Save persists a new notification channel
	Save(channel *NotificationChannel) error

	// FindById retrieves a channel by its ID
	FindById(id ChannelId) (*NotificationChannel, error)

	// FindByUserId retrieves all channels for a specific user
	FindByUserId(userId string) ([]*NotificationChannel, error)

	// FindActiveByUserId retrieves only active channels for a user, ordered by priority (desc)
	FindActiveByUserId(userId string) ([]*NotificationChannel, error)

	// Update persists changes to an existing channel
	Update(channel *NotificationChannel) error

	// Delete removes a channel by its ID
	Delete(id ChannelId) error
}

// NotificationRepository interface for Notification Aggregate (GUI History)
type NotificationRepository interface {
	Save(notification *Notification) error
	FindById(id NotificationId) (*Notification, error)
	FindByUserId(userId string, limit int, offset int) ([]*Notification, error)
	CountUnread(userId string) (int64, error)
	MarkAsRead(id NotificationId) error
	MarkAllAsRead(userId string) error
}
