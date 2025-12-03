package application

import (
	"uptrackai/internal/user/domain"
)

type Service struct {
	repository domain.UserRepository
}

func NewService(repo domain.UserRepository) *Service {
	return &Service{
		repository: repo,
	}
}
