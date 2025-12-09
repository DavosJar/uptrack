package domain

import (
	"testing"
)

func TestNewCheckConfiguration_Success(t *testing.T) {
	timeout := 30
	retryCount := 3
	retryDelay := 5

	config := NewCheckConfiguration(timeout, retryCount, retryDelay)

	if config == nil {
		t.Fatal("Expected config to be created")
	}
	if config.TimeoutSeconds() != timeout {
		t.Errorf("Expected timeout %d, got %d", timeout, config.TimeoutSeconds())
	}
	if config.RetryCount() != retryCount {
		t.Errorf("Expected retryCount %d, got %d", retryCount, config.RetryCount())
	}
	if config.RetryDelaySeconds() != retryDelay {
		t.Errorf("Expected retryDelay %d, got %d", retryDelay, config.RetryDelaySeconds())
	}
	if !config.AlertOnFailure() {
		t.Error("Expected alertOnFailure to be true by default")
	}
	if !config.AlertOnRecovery() {
		t.Error("Expected alertOnRecovery to be true by default")
	}
}

func TestNewDefaultCheckConfiguration(t *testing.T) {
	config := NewDefaultCheckConfiguration()

	if config == nil {
		t.Fatal("Expected config to be created")
	}
	if config.TimeoutSeconds() != 10 {
		t.Errorf("Expected default timeout to be 10, got %d", config.TimeoutSeconds())
	}
	if config.RetryCount() != 3 {
		t.Errorf("Expected default retryCount to be 3, got %d", config.RetryCount())
	}
	if config.RetryDelaySeconds() != 1 {
		t.Errorf("Expected default retryDelay to be 1, got %d", config.RetryDelaySeconds())
	}
}

func TestCheckConfiguration_UpdateInterval(t *testing.T) {
	config := NewDefaultCheckConfiguration()
	newInterval := 60

	err := config.UpdateInterval(newInterval)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if config.TimeoutSeconds() != newInterval {
		t.Errorf("Expected timeout %d, got %d", newInterval, config.TimeoutSeconds())
	}
}

func TestCheckConfiguration_UpdateInterval_Invalid(t *testing.T) {
	config := NewDefaultCheckConfiguration()

	err := config.UpdateInterval(0)

	if err != ErrInvalidInterval {
		t.Errorf("Expected ErrInvalidInterval, got %v", err)
	}

	err = config.UpdateInterval(-1)
	if err != ErrInvalidInterval {
		t.Errorf("Expected ErrInvalidInterval for negative value, got %v", err)
	}
}

func TestCheckConfiguration_UpdateRetryPolicy(t *testing.T) {
	config := NewDefaultCheckConfiguration()
	newRetries := 5
	newDelay := 10

	err := config.UpdateRetryPolicy(newRetries, newDelay)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if config.RetryCount() != newRetries {
		t.Errorf("Expected retryCount %d, got %d", newRetries, config.RetryCount())
	}
	if config.RetryDelaySeconds() != newDelay {
		t.Errorf("Expected retryDelay %d, got %d", newDelay, config.RetryDelaySeconds())
	}
}

func TestCheckConfiguration_UpdateRetryPolicy_InvalidRetries(t *testing.T) {
	config := NewDefaultCheckConfiguration()

	err := config.UpdateRetryPolicy(-1, 5)

	if err != ErrInvalidRetryCount {
		t.Errorf("Expected ErrInvalidRetryCount, got %v", err)
	}
}

func TestCheckConfiguration_UpdateRetryPolicy_InvalidDelay(t *testing.T) {
	config := NewDefaultCheckConfiguration()

	err := config.UpdateRetryPolicy(3, -1)

	if err != ErrInvalidRetryDelay {
		t.Errorf("Expected ErrInvalidRetryDelay, got %v", err)
	}
}

func TestCheckConfiguration_IsValid(t *testing.T) {
	config := NewCheckConfiguration(30, 3, 5)

	if !config.IsValid() {
		t.Error("Expected config to be valid")
	}
}

func TestCheckConfiguration_IsValid_InvalidTimeout(t *testing.T) {
	config := NewCheckConfiguration(0, 3, 5)

	if config.IsValid() {
		t.Error("Expected config to be invalid with timeout 0")
	}
}
