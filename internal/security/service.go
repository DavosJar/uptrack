package security

import (
	"time"
	security "uptrackai/internal/security/infrastructure/postgres"
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
	credRepo *security.CredentialRepository
}

func NewAuthService(db *gorm.DB, userRepo userdomain.UserRepository, credRepo *security.CredentialRepository) *AuthService {
	return &AuthService{db: db, userRepo: userRepo, credRepo: credRepo}
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
	// Si hay error diferente a "not found", continuar (usuario no existe, es ok)

	// 2. Crear usuario dentro de la transacción
	user, err := s.userRepo.SaveWithEmailTx(tx, email)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 3. Crear hash de password
	hash, err := HashPassword(input.Password)
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
	cred := security.CredentialEntity{
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
	now := time.Now()
	cred.LastLoginAt = &now
	err = s.credRepo.Update(cred)
	if err != nil {
		return "", err
	}
	return GenerateJWT(cred.UserID.String(), "USER", 1*time.Hour)
}
