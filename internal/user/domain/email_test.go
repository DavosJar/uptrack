package domain

import (
	"testing"
)

func TestNewEmail_Success(t *testing.T) {
	validEmails := []string{
		"test@example.com",
		"user.name@example.com",
		"user+tag@example.co.uk",
		"test123@test-domain.com",
	}

	for _, email := range validEmails {
		result, err := NewEmail(email)
		if err != nil {
			t.Errorf("Expected email %s to be valid, got error: %v", email, err)
		}
		if result.String() != email {
			t.Errorf("Expected %s, got %s", email, result.String())
		}
	}
}

func TestNewEmail_Empty(t *testing.T) {
	_, err := NewEmail("")

	if err != ErrEmailEmpty {
		t.Errorf("Expected ErrEmailEmpty, got %v", err)
	}
}

func TestNewEmail_TooLong(t *testing.T) {
	longEmail := string(make([]byte, 255)) + "@example.com"

	_, err := NewEmail(longEmail)

	if err != ErrEmailTooLong {
		t.Errorf("Expected ErrEmailTooLong, got %v", err)
	}
}

func TestNewEmail_InvalidFormat(t *testing.T) {
	invalidEmails := []string{
		"notanemail",
		"@example.com",
		"user@",
		"user name@example.com",
		"user@example",
	}

	for _, email := range invalidEmails {
		_, err := NewEmail(email)
		if err == nil {
			t.Errorf("Expected email %s to be invalid", email)
		}
	}
}

func TestNewEmail_LocalPartStartsWithDot(t *testing.T) {
	_, err := NewEmail(".user@example.com")

	if err != ErrEmailLocalPartInvalid {
		t.Errorf("Expected ErrEmailLocalPartInvalid, got %v", err)
	}
}

func TestNewEmail_LocalPartEndsWithDot(t *testing.T) {
	_, err := NewEmail("user.@example.com")

	if err != ErrEmailLocalPartInvalid {
		t.Errorf("Expected ErrEmailLocalPartInvalid, got %v", err)
	}
}

func TestNewEmail_ConsecutiveDots(t *testing.T) {
	_, err := NewEmail("user..name@example.com")

	if err != ErrEmailLocalPartInvalid {
		t.Errorf("Expected ErrEmailLocalPartInvalid, got %v", err)
	}
}

func TestNewEmail_LocalPartTooLong(t *testing.T) {
	// Crear un localPart válido pero demasiado largo (65 caracteres de 'a')
	longLocal := ""
	for i := 0; i < 65; i++ {
		longLocal += "a"
	}
	longLocal += "@example.com"

	_, err := NewEmail(longLocal)

	// El error puede ser ErrEmailLocalPartInvalid o ErrEmailInvalidFormat
	// dependiendo de qué validación se ejecute primero
	if err == nil {
		t.Error("Expected error for local part too long")
	}
}

func TestNewEmail_InvalidTLD(t *testing.T) {
	_, err := NewEmail("user@example.c")

	if err != ErrEmailTLDInvalid {
		t.Errorf("Expected ErrEmailTLDInvalid, got %v", err)
	}
}

func TestEmail_Domain(t *testing.T) {
	email, _ := NewEmail("user@example.com")

	domain := email.Domain()

	if domain != "example.com" {
		t.Errorf("Expected domain 'example.com', got '%s'", domain)
	}
}

func TestEmail_LocalPart(t *testing.T) {
	email, _ := NewEmail("user@example.com")

	localPart := email.LocalPart()

	if localPart != "user" {
		t.Errorf("Expected local part 'user', got '%s'", localPart)
	}
}

func TestEmail_Normalize(t *testing.T) {
	email := Email("  UsEr@EXAMPLE.COM  ")

	normalized := email.Normalize()

	if normalized.String() != "user@example.com" {
		t.Errorf("Expected 'user@example.com', got '%s'", normalized.String())
	}
}

func TestEmail_IsEmpty(t *testing.T) {
	emptyEmail := Email("")

	if !emptyEmail.IsEmpty() {
		t.Error("Expected email to be empty")
	}

	validEmail := Email("user@example.com")
	if validEmail.IsEmpty() {
		t.Error("Expected email to NOT be empty")
	}
}
