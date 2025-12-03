package application

import "uptrackai/internal/user/domain"

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
