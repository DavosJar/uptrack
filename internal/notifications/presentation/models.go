package presentation

// Request and Response models

// CreateChannelRequest representa la petición para crear un canal de notificación
type CreateChannelRequest struct {
	ChannelId string `json:"channelId"`
	Address   string `json:"address"`
}

// UpdateChannelRequest representa la petición para actualizar un canal
type UpdateChannelRequest struct {
	Address *string `json:"address,omitempty"`
}

// ChannelResponse representa la respuesta con los datos de un canal
type ChannelResponse struct {
	ChannelId string `json:"channelId"`
	Address   string `json:"address"`
	IsActive  bool   `json:"isActive"`
	CreatedAt string `json:"createdAt"`
}

// ActivateChannelRequest representa la petición para activar/desactivar un canal
type ActivateChannelRequest struct {
	IsActive bool `json:"isActive"`
}
