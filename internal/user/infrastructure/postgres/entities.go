package postgres

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserEntity - Tabla users (perfil de usuario)
type UserEntity struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email     string    `gorm:"type:varchar(254);uniqueIndex;not null"`
	FullName  string    `gorm:"type:varchar(255)"`
	AvatarURL string    `gorm:"type:varchar(500)"`
	Timezone  string    `gorm:"type:varchar(50);default:'UTC'"`
	Language  string    `gorm:"type:varchar(10);default:'en'"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// TableName especifica el nombre de la tabla
func (UserEntity) TableName() string {
	return "users"
}

// BeforeCreate hook de GORM para generar UUID v7
func (u *UserEntity) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.Must(uuid.NewV7())
	}
	return nil
}
