package postgres

import (
	domain "uptrackai/internal/monitoring/domain"
	userdomain "uptrackai/internal/user/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresMonitoringTargetRepository struct {
	db *gorm.DB
}

func NewPostgresMonitoringTargetRepository(db *gorm.DB) *PostgresMonitoringTargetRepository {
	return &PostgresMonitoringTargetRepository{db: db}
}

// Implementación de métodos del repositorio (Save, List, etc.)
func (r *PostgresMonitoringTargetRepository) Save(target *domain.MonitoringTarget) (*domain.MonitoringTarget, error) {
	// Si no tiene ID, es nuevo → asignar UUID v7
	if target.ID() == "" {
		newId := uuid.Must(uuid.NewV7())
		target.AssignId(domain.TargetId(newId.String()))
	}

	entity := r.toEntity(target)

	if err := r.db.Save(entity).Error; err != nil {
		return nil, err
	}

	return r.toDomain(entity)
}

func (r *PostgresMonitoringTargetRepository) List() ([]*domain.MonitoringTarget, error) {
	var entities []MonitoringTargetEntity
	if err := r.db.Find(&entities).Error; err != nil {
		return nil, err
	}

	targets := make([]*domain.MonitoringTarget, 0, len(entities))
	for _, e := range entities {
		target, _ := r.toDomain(&e)
		targets = append(targets, target)
	}
	return targets, nil
}

func (r *PostgresMonitoringTargetRepository) ListByUserAndRole(userID userdomain.UserId, role string) ([]*domain.MonitoringTarget, error) {
	var entities []MonitoringTargetEntity

	if role == "ADMIN" {
		// Admins see all targets
		if err := r.db.Find(&entities).Error; err != nil {
			return nil, err
		}
	} else {
		// Users only see their own targets
		userUUID := uuid.MustParse(string(userID))
		if err := r.db.Where("user_id = ?", userUUID).Find(&entities).Error; err != nil {
			return nil, err
		}
	}

	targets := make([]*domain.MonitoringTarget, 0, len(entities))
	for _, e := range entities {
		target, _ := r.toDomain(&e)
		targets = append(targets, target)
	}
	return targets, nil
}

func (r *PostgresMonitoringTargetRepository) GetByID(id domain.TargetId) (*domain.MonitoringTarget, error) {
	var entity MonitoringTargetEntity
	targetUUID := uuid.MustParse(string(id))

	if err := r.db.Where("id = ?", targetUUID).First(&entity).Error; err != nil {
		return nil, err
	}

	return r.toDomain(&entity)
}

// --- MAPPERS (privados, dentro del mismo archivo) ---

func (r *PostgresMonitoringTargetRepository) toEntity(target *domain.MonitoringTarget) *MonitoringTargetEntity {
	//converit a uuid
	targetIdUUID := uuid.MustParse(target.ID().String())
	userIdUUID := uuid.MustParse(target.UserId().String())

	entity := &MonitoringTargetEntity{
		ID:                targetIdUUID,
		UserID:            userIdUUID,
		Name:              target.Name(),
		URL:               target.Url(),
		TargetType:        string(target.TargetType()),
		PreviousStatus:    string(target.PreviousStatus()),
		CurrentStatus:     string(target.CurrentStatus()),
		TimeoutSeconds:    target.Configuration().TimeoutSeconds(),
		RetryCount:        target.Configuration().RetryCount(),
		RetryDelaySeconds: target.Configuration().RetryDelaySeconds(),
	}

	// Solo mapear CreatedAt si ya existe (update), no en create
	if !target.CreatedAt().IsZero() && targetIdUUID != uuid.Nil {
		entity.CreatedAt = target.CreatedAt()
	}

	// Siempre mapear UpdatedAt (LastCheckedAt)
	if !target.LastCheckedAt().IsZero() {
		entity.UpdatedAt = target.LastCheckedAt()
	}

	return entity
}
func (r *PostgresMonitoringTargetRepository) toDomain(entity *MonitoringTargetEntity) (*domain.MonitoringTarget, error) {
	// Convertir UUID a string
	entityIdStr := entity.ID.String()
	entityUserIdStr := entity.UserID.String()

	// Crear value objects (capturando errores)
	targetId, err := domain.NewTargetId(entityIdStr)
	if err != nil {
		return nil, err
	}

	userId, err := userdomain.NewUserId(entityUserIdStr)
	if err != nil {
		return nil, err
	}

	config := domain.NewCheckConfiguration(
		entity.TimeoutSeconds,
		entity.RetryCount,
		entity.RetryDelaySeconds,
	)

	previousStatus := domain.TargetStatus(entity.PreviousStatus)
	currentStatus := domain.TargetStatus(entity.CurrentStatus)

	return domain.NewFullMonitoringTarget(
		targetId,
		userId,
		entity.Name,
		entity.URL,
		domain.TargetType(entity.TargetType),
		config,
		previousStatus,
		currentStatus,
		entity.CreatedAt,
		entity.UpdatedAt,
	), nil
}
