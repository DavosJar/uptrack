package postgres

import (
	"time"
	"uptrackai/internal/security/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CredentialEntity es la representación en base de datos (con GORM)
type CredentialEntity struct {
	ID                     uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserID                 uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex"`
	PasswordHash           string     `gorm:"type:varchar(255);not null"`
	LastLoginAt            *time.Time `gorm:"type:timestamp"`
	LoginAttempts          int        `gorm:"type:int;default:0"`
	LockedUntil            *time.Time `gorm:"type:timestamp"`
	PasswordChangedAt      time.Time  `gorm:"type:timestamp"`
	RequiresPasswordChange bool       `gorm:"type:boolean;default:false"`
	CreatedAt              time.Time  `gorm:"autoCreateTime"`
	UpdatedAt              time.Time  `gorm:"autoUpdateTime"`
}

func (CredentialEntity) TableName() string {
	return "credentials"
}

func (c *CredentialEntity) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.Must(uuid.NewV7())
	}
	if c.PasswordChangedAt.IsZero() {
		c.PasswordChangedAt = time.Now()
	}
	return nil
}

// Mappers
func toDomain(entity *CredentialEntity) *domain.Credential {
	return &domain.Credential{
		ID:                     entity.ID,
		UserID:                 entity.UserID,
		PasswordHash:           entity.PasswordHash,
		LastLoginAt:            entity.LastLoginAt,
		LoginAttempts:          entity.LoginAttempts,
		LockedUntil:            entity.LockedUntil,
		PasswordChangedAt:      entity.PasswordChangedAt,
		RequiresPasswordChange: entity.RequiresPasswordChange,
		CreatedAt:              entity.CreatedAt,
		UpdatedAt:              entity.UpdatedAt,
	}
}

func toEntity(d *domain.Credential) *CredentialEntity {
	return &CredentialEntity{
		ID:                     d.ID,
		UserID:                 d.UserID,
		PasswordHash:           d.PasswordHash,
		LastLoginAt:            d.LastLoginAt,
		LoginAttempts:          d.LoginAttempts,
		LockedUntil:            d.LockedUntil,
		PasswordChangedAt:      d.PasswordChangedAt,
		RequiresPasswordChange: d.RequiresPasswordChange,
		CreatedAt:              d.CreatedAt,
		UpdatedAt:              d.UpdatedAt,
	}
}

type CredentialRepository struct {
	db *gorm.DB
}

func NewCredentialRepository(db *gorm.DB) *CredentialRepository {
	return &CredentialRepository{db: db}
}

func (r *CredentialRepository) Create(cred *domain.Credential) error {
	entity := toEntity(cred)
	err := r.db.Create(entity).Error
	if err != nil {
		return err
	}
	// Actualizar ID generado
	cred.ID = entity.ID
	cred.CreatedAt = entity.CreatedAt
	cred.UpdatedAt = entity.UpdatedAt
	cred.PasswordChangedAt = entity.PasswordChangedAt
	return nil
}

func (r *CredentialRepository) CreateTx(tx interface{}, cred *domain.Credential) error {
	entity := toEntity(cred)
	err := tx.(*gorm.DB).Create(entity).Error
	if err != nil {
		return err
	}
	cred.ID = entity.ID
	cred.CreatedAt = entity.CreatedAt
	cred.UpdatedAt = entity.UpdatedAt
	cred.PasswordChangedAt = entity.PasswordChangedAt
	return nil
}

func (r *CredentialRepository) GetByUserID(userID uuid.UUID) (*domain.Credential, error) {
	var entity CredentialEntity
	err := r.db.Where("user_id = ?", userID).First(&entity).Error
	if err != nil {
		return nil, err
	}
	return toDomain(&entity), nil
}

func (r *CredentialRepository) GetByID(id uuid.UUID) (*domain.Credential, error) {
	var entity CredentialEntity
	err := r.db.Where("id = ?", id).First(&entity).Error
	if err != nil {
		return nil, err
	}
	return toDomain(&entity), nil
}

func (r *CredentialRepository) Update(cred *domain.Credential) error {
	entity := toEntity(cred)
	return r.db.Save(entity).Error
}
