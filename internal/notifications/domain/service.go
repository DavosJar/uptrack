package domain

// Domain Services

// NotificationService maneja lógica de negocio compleja entre múltiples entidades
type NotificationService struct {
	repository NotificationChannelRepository
	registry   *SenderRegistry
}

func NewNotificationService(repo NotificationChannelRepository, registry *SenderRegistry) *NotificationService {
	return &NotificationService{
		repository: repo,
		registry:   registry,
	}
}

// SendNotification envía una notificación a través de un canal específico
func (s *NotificationService) SendNotification(channelId string, message string) error {
	cId, err := NewChannelId(channelId)
	if err != nil {
		return err
	}

	channel, err := s.repository.FindById(cId)
	if err != nil {
		return err
	}

	if !channel.IsActive() {
		return ErrChannelInactive
	}

	sender, ok := s.registry.Get(channel.Type())
	if !ok {
		return ErrSenderNotFound
	}

	return sender.Send(channel.Value().String(), message)
}
