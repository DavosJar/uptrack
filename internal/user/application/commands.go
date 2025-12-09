package application

import "uptrackai/internal/user/domain"

type RegisterUserCommand struct {
	Email string
}

type CompleteUserInfoCommand struct {
	Name string
}

type CompleteUserProfileCommand struct {
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
	Timezone  string `json:"timezone"`
	Language  string `json:"language"`
}

func ToDomainRegisterUserCommand(cmd RegisterUserCommand) (*domain.User, error) {
	email, err := domain.NewEmail(cmd.Email)
	if err != nil {
		return nil, err
	}

	user := domain.NewMinimalUser(email)
	return user, nil
}
