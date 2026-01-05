package domain

import (
	"strings"
)

// Value Object: ChannelId
type ChannelId string

func NewChannelId(value string) (ChannelId, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrChannelIdEmpty
	}
	return ChannelId(value), nil
}

func (c ChannelId) String() string {
	return string(c)
}

// Value Object: ChannelType
type ChannelType string

const (
	ChannelTypeTelegram ChannelType = "TELEGRAM"
	ChannelTypeSlack    ChannelType = "SLACK"
	// ChannelTypeEmail    ChannelType = "EMAIL" // Future support
	// ChannelTypeWebhook  ChannelType = "WEBHOOK" // Future support
)

func NewChannelType(value string) (ChannelType, error) {
	upper := strings.ToUpper(strings.TrimSpace(value))
	switch ChannelType(upper) {
	case ChannelTypeTelegram, ChannelTypeSlack:
		return ChannelType(upper), nil
	default:
		return "", ErrInvalidChannelType
	}
}

func (t ChannelType) String() string {
	return string(t)
}

// Value Object: ChannelValue (Configuration/Address)
// Represents the destination (e.g., Chat ID, Webhook URL, Email Address)
type ChannelValue string

func NewChannelValue(value string) (ChannelValue, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrAddressEmpty
	}
	return ChannelValue(value), nil
}

func (v ChannelValue) String() string {
	return string(v)
}

// Value Object: Priority
type Priority int

func NewPriority(value int) (Priority, error) {
	if value < 1 || value > 10 {
		return 0, ErrInvalidPriority
	}
	return Priority(value), nil
}

func (p Priority) Int() int {
	return int(p)
}
