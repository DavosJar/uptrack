package domain

// Repository interface
type NotificationChannelRepository interface {
	Save(channel *NotificationChannel) error
	FindById(id string) (*NotificationChannel, error)
	FindByUserId(userId string) ([]*NotificationChannel, error)
	FindAll() ([]*NotificationChannel, error)
	Update(channel *NotificationChannel) error
	Delete(id string) error
}
