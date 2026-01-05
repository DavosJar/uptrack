package postgres

import (
	"time"

	"gorm.io/gorm"
)

// TelegramLinkingToken represents a temporary token for user-telegram account linking
type TelegramLinkingToken struct {
	Token     string    `gorm:"primaryKey;type:varchar(64)"`
	UserID    string    `gorm:"type:varchar(36);not null;index"`
	ExpiresAt time.Time `gorm:"not null;index"`
	Used      bool      `gorm:"default:false;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (TelegramLinkingToken) TableName() string {
	return "telegram_linking_tokens"
}

// LinkingTokenRepository manages linking token persistence
type LinkingTokenRepository struct {
	db *gorm.DB
}

func NewLinkingTokenRepository(db *gorm.DB) *LinkingTokenRepository {
	return &LinkingTokenRepository{db: db}
}

func (r *LinkingTokenRepository) Save(token string, userID string, expiresAt time.Time) error {
	record := TelegramLinkingToken{
		Token:     token,
		UserID:    userID,
		ExpiresAt: expiresAt,
		Used:      false,
	}
	return r.db.Create(&record).Error
}

func (r *LinkingTokenRepository) FindByToken(token string) (*TelegramLinkingToken, error) {
	var record TelegramLinkingToken
	err := r.db.Where("token = ?", token).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *LinkingTokenRepository) MarkAsUsed(token string) error {
	return r.db.Model(&TelegramLinkingToken{}).
		Where("token = ?", token).
		Update("used", true).Error
}

// CleanupExpired removes expired tokens (optional housekeeping)
func (r *LinkingTokenRepository) CleanupExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).
		Delete(&TelegramLinkingToken{}).Error
}
