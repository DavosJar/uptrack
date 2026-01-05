package domain

import (
	"testing"
)

func TestNewCheckResult_Success(t *testing.T) {
	responseTime := 150
	reachable := true
	status := TargetStatusUp
	targetId := TargetId("target-123")

	result := NewCheckResult(targetId, responseTime, reachable, status)

	if result == nil {
		t.Fatal("Expected check result to be created")
	}
	if result.ResponseTimeMs() != responseTime {
		t.Errorf("Expected responseTime %d, got %d", responseTime, result.ResponseTimeMs())
	}
	if result.Reachable() != reachable {
		t.Errorf("Expected reachable %v, got %v", reachable, result.Reachable())
	}
	if result.Status() != status {
		t.Errorf("Expected status %s, got %s", status, result.Status())
	}
	if result.ErrorMessage() != "" {
		t.Error("Expected no error message")
	}
}

func TestNewCheckResultWithError(t *testing.T) {
	errorMsg := "Connection timeout"
	targetId := TargetId("target-123")

	result := NewCheckResultWithError(targetId, 0, errorMsg)

	if result == nil {
		t.Fatal("Expected check result to be created")
	}
	if result.Reachable() {
		t.Error("Expected result to be unreachable")
	}
	if result.Status() != TargetStatusDown {
		t.Errorf("Expected status DOWN, got %s", result.Status())
	}
	if result.ErrorMessage() != errorMsg {
		t.Errorf("Expected error message '%s', got '%s'", errorMsg, result.ErrorMessage())
	}
}

func TestCheckResult_IsHealthy_Healthy(t *testing.T) {
	targetId := TargetId("target-123")
	result := NewCheckResult(targetId, 100, true, TargetStatusUp)

	if !result.IsHealthy() {
		t.Error("Expected result to be healthy")
	}
}

func TestCheckResult_IsHealthy_Unreachable(t *testing.T) {
	targetId := TargetId("target-123")
	result := NewCheckResult(targetId, 0, false, TargetStatusDown)

	if result.IsHealthy() {
		t.Error("Expected result to be unhealthy when unreachable")
	}
}

func TestCheckResult_IsHealthy_StatusDown(t *testing.T) {
	targetId := TargetId("target-123")
	result := NewCheckResult(targetId, 100, true, TargetStatusDown)

	if result.IsHealthy() {
		t.Error("Expected result to be unhealthy when status is DOWN")
	}
}
