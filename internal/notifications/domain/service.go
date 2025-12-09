package domain

// Domain Services

// NotificationService maneja lógica de negocio compleja entre múltiples entidades
type NotificationService struct {
	repository NotificationChannelRepository
}

func NewNotificationService(repo NotificationChannelRepository) *NotificationService {
	return &NotificationService{
		repository: repo,
	}
}

// SendNotification envía una notificación a través de un canal específico
func (s *NotificationService) SendNotification(channelId string, message string) error {
	channel, err := s.repository.FindById(channelId)
	if err != nil {
		return err
	}

	if !channel.IsActive() {
		return ErrChannelInactive
	}

	// Aquí iría la lógica de envío real (delegada a infrastructure)
	return nil
}
