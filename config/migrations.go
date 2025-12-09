package config

import (
	"log"

	monitoringpostgres "uptrackai/internal/monitoring/infrastructure/postgres"
	securitypostgres "uptrackai/internal/security/infrastructure/postgres"
	userpostgres "uptrackai/internal/user/infrastructure/postgres"

	"gorm.io/gorm"
)

// RunMigrations ejecuta las migraciones automáticas de GORM
func RunMigrations(db *gorm.DB) error {
	log.Println("🔄 Ejecutando migraciones...")

	err := db.AutoMigrate(
		// User system
		&userpostgres.UserEntity{},
		&securitypostgres.CredentialEntity{},

		// Monitoring system
		&monitoringpostgres.MonitoringTargetEntity{},
		&monitoringpostgres.CheckResultEntity{},
		&monitoringpostgres.MetricEntity{},
		&monitoringpostgres.TargetStatisticsEntity{},
	)

	if err != nil {
		log.Printf("❌ Error en migraciones: %v", err)
		return err
	}

	log.Println("✅ Migraciones completadas")
	return nil
}
