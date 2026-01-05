package postgres

import (
	"time"
	"uptrackai/internal/notifications/domain"

	"gorm.io/gorm"
)

type NotificationChannelEntity struct {
	ID        string    `gorm:"primaryKey;type:varchar(100)"`
	UserID    string    `gorm:"type:varchar(36);not null;index"`
	Type      string    `gorm:"type:varchar(20);not null"`
	Value     string    `gorm:"type:text;not null"` // JSON or simple string depending on config
	Priority  int       `gorm:"not null;default:0"`
	IsActive  bool      `gorm:"not null;default:true"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (NotificationChannelEntity) TableName() string {
	return "notification_channels"
}

type PostgresNotificationChannelRepository struct {
	db *gorm.DB
}

func NewPostgresNotificationChannelRepository(db *gorm.DB) *PostgresNotificationChannelRepository {
	return &PostgresNotificationChannelRepository{db: db}
}

func (r *PostgresNotificationChannelRepository) Save(channel *domain.NotificationChannel) error {
	entity := r.toEntity(channel)
	err := r.db.Save(entity).Error
	return err
}

func (r *PostgresNotificationChannelRepository) FindById(id domain.ChannelId) (*domain.NotificationChannel, error) {
	var entity NotificationChannelEntity
	if err := r.db.First(&entity, "id = ?", id.String()).Error; err != nil {
		return nil, err
	}
	return r.toDomain(&entity)
}

func (r *PostgresNotificationChannelRepository) FindByUserId(userId string) ([]*domain.NotificationChannel, error) {
	var entities []NotificationChannelEntity
	if err := r.db.Where("user_id = ?", userId).Find(&entities).Error; err != nil {
		return nil, err
	}
	return r.toDomainList(entities)
}

func (r *PostgresNotificationChannelRepository) FindActiveByUserId(userId string) ([]*domain.NotificationChannel, error) {
	var entities []NotificationChannelEntity
	if err := r.db.Where("user_id = ? AND is_active = ?", userId, true).Order("priority desc").Find(&entities).Error; err != nil {
		return nil, err
	}
	return r.toDomainList(entities)
}

func (r *PostgresNotificationChannelRepository) Update(channel *domain.NotificationChannel) error {
	entity := r.toEntity(channel)
	return r.db.Save(entity).Error
}

func (r *PostgresNotificationChannelRepository) Delete(id domain.ChannelId) error {
	return r.db.Delete(&NotificationChannelEntity{}, "id = ?", id.String()).Error
}

// Mappers

func (r *PostgresNotificationChannelRepository) toEntity(d *domain.NotificationChannel) *NotificationChannelEntity {
	return &NotificationChannelEntity{
		ID:        d.ID().String(),
		UserID:    d.UserID(),
		Type:      d.Type().String(),
		Value:     d.Value().String(),
		Priority:  d.Priority().Int(),
		IsActive:  d.IsActive(),
		CreatedAt: d.CreatedAt(),
		UpdatedAt: d.UpdatedAt(),
	}
}

func (r *PostgresNotificationChannelRepository) toDomain(e *NotificationChannelEntity) (*domain.NotificationChannel, error) {
	return domain.NewNotificationChannel(
		e.ID,
		e.UserID,
		e.Type,
		e.Value,
		e.Priority,
	)
}

func (r *PostgresNotificationChannelRepository) toDomainList(entities []NotificationChannelEntity) ([]*domain.NotificationChannel, error) {
	channels := make([]*domain.NotificationChannel, 0, len(entities))
	for _, e := range entities {
		ch, err := r.toDomain(&e)
		if err != nil {
			continue // Skip invalid records
		}
		channels = append(channels, ch)
	}
	return channels, nil
}
