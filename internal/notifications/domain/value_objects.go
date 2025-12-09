package domain

import "strings"

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

func (c ChannelId) IsEmpty() bool {
	return strings.TrimSpace(string(c)) == ""
}

// Value Object: NotificationAddress
type NotificationAddress string

func NewNotificationAddress(value string) (NotificationAddress, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrAddressEmpty
	}
	// Validación básica pragmática
	if len(value) < 3 {
		return "", ErrAddressInvalid
	}
	return NotificationAddress(value), nil
}

func (n NotificationAddress) String() string {
	return string(n)
}
