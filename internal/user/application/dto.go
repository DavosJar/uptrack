package application

import (
	"time"
	"uptrackai/internal/user/domain"
)

type UserResponseDTO struct {
	ID    string `json:"id"`
	Name  string `json:"name,omitempty"`
	Email string `json:"email"`
}

func ToUserResponseDTO(user *domain.User) UserResponseDTO {
	return UserResponseDTO{
		ID:    string(user.ID()),
		Name:  user.FullName(),
		Email: string(user.Email()),
	}
}

type UserProfileDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
	Timezone  string `json:"timezone"`
	Language  string `json:"language"`
	CreatedAt string `json:"created_at"` // ISO 8601
	UpdatedAt string `json:"updated_at"` // ISO 8601
}

func ToUserProfileDTO(user *domain.User) UserProfileDTO {
	return UserProfileDTO{
		ID:        string(user.ID()),
		Email:     string(user.Email()),
		FullName:  user.FullName(),
		AvatarURL: user.AvatarURL(),
		Timezone:  user.Timezone(),
		Language:  user.Language(),
		CreatedAt: user.CreatedAt().Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt().Format(time.RFC3339),
	}
}
