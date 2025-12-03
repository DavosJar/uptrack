package postgres

import (
	"uptrackai/internal/monitoring/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresMetricsRepository struct {
	db *gorm.DB
}

func NewPostgresMetricsRepository(db *gorm.DB) *PostgresMetricsRepository {
	return &PostgresMetricsRepository{db: db}
}

// Save guarda métricas de seguimiento continuo (solo checks correctos con responseTime válido)
func (r *PostgresMetricsRepository) Save(result *domain.CheckResult) error {
	entity := r.toEntity(result)
	return r.db.Create(entity).Error
}

// GetByTargetID obtiene las últimas N métricas de un target
func (r *PostgresMetricsRepository) GetByTargetID(targetId domain.TargetId, limit int) ([]*domain.CheckResult, error) {
	var entities []MetricEntity
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

func (r *PostgresMetricsRepository) toEntity(result *domain.CheckResult) *MetricEntity {
	targetIdUUID := uuid.MustParse(result.MonitoringTargetId().String())

	return &MetricEntity{
		MonitoringTargetID: targetIdUUID,
		Timestamp:          result.Timestamp(),
		ResponseTimeMs:     result.ResponseTimeMs(),
	}
}

func (r *PostgresMetricsRepository) toDomain(entity *MetricEntity) (*domain.CheckResult, error) {
	targetId, err := domain.NewTargetId(entity.MonitoringTargetID.String())
	if err != nil {
		return nil, err
	}

	return domain.NewFullCheckResult(
		domain.CheckResultId(uuid.New().String()), // Generate new ID since we don't store it
		targetId,         // Use the target ID from DB
		entity.Timestamp, // Use the actual timestamp from DB
		entity.ResponseTimeMs,
		true, // Metrics solo guarda UP (reachable)
		domain.TargetStatusUp,
		"", // No error message for metrics
	), nil
}
