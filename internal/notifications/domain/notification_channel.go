package domain

import "time"

// Entity: NotificationChannel
type NotificationChannel struct {
	channelId string
	userId    string // Relación con User - propietario del canal
	address   string
	isActive  bool
	createdAt time.Time
}

// NewNotificationChannel crea una nueva instancia de NotificationChannel
func NewNotificationChannel(channelId string, userId string, address string) (*NotificationChannel, error) {
	if channelId == "" {
		return nil, ErrChannelIdEmpty
	}
	if userId == "" {
		return nil, ErrChannelIdEmpty
	}
	if address == "" {
		return nil, ErrAddressEmpty
	}

	return &NotificationChannel{
		channelId: channelId,
		userId:    userId,
		address:   address,
		isActive:  true,
		createdAt: time.Now(),
	}, nil
}

// Getters
func (n *NotificationChannel) ChannelId() string {
	return n.channelId
}

func (n *NotificationChannel) UserId() string {
	return n.userId
}

func (n *NotificationChannel) Address() string {
	return n.address
}

func (n *NotificationChannel) IsActive() bool {
	return n.isActive
}

func (n *NotificationChannel) CreatedAt() time.Time {
	return n.createdAt
}

// Business methods
func (n *NotificationChannel) Activate() {
	n.isActive = true
}

func (n *NotificationChannel) Deactivate() {
	n.isActive = false
}

func (n *NotificationChannel) UpdateAddress(newAddress string) error {
	if newAddress == "" {
		return ErrAddressEmpty
	}
	n.address = newAddress
	return nil
}

func (n *NotificationChannel) BelongsTo(userId string) bool {
	return n.userId == userId
}
