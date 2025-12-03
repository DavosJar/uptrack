package application

import "uptrackai/internal/user/domain"

type RegisterUserCommand struct {
	Email string
}

type CompleteUserInfoCommand struct {
	Name string
}

func ToDomainRegisterUserCommand(cmd RegisterUserCommand) (*domain.User, error) {
	email, err := domain.NewEmail(cmd.Email)
	if err != nil {
		return nil, err
	}

	user := domain.NewMinimalUser(email)
	return user, nil
}
