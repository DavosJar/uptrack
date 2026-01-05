package domain

import "errors"

// Domain Errors - User
var (
	ErrUserNotFound      = errors.New("usuario no encontrado")
	ErrUserIdEmpty       = errors.New("user id no puede estar vacío")
	ErrUserAlreadyExists = errors.New("usuario ya existe")
)

// Domain Errors - Email
var (
	ErrEmailEmpty            = errors.New("email no puede estar vacío")
	ErrEmailTooLong          = errors.New("email excede la longitud máxima de 254 caracteres")
	ErrEmailInvalidFormat    = errors.New("formato de email inválido")
	ErrEmailLocalPartInvalid = errors.New("parte local del email es inválida")
	ErrEmailDomainInvalid    = errors.New("dominio del email es inválido")
	ErrEmailTLDInvalid       = errors.New("TLD del email debe tener al menos 2 caracteres")
)
