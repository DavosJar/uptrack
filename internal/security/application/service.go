package application

import (
	"errors"
	"time"
	"uptrackai/internal/security/domain"
	userdomain "uptrackai/internal/user/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RegisterInput struct {
	Email    string
	Password string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthService struct {
	db       *gorm.DB
	userRepo userdomain.UserRepository
	credRepo domain.CredentialRepository
	hasher   domain.PasswordHasher
	tokenGen domain.TokenGenerator
}

func NewAuthService(
	db *gorm.DB,
	userRepo userdomain.UserRepository,
	credRepo domain.CredentialRepository,
	hasher domain.PasswordHasher,
	tokenGen domain.TokenGenerator,
) *AuthService {
	return &AuthService{
		db:       db,
		userRepo: userRepo,
		credRepo: credRepo,
		hasher:   hasher,
		tokenGen: tokenGen,
	}
}

// Register crea un usuario y su credencial de forma transaccional
func (s *AuthService) Register(input RegisterInput) error {
	email := input.Email

	// Iniciar transacción
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if tx.Error != nil {
		return tx.Error
	}

	// 1. Verificar si usuario existe (dentro de la transacción)
	existingUser, err := s.userRepo.GetByEmail(email)
	if err == nil && existingUser != nil {
		tx.Rollback()
		return userdomain.ErrUserAlreadyExists
	}

	// 2. Crear usuario dentro de la transacción
	user, err := s.userRepo.SaveWithEmailTx(tx, email)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 3. Crear hash de password
	hash, err := s.hasher.HashPassword(input.Password)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 4. Crear credencial dentro de la transacción
	userId := user.ID()
	uuidId, err := uuid.Parse(string(userId))
	if err != nil {
		tx.Rollback()
		return err
	}
	cred := domain.Credential{
		UserID:       uuidId,
		PasswordHash: hash,
	}
	err = s.credRepo.CreateTx(tx, &cred)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Commit transacción
	return tx.Commit().Error
}

// Login valida credenciales y retorna JWT
func (s *AuthService) Login(input LoginInput) (string, error) {
	email := input.Email
	existingUser, err := s.userRepo.GetByEmail(email)
	if err != nil {
		return "", err
	}
	cred, err := s.credRepo.GetByUserID(uuid.Must(uuid.Parse(string(existingUser.ID()))))
	if err != nil {
		return "", err
	}

	// 4. Verificar password
	if !s.hasher.CheckPassword(cred.PasswordHash, input.Password) {
		return "", errors.New("invalid credentials")
	}

	// Actualizar último login
	now := time.Now()
	cred.LastLoginAt = &now
	err = s.credRepo.Update(cred)
	if err != nil {
		return "", err
	}

	// 5. Generar JWT
	return s.tokenGen.Generate(existingUser.ID().String(), "USER", time.Hour*24)
}

// ParseToken valida y extrae la información del token
func (s *AuthService) ParseToken(token string) (*domain.TokenClaims, error) {
	return s.tokenGen.Parse(token)
}
