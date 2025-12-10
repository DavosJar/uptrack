package domain

import "errors"

// Domain Errors - NotificationChannel
var (
	ErrChannelNotFound      = errors.New("notification channel not found")
	ErrChannelIdEmpty       = errors.New("channel id cannot be empty")
	ErrUserIdEmpty          = errors.New("user id cannot be empty")
	ErrAddressEmpty         = errors.New("channel address/value cannot be empty")
	ErrAddressInvalid       = errors.New("channel address/value is invalid")
	ErrChannelAlreadyExists = errors.New("notification channel already exists")
	ErrChannelInactive      = errors.New("notification channel is inactive")
	ErrInvalidChannelType   = errors.New("invalid notification channel type")
	ErrInvalidPriority      = errors.New("priority must be between 1 and 10")
)
