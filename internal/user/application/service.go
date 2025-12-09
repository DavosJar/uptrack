package application

import (
	"fmt"
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

// devuelve un apiResponse con el usuario correspondiente al id
func (s *Service) GetByID(id domain.UserId) (UserProfileDTO, error) {
	user, err := s.repository.GetByID(id)
	if err != nil {
		return UserProfileDTO{}, err
	}
	return ToUserProfileDTO(user), nil
}
func (s *Service) GetUserProfile(userID domain.UserId) (*UserProfileDTO, error) {

	// Llamar repo con UserID
	user, err := s.repository.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	dto := ToUserProfileDTO(user)
	return &dto, nil
}
func (s *Service) CompleteUserProfile(userID domain.UserId, cmd CompleteUserProfileCommand) (*UserProfileDTO, error) {
	user, err := s.repository.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Actualizar usando método del domain
	user.UpdateProfile(cmd.FullName, cmd.AvatarURL, cmd.Timezone, cmd.Language)

	// Guardar
	updatedUser, err := s.repository.Save(user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}

	dto := ToUserProfileDTO(updatedUser)
	return &dto, nil
}
