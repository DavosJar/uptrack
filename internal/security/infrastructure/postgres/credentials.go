package postgres

import (
	"time"

	"github.com/google/uuid"
)

// CredentialEntity representa la tabla credentials
type CredentialEntity struct {
	ID                     uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID                 uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex"`
	PasswordHash           string     `gorm:"type:varchar(255);not null"`
	LastLoginAt            *time.Time `gorm:"type:timestamp"`
	LoginAttempts          int        `gorm:"type:int;default:0"`
	LockedUntil            *time.Time `gorm:"type:timestamp"`
	PasswordChangedAt      time.Time  `gorm:"type:timestamp"`
	RequiresPasswordChange bool       `gorm:"type:boolean;default:false"`
	CreatedAt              time.Time  `gorm:"autoCreateTime"`
	UpdatedAt              time.Time  `gorm:"autoUpdateTime"`
}
