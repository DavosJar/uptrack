package domain

import (
	"time"
	"uptrackai/internal/user/domain"
)

// Entity: MonitoringTarget
type MonitoringTarget struct {
	userId           domain.UserId
	targetId         TargetId
	name             string
	url              string
	previousStatus   TargetStatus
	currentStatus    TargetStatus
	createdAt        time.Time
	lastCheckedAt    time.Time
	lastResponseTime int
	targetType       TargetType
	configuration    *CheckConfiguration // Relación "Define" con CheckConfiguration
}

func NewMinimalMonitoringTarget(name string, url string, targetType TargetType, userId domain.UserId) *MonitoringTarget {
	return &MonitoringTarget{
		userId:         userId,
		name:           name,
		url:            url,
		previousStatus: TargetStatusUnknown,
		currentStatus:  TargetStatusUnknown,
		createdAt:      time.Now(),
		targetType:     targetType,
		configuration:  NewDefaultCheckConfiguration(),
	}
}

// NewMonitoringTarget crea una nueva instancia de MonitoringTarget
func NewMonitoringTarget(name string, url string, targetType TargetType) *MonitoringTarget {
	return &MonitoringTarget{
		name:          name,
		url:           url,
		targetType:    targetType,
		createdAt:     time.Now(),
		configuration: NewDefaultCheckConfiguration(), // Configuración por defecto
	}
}
func NewFullMonitoringTarget(id TargetId, userId domain.UserId,
	name string, url string, targetType TargetType,
	config *CheckConfiguration, previousStatus TargetStatus,
	currentStatus TargetStatus, createdAt time.Time, lastCheckedAt time.Time) *MonitoringTarget {
	return &MonitoringTarget{
		targetId:       id,
		userId:         userId,
		name:           name,
		url:            url,
		previousStatus: previousStatus,
		currentStatus:  currentStatus,
		targetType:     targetType,
		configuration:  config,
		createdAt:      createdAt,
		lastCheckedAt:  lastCheckedAt,
	}
}

// Getters
func (m *MonitoringTarget) ID() TargetId {
	return m.targetId
}

func (m *MonitoringTarget) Name() string {
	return m.name
}

func (m *MonitoringTarget) Url() string {
	return m.url
}

func (m *MonitoringTarget) CreatedAt() time.Time {
	return m.createdAt
}

func (m *MonitoringTarget) LastCheckedAt() time.Time {
	return m.lastCheckedAt
}

func (m *MonitoringTarget) LastResponseTime() int {
	return m.lastResponseTime
}

func (m *MonitoringTarget) TargetType() TargetType {
	return m.targetType
}

func (m *MonitoringTarget) Configuration() *CheckConfiguration {
	return m.configuration
}

func (m *MonitoringTarget) UserId() domain.UserId {
	return m.userId
}

func (m *MonitoringTarget) PreviousStatus() TargetStatus {
	return m.previousStatus
}

func (m *MonitoringTarget) CurrentStatus() TargetStatus {
	return m.currentStatus
}

// Business methods
func (m *MonitoringTarget) UpdateStatus(newStatus TargetStatus) error {
	// Validar que el nuevo estado sea válido
	if !newStatus.IsValid() {
		return ErrInvalidTargetType
	}

	// Validar transiciones de estado permitidas
	if !m.isValidTransition(m.currentStatus, newStatus) {
		return ErrInvalidStatusTransition
	}

	// Actualizar: current → previous, nuevo → current
	m.previousStatus = m.currentStatus
	m.currentStatus = newStatus
	m.lastCheckedAt = time.Now()
	return nil
}

// isValidTransition valida si la transición de estado es permitida (State Machine)
func (m *MonitoringTarget) isValidTransition(from, to TargetStatus) bool {
	// UNKNOWN puede ir a cualquier estado (estado inicial)
	if from == TargetStatusUnknown {
		return true
	}

	// Las transiciones permitidas
	allowedTransitions := map[TargetStatus][]TargetStatus{
		TargetStatusUp: {
			TargetStatusDown,     // UP -> DOWN (servicio cae)
			TargetStatusDegraded, // UP -> DEGRADED (respuesta lenta)
			TargetStatusFlapping, // UP -> FLAPPING (inestable)
			TargetStatusUnstable, // UP -> UNSTABLE (inestabilidad)
		},
		TargetStatusDown: {
			TargetStatusUp,       // DOWN -> UP (recuperación)
			TargetStatusFlapping, // DOWN -> FLAPPING (intermitente)
			TargetStatusUnstable, // DOWN -> UNSTABLE (inestabilidad)
		},
		TargetStatusDegraded: {
			TargetStatusUp,       // DEGRADED -> UP (mejora)
			TargetStatusDown,     // DEGRADED -> DOWN (empeora)
			TargetStatusUnstable, // DEGRADED -> UNSTABLE (inestabilidad)
		},
		TargetStatusFlapping: {
			TargetStatusUp,       // FLAPPING -> UP (se estabiliza)
			TargetStatusDown,     // FLAPPING -> DOWN (definitivamente caído)
			TargetStatusUnstable, // FLAPPING -> UNSTABLE (mejora parcial)
		},
		TargetStatusUnstable: {
			TargetStatusUp,       // UNSTABLE -> UP (se estabiliza)
			TargetStatusDown,     // UNSTABLE -> DOWN (empeora)
			TargetStatusFlapping, // UNSTABLE -> FLAPPING (empeora más)
			TargetStatusDegraded, // UNSTABLE -> DEGRADED (lento pero estable)
		},
	}

	allowed, exists := allowedTransitions[from]
	if !exists {
		return false
	}

	for _, allowedStatus := range allowed {
		if allowedStatus == to {
			return true
		}
	}

	return false
}

func (m *MonitoringTarget) Rename(newName string) error {
	if newName == "" {
		return ErrTargetNameEmpty
	}
	m.name = newName
	return nil
}

func (m *MonitoringTarget) UpdateConfiguration(config *CheckConfiguration) error {
	if config == nil {
		return ErrConfigNotFound
	}
	if !config.IsValid() {
		return ErrInvalidInterval
	}
	m.configuration = config
	return nil
}

func (m *MonitoringTarget) RecordCheckResult(responseTimeMs int) {
	m.lastResponseTime = responseTimeMs
	m.lastCheckedAt = time.Now()
}

func (m *MonitoringTarget) AssignId(newId TargetId) error {
	if m.targetId != "" {
		return ErrTargetAlreadyHasId
	}
	m.targetId = newId
	return nil
}
