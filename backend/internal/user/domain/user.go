package domain

import (
	"errors"
	"time"
)

var ErrUserIDAlreadySet = errors.New("user ID is already set")

// User - Entidad de dominio pura (perfil de usuario)
type User struct {
	id        UserId
	email     Email
	fullName  string
	avatarURL string
	timezone  string
	language  string
	createdAt time.Time
	updatedAt time.Time
}

// NewUser crea un usuario nuevo (para registro)
func NewUser(email Email, fullName string) *User {
	now := time.Now()
	return &User{
		email:     email,
		fullName:  fullName,
		timezone:  "UTC",
		language:  "en",
		createdAt: now,
		updatedAt: now,
	}
}

// NewMinimalUser reconstruye desde BD (solo campos esenciales)
func NewMinimalUser(email Email) *User {
	return &User{
		email: email,
	}
}

// NewFullUser reconstruye desde BD (todos los campos)
func NewFullUser(id UserId, email Email, fullName, avatarURL, timezone, language string, createdAt, updatedAt time.Time) *User {
	return &User{
		id:        id,
		email:     email,
		fullName:  fullName,
		avatarURL: avatarURL,
		timezone:  timezone,
		language:  language,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

// Getters
func (u *User) ID() UserId {
	return u.id
}

func (u *User) Email() Email {
	return u.email
}

func (u *User) FullName() string {
	return u.fullName
}

func (u *User) AvatarURL() string {
	return u.avatarURL
}

func (u *User) Timezone() string {
	return u.timezone
}

func (u *User) Language() string {
	return u.language
}

func (u *User) CreatedAt() time.Time {
	return u.createdAt
}

func (u *User) UpdatedAt() time.Time {
	return u.updatedAt
}

// Business methods
func (u *User) UpdateProfile(fullName, avatarURL, timezone, language string) {
	if fullName != "" {
		u.fullName = fullName
	}
	if avatarURL != "" {
		u.avatarURL = avatarURL
	}
	if timezone != "" {
		u.timezone = timezone
	}
	if language != "" {
		u.language = language
	}
	u.updatedAt = time.Now()
}

func (u *User) CanMonitorTargets() bool {
	// Lógica de negocio: usuario con email válido puede monitorear
	return !u.email.IsEmpty()
}

// SetID asigna el ID (usado al reconstruir desde BD)
func (u *User) AssignId(id UserId) error {
	if u.id != "" {
		return ErrUserIDAlreadySet
	}
	u.id = id
	return nil
}
