package domain

import (
	"time"
)


type TokenClaims struct {
	UserID    string
	Role      string
	ExpiresAt time.Time
}

// TokenGenerator define la interfaz para generar y validar tokens
type TokenGenerator interface {
	Generate(userID, role string, duration time.Duration) (string, error)
	Parse(tokenStr string) (*TokenClaims, error)
}
