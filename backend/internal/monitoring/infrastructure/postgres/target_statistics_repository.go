package postgres

import (
	"uptrackai/internal/monitoring/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostgresTargetStatisticsRepository struct {
	db *gorm.DB
}

func NewPostgresTargetStatisticsRepository(db *gorm.DB) *PostgresTargetStatisticsRepository {
	return &PostgresTargetStatisticsRepository{db: db}
}

// Get obtiene las estadísticas de un target (crea una nueva si no existe)
func (r *PostgresTargetStatisticsRepository) Get(targetId domain.TargetId) (*domain.TargetStatistics, error) {
	targetUUID := uuid.MustParse(targetId.String())

	var entity TargetStatisticsEntity
	err := r.db.Where("target_id = ?", targetUUID).First(&entity).Error

	if err == gorm.ErrRecordNotFound {
		// No existe, crear nueva estadística en blanco
		return domain.NewTargetStatistics(targetId), nil
	}

	if err != nil {
		return nil, err
	}

	return r.toDomain(&entity)
}

// Save guarda o actualiza las estadísticas
func (r *PostgresTargetStatisticsRepository) Save(stats *domain.TargetStatistics) error {
	entity := r.toEntity(stats)

	// Upsert: si existe UPDATE, si no CREATE
	return r.db.Save(entity).Error
}

// --- MAPPERS ---

func (r *PostgresTargetStatisticsRepository) toEntity(stats *domain.TargetStatistics) *TargetStatisticsEntity {
	targetUUID := uuid.MustParse(stats.TargetId().String())

	return &TargetStatisticsEntity{
		TargetID:          targetUUID,
		AvgResponseTimeMs: stats.AvgResponseTimeMs(),
		TotalChecksCount:  stats.TotalChecksCount(),
	}
}

func (r *PostgresTargetStatisticsRepository) toDomain(entity *TargetStatisticsEntity) (*domain.TargetStatistics, error) {
	targetId, err := domain.NewTargetId(entity.TargetID.String())
	if err != nil {
		return nil, err
	}

	return domain.NewFullTargetStatistics(
		targetId,
		entity.AvgResponseTimeMs,
		entity.TotalChecksCount,
	), nil
}
