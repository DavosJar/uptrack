package domain

import "errors"

// Domain Errors - NotificationChannel
var (
	ErrChannelNotFound      = errors.New("canal de notificación no encontrado")
	ErrChannelIdEmpty       = errors.New("channel id no puede estar vacío")
	ErrAddressEmpty         = errors.New("dirección del canal no puede estar vacía")
	ErrAddressInvalid       = errors.New("dirección del canal es inválida")
	ErrChannelAlreadyExists = errors.New("canal de notificación ya existe")
	ErrChannelInactive      = errors.New("canal de notificación está inactivo")
)
