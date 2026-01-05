package domain

import (
	"time"
)

// Aggregate Root: NotificationChannel
// Represents a configured notification method for a user (e.g., a specific Telegram chat or Slack webhook)
type NotificationChannel struct {
	id        ChannelId
	userId    string // Reference to the User Aggregate
	chType    ChannelType
	value     ChannelValue // The actual configuration (URL, ID, etc.)
	priority  Priority
	isActive  bool
	createdAt time.Time
	updatedAt time.Time
}

// NewNotificationChannel Factory
func NewNotificationChannel(
	id string,
	userId string,
	chType string,
	value string,
	priority int,
) (*NotificationChannel, error) {
	// 1. Create and Validate Value Objects
	cId, err := NewChannelId(id)
	if err != nil {
		return nil, err
	}

	if userId == "" {
		return nil, ErrUserIdEmpty
	}

	cType, err := NewChannelType(chType)
	if err != nil {
		return nil, err
	}

	cValue, err := NewChannelValue(value)
	if err != nil {
		return nil, err
	}

	cPriority, err := NewPriority(priority)
	if err != nil {
		return nil, err
	}

	// 2. Construct Aggregate
	return &NotificationChannel{
		id:        cId,
		userId:    userId,
		chType:    cType,
		value:     cValue,
		priority:  cPriority,
		isActive:  true, // Default to active
		createdAt: time.Now(),
		updatedAt: time.Now(),
	}, nil
}

// Getters
func (n *NotificationChannel) ID() ChannelId {
	return n.id
}

func (n *NotificationChannel) UserID() string {
	return n.userId
}

func (n *NotificationChannel) Type() ChannelType {
	return n.chType
}

func (n *NotificationChannel) Value() ChannelValue {
	return n.value
}

func (n *NotificationChannel) Priority() Priority {
	return n.priority
}

func (n *NotificationChannel) IsActive() bool {
	return n.isActive
}

func (n *NotificationChannel) CreatedAt() time.Time {
	return n.createdAt
}

func (n *NotificationChannel) UpdatedAt() time.Time {
	return n.updatedAt
}

// Domain Behaviors

func (n *NotificationChannel) Activate() {
	if !n.isActive {
		n.isActive = true
		n.updatedAt = time.Now()
	}
}

func (n *NotificationChannel) Deactivate() {
	if n.isActive {
		n.isActive = false
		n.updatedAt = time.Now()
	}
}

func (n *NotificationChannel) UpdateConfiguration(value string, priority int) error {
	newValue, err := NewChannelValue(value)
	if err != nil {
		return err
	}

	newPriority, err := NewPriority(priority)
	if err != nil {
		return err
	}

	n.value = newValue
	n.priority = newPriority
	n.updatedAt = time.Now()
	return nil
}

func (n *NotificationChannel) ChangePriority(priority int) error {
	newPriority, err := NewPriority(priority)
	if err != nil {
		return err
	}
	n.priority = newPriority
	n.updatedAt = time.Now()
	return nil
}
