package postgres

import (
	"uptrackai/internal/monitoring/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresCheckResultRepository struct {
	db *gorm.DB
}

func NewPostgresCheckResultRepository(db *gorm.DB) *PostgresCheckResultRepository {
	return &PostgresCheckResultRepository{db: db}
}

// Save guarda solo alertas (cambios de estado confirmados) y devuelve el objeto persistido
func (r *PostgresCheckResultRepository) Save(result *domain.CheckResult) (*domain.CheckResult, error) {
	entity := r.toEntity(result)

	if err := r.db.Create(entity).Error; err != nil {
		return nil, err
	}

	return r.toDomain(entity)
}

// GetByTargetID obtiene el historial de cambios de estado de un target
func (r *PostgresCheckResultRepository) GetByTargetID(targetId domain.TargetId, limit int) ([]*domain.CheckResult, error) {
	var entities []CheckResultEntity
	targetUUID := uuid.MustParse(string(targetId))

	err := r.db.Where("monitoring_target_id = ?", targetUUID).
		Order("timestamp DESC").
		Limit(limit).
		Find(&entities).Error

	if err != nil {
		return nil, err
	}

	results := make([]*domain.CheckResult, 0, len(entities))
	for _, e := range entities {
		result, _ := r.toDomain(&e)
		results = append(results, result)
	}
	return results, nil
}

// --- MAPPERS ---

func (r *PostgresCheckResultRepository) toEntity(result *domain.CheckResult) *CheckResultEntity {
	var checkResultIdUUID uuid.UUID
	if result.CheckResultId().String() == "" {
		checkResultIdUUID = uuid.Must(uuid.NewV7())
	} else {
		checkResultIdUUID = uuid.MustParse(result.CheckResultId().String())
	}

	targetIdUUID := uuid.MustParse(result.MonitoringTargetId().String())

	return &CheckResultEntity{
		ID:                 checkResultIdUUID,
		MonitoringTargetID: targetIdUUID,
		Timestamp:          result.Timestamp(),
		Status:             string(result.Status()),
		AvgResponseTimeMs:  result.ResponseTimeMs(),
		ErrorMessage:       result.ErrorMessage(),
	}
}

func (r *PostgresCheckResultRepository) toDomain(entity *CheckResultEntity) (*domain.CheckResult, error) {
	checkResultId, err := domain.NewCheckResultId(entity.ID.String())
	if err != nil {
		return nil, err
	}

	targetId, err := domain.NewTargetId(entity.MonitoringTargetID.String())
	if err != nil {
		return nil, err
	}

	return domain.NewFullCheckResult(
		checkResultId,
		targetId,
		entity.Timestamp,
		entity.AvgResponseTimeMs,
		entity.ErrorMessage == "",
		domain.TargetStatus(entity.Status),
		entity.ErrorMessage,
	), nil
}
