package domain

import (
	"testing"
)

func TestNewNotificationChannel_Success(t *testing.T) {
	channelId := "channel123"
	userId := "user456"
	chType := "TELEGRAM"
	value := "123456789"
	priority := 10

	channel, err := NewNotificationChannel(channelId, userId, chType, value, priority)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if channel == nil {
		t.Fatal("Expected channel to be created")
	}
	if channel.ID().String() != channelId {
		t.Errorf("Expected channelId %s, got %s", channelId, channel.ID().String())
	}
	if channel.UserID() != userId {
		t.Errorf("Expected userId %s, got %s", userId, channel.UserID())
	}
	if channel.Type().String() != chType {
		t.Errorf("Expected type %s, got %s", chType, channel.Type().String())
	}
	if channel.Value().String() != value {
		t.Errorf("Expected value %s, got %s", value, channel.Value().String())
	}
	if channel.Priority().Int() != priority {
		t.Errorf("Expected priority %d, got %d", priority, channel.Priority().Int())
	}
	if !channel.IsActive() {
		t.Error("Expected channel to be active by default")
	}
}

func TestNewNotificationChannel_EmptyChannelId(t *testing.T) {
	_, err := NewNotificationChannel("", "user123", "TELEGRAM", "val", 1)

	if err != ErrChannelIdEmpty {
		t.Errorf("Expected ErrChannelIdEmpty, got %v", err)
	}
}

func TestNewNotificationChannel_EmptyUserId(t *testing.T) {
	_, err := NewNotificationChannel("channel123", "", "TELEGRAM", "val", 1)

	if err != ErrUserIdEmpty {
		t.Errorf("Expected ErrUserIdEmpty, got %v", err)
	}
}

func TestNewNotificationChannel_InvalidType(t *testing.T) {
	_, err := NewNotificationChannel("channel123", "user123", "INVALID", "val", 1)

	if err != ErrInvalidChannelType {
		t.Errorf("Expected ErrInvalidChannelType, got %v", err)
	}
}

func TestNewNotificationChannel_InvalidPriority(t *testing.T) {
	_, err := NewNotificationChannel("channel123", "user123", "TELEGRAM", "val", 11)

	if err != ErrInvalidPriority {
		t.Errorf("Expected ErrInvalidPriority, got %v", err)
	}
}

func TestNotificationChannel_UpdateConfiguration(t *testing.T) {
	channel, _ := NewNotificationChannel("1", "u1", "TELEGRAM", "old", 5)

	err := channel.UpdateConfiguration("new", 8)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if channel.Value().String() != "new" {
		t.Error("Value not updated")
	}
	if channel.Priority().Int() != 8 {
		t.Error("Priority not updated")
	}
}

func TestNotificationChannel_ActivateDeactivate(t *testing.T) {
	channel, _ := NewNotificationChannel("1", "u1", "TELEGRAM", "val", 5)

	channel.Deactivate()
	if channel.IsActive() {
		t.Error("Expected inactive")
	}

	channel.Activate()
	if !channel.IsActive() {
		t.Error("Expected active")
	}
}
