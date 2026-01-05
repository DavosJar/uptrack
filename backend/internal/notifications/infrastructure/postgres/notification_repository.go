package postgres

import (
	"time"
	"uptrackai/internal/notifications/domain"

	"gorm.io/gorm"
)

type NotificationEntity struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)"` // UUID v7
	UserID    string    `gorm:"type:varchar(36);not null;index"`
	Title     string    `gorm:"type:varchar(255);not null"`
	Message   string    `gorm:"type:text;not null"`
	Severity  int       `gorm:"not null"` // 0: OK, 1: Warning, 2: Critical
	IsRead    bool      `gorm:"not null;default:false"`
	CreatedAt time.Time `gorm:"autoCreateTime;index"`
}

func (NotificationEntity) TableName() string {
	return "notifications"
}

type PostgresNotificationRepository struct {
	db *gorm.DB
}

func NewPostgresNotificationRepository(db *gorm.DB) *PostgresNotificationRepository {
	return &PostgresNotificationRepository{db: db}
}

func (r *PostgresNotificationRepository) Save(n *domain.Notification) error {
	entity := NotificationEntity{
		ID:        string(n.ID()),
		UserID:    n.UserID(),
		Title:     n.Title(),
		Message:   n.Message(),
		Severity:  int(n.Severity()),
		IsRead:    n.IsRead(),
		CreatedAt: n.CreatedAt(),
	}
	return r.db.Save(&entity).Error
}

func (r *PostgresNotificationRepository) FindById(id domain.NotificationId) (*domain.Notification, error) {
	var entity NotificationEntity
	if err := r.db.First(&entity, "id = ?", string(id)).Error; err != nil {
		return nil, err
	}
	return r.toDomain(&entity), nil
}

func (r *PostgresNotificationRepository) FindByUserId(userId string, limit int, offset int) ([]*domain.Notification, error) {
	var entities []NotificationEntity
	if err := r.db.Where("user_id = ?", userId).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&entities).Error; err != nil {
		return nil, err
	}

	notifications := make([]*domain.Notification, len(entities))
	for i, e := range entities {
		notifications[i] = r.toDomain(&e)
	}
	return notifications, nil
}

func (r *PostgresNotificationRepository) CountUnread(userId string) (int64, error) {
	var count int64
	err := r.db.Model(&NotificationEntity{}).
		Where("user_id = ? AND is_read = ?", userId, false).
		Count(&count).Error
	return count, err
}

func (r *PostgresNotificationRepository) MarkAsRead(id domain.NotificationId) error {
	return r.db.Model(&NotificationEntity{}).
		Where("id = ?", string(id)).
		Update("is_read", true).Error
}

func (r *PostgresNotificationRepository) MarkAllAsRead(userId string) error {
	return r.db.Model(&NotificationEntity{}).
		Where("user_id = ? AND is_read = ?", userId, false).
		Update("is_read", true).Error
}

func (r *PostgresNotificationRepository) toDomain(e *NotificationEntity) *domain.Notification {
	// Reconstruct domain object
	// Note: We are using a factory that sets CreatedAt to Now(), but here we want to restore it.
	// Since the fields are private, we might need to add a Restore/Unmarshal method to the domain,
	// or just use the factory and then set the fields if we had setters (which we don't).
	// For now, I'll assume I can create a new one and the timestamp might be slightly off if I use NewNotification,
	// BUT NewNotification sets CreatedAt to Now().
	// Ideally, the domain should have a "Rehydrate" function.
	// I will add a Rehydrate function to domain/notification.go or just use reflection/unsafe if needed,
	// but better to add a proper constructor for hydration.

	// Let's modify domain/notification.go to allow hydration or just export fields?
	// No, keep encapsulation. I'll add a Hydrate function.

	// For now, I'll use NewNotification and then I'm stuck with wrong CreatedAt.
	// Let's fix domain/notification.go first.

	n := domain.NewNotification(e.UserID, e.Title, e.Message, domain.AlertSeverity(e.Severity))
	n.AssignId(e.ID)
	if e.IsRead {
		n.MarkAsRead()
	}
	n.SetCreatedAt(e.CreatedAt)
	return n
}
