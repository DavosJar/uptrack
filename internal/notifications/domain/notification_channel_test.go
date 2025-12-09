package domain

import (
	"testing"
)

func TestNewNotificationChannel_Success(t *testing.T) {
	channelId := "channel123"
	userId := "user456"
	address := "user@example.com"

	channel, err := NewNotificationChannel(channelId, userId, address)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if channel == nil {
		t.Fatal("Expected channel to be created")
	}
	if channel.ChannelId() != channelId {
		t.Errorf("Expected channelId %s, got %s", channelId, channel.ChannelId())
	}
	if channel.UserId() != userId {
		t.Errorf("Expected userId %s, got %s", userId, channel.UserId())
	}
	if channel.Address() != address {
		t.Errorf("Expected address %s, got %s", address, channel.Address())
	}
	if !channel.IsActive() {
		t.Error("Expected channel to be active by default")
	}
}

func TestNewNotificationChannel_EmptyChannelId(t *testing.T) {
	_, err := NewNotificationChannel("", "user123", "user@example.com")

	if err != ErrChannelIdEmpty {
		t.Errorf("Expected ErrChannelIdEmpty, got %v", err)
	}
}

func TestNewNotificationChannel_EmptyUserId(t *testing.T) {
	_, err := NewNotificationChannel("channel123", "", "user@example.com")

	if err != ErrChannelIdEmpty {
		t.Errorf("Expected ErrChannelIdEmpty, got %v", err)
	}
}

func TestNewNotificationChannel_EmptyAddress(t *testing.T) {
	_, err := NewNotificationChannel("channel123", "user123", "")

	if err != ErrAddressEmpty {
		t.Errorf("Expected ErrAddressEmpty, got %v", err)
	}
}

func TestNotificationChannel_Activate(t *testing.T) {
	channel, _ := NewNotificationChannel("channel123", "user123", "user@example.com")
	channel.Deactivate()

	channel.Activate()

	if !channel.IsActive() {
		t.Error("Expected channel to be active after Activate()")
	}
}

func TestNotificationChannel_Deactivate(t *testing.T) {
	channel, _ := NewNotificationChannel("channel123", "user123", "user@example.com")

	channel.Deactivate()

	if channel.IsActive() {
		t.Error("Expected channel to be inactive after Deactivate()")
	}
}

func TestNotificationChannel_UpdateAddress(t *testing.T) {
	channel, _ := NewNotificationChannel("channel123", "user123", "old@example.com")
	newAddress := "new@example.com"

	err := channel.UpdateAddress(newAddress)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if channel.Address() != newAddress {
		t.Errorf("Expected address %s, got %s", newAddress, channel.Address())
	}
}

func TestNotificationChannel_UpdateAddress_Empty(t *testing.T) {
	channel, _ := NewNotificationChannel("channel123", "user123", "user@example.com")

	err := channel.UpdateAddress("")

	if err != ErrAddressEmpty {
		t.Errorf("Expected ErrAddressEmpty, got %v", err)
	}
}

func TestNotificationChannel_BelongsTo(t *testing.T) {
	userId := "user123"
	channel, _ := NewNotificationChannel("channel123", userId, "user@example.com")

	if !channel.BelongsTo(userId) {
		t.Errorf("Expected channel to belong to user %s", userId)
	}

	if channel.BelongsTo("differentUser") {
		t.Error("Expected channel to NOT belong to different user")
	}
}

