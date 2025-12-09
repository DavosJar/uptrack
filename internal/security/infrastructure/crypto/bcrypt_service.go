package crypto

import (
	"golang.org/x/crypto/bcrypt"
)

type BcryptService struct{}

func NewBcryptService() *BcryptService {
	return &BcryptService{}
}

func (s *BcryptService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func (s *BcryptService) CheckPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
