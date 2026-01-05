package postgres

import (
	"time"

	"github.com/google/uuid"
)

// TargetStatisticsEntity - Tabla de estadísticas computadas para cada target
type TargetStatisticsEntity struct {
	TargetID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	AvgResponseTimeMs int       `gorm:"not null;default:0"`
	TotalChecksCount  int       `gorm:"not null;default:0"`
	LastUpdatedAt     time.Time `gorm:"autoUpdateTime"`
	CreatedAt         time.Time `gorm:"autoCreateTime"`
}

func (TargetStatisticsEntity) TableName() string {
	return "target_statistics"
}
