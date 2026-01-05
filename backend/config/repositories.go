package config

import (
	"uptrackai/internal/monitoring/domain"
	monitoringpostgres "uptrackai/internal/monitoring/infrastructure/postgres"
	securitypostgres "uptrackai/internal/security/infrastructure/postgres"
	userpostgres "uptrackai/internal/user/infrastructure/postgres"

	"gorm.io/gorm"
)

// Repositories contiene todas las interfaces de repositorios
type Repositories struct {
	TargetRepo  domain.MonitoringTargetRepository
	CheckRepo   domain.CheckResultRepository
	MetricsRepo domain.MetricsRepository
	StatsRepo   domain.TargetStatisticsRepository

	UserRepo       *userpostgres.UserRepository
	CredentialRepo *securitypostgres.CredentialRepository
}

// InitRepositories inicializa todos los repositorios con la DB
func InitRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		TargetRepo:  monitoringpostgres.NewPostgresMonitoringTargetRepository(db),
		CheckRepo:   monitoringpostgres.NewPostgresCheckResultRepository(db),
		MetricsRepo: monitoringpostgres.NewPostgresMetricsRepository(db),
		StatsRepo:   monitoringpostgres.NewPostgresTargetStatisticsRepository(db),

		UserRepo:       userpostgres.NewUserRepository(db),
		CredentialRepo: securitypostgres.NewCredentialRepository(db),
	}
}
