package domain

import (
	"testing"
)

func TestNewUser_Success(t *testing.T) {
	name := "John Doe"
	email, _ := NewEmail("john@example.com")

	user := NewUser(email, name)

	if user == nil {
		t.Fatal("Expected user to be created")
	}
	if user.FullName() != name {
		t.Errorf("Expected name %s, got %s", name, user.FullName())
	}
	if user.Email() != email {
		t.Errorf("Expected email %s, got %s", email, user.Email())
	}

}

func TestUser_CanMonitorTargets_WithValidEmail(t *testing.T) {
	email, _ := NewEmail("john@example.com")
	user := NewUser(email, "John")
	if !user.CanMonitorTargets() {
		t.Error("Expected user with valid email to be able to monitor targets")
	}
}

func TestUser_CanMonitorTargets_WithEmptyEmail(t *testing.T) {
	user := NewUser(Email(""), "John")

	if user.CanMonitorTargets() {
		t.Error("Expected user with empty email to NOT be able to monitor targets")
	}
}
