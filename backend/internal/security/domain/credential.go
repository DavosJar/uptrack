package domain

import (
"time"

"github.com/google/uuid"
)

// Credential es la entidad pura del dominio
type Credential struct {
ID                     uuid.UUID
UserID                 uuid.UUID
PasswordHash           string
LastLoginAt            *time.Time
LoginAttempts          int
LockedUntil            *time.Time
PasswordChangedAt      time.Time
RequiresPasswordChange bool
CreatedAt              time.Time
UpdatedAt              time.Time
}

