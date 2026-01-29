package postgres

import (
	"time"

	"github.com/google/uuid"
)

// MonitoringTargetEntity - Tabla de targets a monitorear
type MonitoringTargetEntity struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID               uuid.UUID `gorm:"type:uuid;not null"`
	Name                 string    `gorm:"type:varchar(255);not null"`
	URL                  string    `gorm:"type:text;not null"`
	TargetType           string    `gorm:"type:varchar(50);not null"`
	IsActive             bool      `gorm:"default:true"`
	PreviousStatus       string    `gorm:"type:varchar(50);default:'UNKNOWN'"`
	CurrentStatus        string    `gorm:"type:varchar(50);default:'UNKNOWN'"`
	CheckIntervalSeconds int       `gorm:"default:300"` // Config: Frecuencia (300s default)
	TimeoutSeconds       int       `gorm:"default:10"`
	RetryCount           int       `gorm:"default:3"`
	RetryDelaySeconds    int       `gorm:"default:1"`
	LastCheckedAt        time.Time `gorm:"default:null"`
	NextCheckAt          time.Time `gorm:"index;default:null"` // Optimización: Para polling eficiente
	CreatedAt            time.Time `gorm:"autoCreateTime"`
	UpdatedAt            time.Time `gorm:"autoUpdateTime"`
}

// CheckResultEntity - Tabla SQL para alertas (solo cambios de estado)
type CheckResultEntity struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	MonitoringTargetID uuid.UUID `gorm:"type:uuid;not null;index:idx_target_timestamp"`
	Timestamp          time.Time `gorm:"not null;index:idx_target_timestamp"`
	Status             string    `gorm:"type:varchar(50);not null"`
	AvgResponseTimeMs  int       `gorm:"not null"`
	ErrorMessage       string    `gorm:"type:text"`
	CreatedAt          time.Time `gorm:"autoCreateTime"`
}

// MetricEntity - Tabla NoSQL simulada para seguimiento continuo (solo checks correctos)
type MetricEntity struct {
	MonitoringTargetID uuid.UUID `gorm:"type:uuid;not null;index:idx_metric_target_time"`
	Timestamp          time.Time `gorm:"not null;index:idx_metric_target_time"`
	ResponseTimeMs     int       `gorm:"not null"`
	CreatedAt          time.Time `gorm:"autoCreateTime"`
}

func (MonitoringTargetEntity) TableName() string {
	return "monitoring_targets"
}

func (CheckResultEntity) TableName() string {
	return "check_results"
}

func (MetricEntity) TableName() string {
	return "metrics"
}
