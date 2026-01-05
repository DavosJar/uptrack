package domain

import (
	"crypto/rand"
	"encoding/base64"
	"time"
)

// Value Object: LinkingToken
// Represents a temporary, secure token for linking external accounts (e.g., Telegram)
type LinkingToken struct {
	value     string
	expiresAt time.Time
	used      bool
}

// NewLinkingToken creates a new secure token valid for 15 minutes
func NewLinkingToken() (*LinkingToken, error) {
	// Generate a cryptographically secure random token (32 bytes = 256 bits)
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return nil, err
	}

	// Encode as URL-safe base64
	token := base64.URLEncoding.EncodeToString(bytes)

	return &LinkingToken{
		value:     token,
		expiresAt: time.Now().Add(15 * time.Minute),
		used:      false,
	}, nil
}

// ReconstructLinkingToken rebuilds a token from storage (for validation)
func ReconstructLinkingToken(value string, expiresAt time.Time, used bool) *LinkingToken {
	return &LinkingToken{
		value:     value,
		expiresAt: expiresAt,
		used:      used,
	}
}

func (t *LinkingToken) Value() string {
	return t.value
}

func (t *LinkingToken) ExpiresAt() time.Time {
	return t.expiresAt
}

func (t *LinkingToken) IsExpired() bool {
	return time.Now().After(t.expiresAt)
}

func (t *LinkingToken) IsUsed() bool {
	return t.used
}

func (t *LinkingToken) MarkAsUsed() {
	t.used = true
}

func (t *LinkingToken) IsValid() bool {
	return !t.IsExpired() && !t.IsUsed()
}
