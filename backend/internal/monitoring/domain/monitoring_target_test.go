package domain

import (
	"testing"

	userdomain "uptrackai/internal/user/domain"
)

func TestNewMonitoringTarget_Success(t *testing.T) {
	name := "API Server"
	url := "https://api.example.com"
	targetType := TargetTypeAPI

	target := NewMonitoringTarget(name, url, targetType)

	if target == nil {
		t.Fatal("Expected monitoring target to be created")
	}
	if target.Name() != name {
		t.Errorf("Expected name %s, got %s", name, target.Name())
	}
	if target.Url() != url {
		t.Errorf("Expected url %s, got %s", url, target.Url())
	}
	if target.TargetType() != targetType {
		t.Errorf("Expected type %s, got %s", targetType, target.TargetType())
	}

	if target.Configuration() == nil {
		t.Error("Expected default configuration to be set")
	}
}

func TestMonitoringTarget_UpdateStatus_ValidTransition(t *testing.T) {
	userId, _ := userdomain.NewUserId("00000000-0000-0000-0000-000000000000")
	target := NewMinimalMonitoringTarget("API", "https://api.example.com", TargetTypeAPI, userId)

	// UNKNOWN -> UP (válida)
	err := target.UpdateStatus(TargetStatusUp)
	if err != nil {
		t.Errorf("Expected no error for UNKNOWN -> UP, got %v", err)
	}

	// UP -> DOWN (válida)
	err = target.UpdateStatus(TargetStatusDown)
	if err != nil {
		t.Errorf("Expected no error for UP -> DOWN, got %v", err)
	}
}

func TestMonitoringTarget_UpdateStatus_InvalidTransition(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)

	// Establecer estado UP
	target.UpdateStatus(TargetStatusUp)

	// UP -> UP (inválida - mismo estado)
	err := target.UpdateStatus(TargetStatusUp)
	if err != ErrInvalidStatusTransition {
		t.Errorf("Expected ErrInvalidStatusTransition for UP -> UP, got %v", err)
	}
}

func TestMonitoringTarget_UpdateStatus_MultipleTransitions(t *testing.T) {
	userId, _ := userdomain.NewUserId("00000000-0000-0000-0000-000000000000")
	target := NewMinimalMonitoringTarget("Test", "https://test.com", TargetTypeAPI, userId)

	// UNKNOWN -> UP
	if err := target.UpdateStatus(TargetStatusUp); err != nil {
		t.Errorf("UNKNOWN -> UP should be valid, got: %v", err)
	}

	// UP -> DEGRADED
	if err := target.UpdateStatus(TargetStatusDegraded); err != nil {
		t.Errorf("UP -> DEGRADED should be valid, got: %v", err)
	}

	// DEGRADED -> DOWN
	if err := target.UpdateStatus(TargetStatusDown); err != nil {
		t.Errorf("DEGRADED -> DOWN should be valid, got: %v", err)
	}

	// DOWN -> UP (recovery)
	if err := target.UpdateStatus(TargetStatusUp); err != nil {
		t.Errorf("DOWN -> UP should be valid, got: %v", err)
	}
}

func TestMonitoringTarget_Rename(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)
	newName := "New API Name"

	err := target.Rename(newName)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if target.Name() != newName {
		t.Errorf("Expected name %s, got %s", newName, target.Name())
	}
}

func TestMonitoringTarget_Rename_Empty(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)

	err := target.Rename("")

	if err != ErrTargetNameEmpty {
		t.Errorf("Expected ErrTargetNameEmpty, got %v", err)
	}
}

func TestMonitoringTarget_UpdateConfiguration(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)
	newConfig := NewCheckConfiguration(60, 5, 10, 120)

	err := target.UpdateConfiguration(newConfig)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if target.Configuration().TimeoutSeconds() != 60 {
		t.Errorf("Expected timeout 60, got %d", target.Configuration().TimeoutSeconds())
	}
}

func TestMonitoringTarget_UpdateConfiguration_Nil(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)

	err := target.UpdateConfiguration(nil)

	if err != ErrConfigNotFound {
		t.Errorf("Expected ErrConfigNotFound, got %v", err)
	}
}

func TestMonitoringTarget_RecordCheckResult(t *testing.T) {
	target := NewMonitoringTarget("API", "https://api.example.com", TargetTypeAPI)
	responseTime := 150

	target.RecordCheckResult(responseTime)

	if target.LastResponseTime() != responseTime {
		t.Errorf("Expected response time %d, got %d", responseTime, target.LastResponseTime())
	}
}
