package domain

import "errors"

// Domain Errors - MonitoringTarget
var (
	ErrTargetNotFound          = errors.New("target de monitoreo no encontrado")
	ErrTargetIdEmpty           = errors.New("target id no puede estar vacío")
	ErrTargetNameEmpty         = errors.New("nombre del target no puede estar vacío")
	ErrTargetAlreadyExists     = errors.New("target de monitoreo ya existe")
	ErrInvalidTargetType       = errors.New("tipo de target inválido")
	ErrInvalidStatusTransition = errors.New("transición de estado no permitida")
	ErrTargetAlreadyHasId      = errors.New("el ID del target ya ha sido establecido")
)

// Domain Errors - CheckResult
var (
	ErrCheckResultNotFound = errors.New("resultado de check no encontrado")
	ErrCheckResultIdEmpty  = errors.New("check result id no puede estar vacío")
)

// Domain Errors - CheckConfiguration
var (
	ErrConfigNotFound    = errors.New("configuración no encontrada")
	ErrConfigIdEmpty     = errors.New("config id no puede estar vacío")
	ErrInvalidInterval   = errors.New("intervalo debe ser mayor a 0")
	ErrInvalidRetryCount = errors.New("número de reintentos no puede ser negativo")
	ErrInvalidRetryDelay = errors.New("delay de reintentos no puede ser negativo")
	ErrInvalidTimeout    = errors.New("timeout debe ser mayor a 0")
)
