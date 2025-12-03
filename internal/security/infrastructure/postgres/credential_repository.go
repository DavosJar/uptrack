package postgres

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

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

type CredentialRepository struct {
	db *gorm.DB
}

func NewCredentialRepository(db *gorm.DB) *CredentialRepository {
	return &CredentialRepository{db: db}
}

func (r *CredentialRepository) Create(cred *CredentialEntity) error {
	return r.db.Create(cred).Error
}

func (r *CredentialRepository) CreateTx(tx *gorm.DB, cred *CredentialEntity) error {
	return tx.Create(cred).Error
}

func (r *CredentialRepository) GetByUserID(userID uuid.UUID) (*CredentialEntity, error) {
	var cred CredentialEntity
	err := r.db.Where("user_id = ?", userID).First(&cred).Error
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

func (r *CredentialRepository) GetByID(id uuid.UUID) (*CredentialEntity, error) {
	var cred CredentialEntity
	err := r.db.Where("id = ?", id).First(&cred).Error
	if err != nil {
		return nil, err
	}
	return &cred, nil
}

func (r *CredentialRepository) Update(cred *CredentialEntity) error {
	return r.db.Save(cred).Error
}
