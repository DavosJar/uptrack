package application

import (
	"fmt"
	"uptrackai/internal/notifications/domain"
	"uptrackai/internal/notifications/infrastructure/postgres"
)

// TelegramLinkingService handles Telegram account linking logic
type TelegramLinkingService struct {
	tokenRepo *postgres.LinkingTokenRepository
	botName   string // e.g., "Uptrackapp_bot"
}

func NewTelegramLinkingService(tokenRepo *postgres.LinkingTokenRepository, botName string) *TelegramLinkingService {
	return &TelegramLinkingService{
		tokenRepo: tokenRepo,
		botName:   botName,
	}
}

// GenerateLink creates a secure token and returns the deep link URL
func (s *TelegramLinkingService) GenerateLink(userID string) (string, error) {
	// 1. Generate secure token
	linkingToken, err := domain.NewLinkingToken()
	if err != nil {
		return "", err
	}

	// 2. Save to DB
	err = s.tokenRepo.Save(linkingToken.Value(), userID, linkingToken.ExpiresAt())
	if err != nil {
		return "", err
	}

	// 3. Build deep link URL
	// Format: https://t.me/BotName?start=TOKEN
	deepLink := fmt.Sprintf("https://t.me/%s?start=%s", s.botName, linkingToken.Value())

	return deepLink, nil
}

// ValidateAndConsume validates a token and marks it as used
// Returns the associated userID if valid
func (s *TelegramLinkingService) ValidateAndConsume(token string) (string, error) {
	// 1. Fetch token
	record, err := s.tokenRepo.FindByToken(token)
	if err != nil {
		return "", fmt.Errorf("invalid token")
	}

	// 2. Reconstruct and validate
	linkingToken := domain.ReconstructLinkingToken(record.Token, record.ExpiresAt, record.Used)
	if !linkingToken.IsValid() {
		return "", fmt.Errorf("token expired or already used")
	}

	// 3. Mark as used
	err = s.tokenRepo.MarkAsUsed(token)
	if err != nil {
		return "", err
	}

	return record.UserID, nil
}
