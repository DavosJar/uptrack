package domain

// Sender defines the interface for sending notifications to external providers
type Sender interface {
	Send(destination string, message string) error
}

// SenderRegistry manages the available senders for each channel type
// This avoids using switch statements or reflection to select the correct sender
type SenderRegistry struct {
	senders map[ChannelType]Sender
}

func NewSenderRegistry() *SenderRegistry {
	return &SenderRegistry{
		senders: make(map[ChannelType]Sender),
	}
}

func (r *SenderRegistry) Register(t ChannelType, s Sender) {
	r.senders[t] = s
}

func (r *SenderRegistry) Get(t ChannelType) (Sender, bool) {
	s, ok := r.senders[t]
	return s, ok
}
