package config

import (
	"log"

	monitoringpostgres "uptrackai/internal/monitoring/infrastructure/postgres"
	notificationpostgres "uptrackai/internal/notifications/infrastructure/postgres"
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

		// Notification system
		&notificationpostgres.TelegramLinkingToken{},
		&notificationpostgres.NotificationChannelEntity{},
		&notificationpostgres.NotificationEntity{},
	)

	if err != nil {
		log.Printf("❌ Error en migraciones: %v", err)
		return err
	}

	// Migration for notification channels - fix ID length after table creation
	err = db.Exec(`ALTER TABLE notification_channels ALTER COLUMN id TYPE varchar(100)`).Error
	if err != nil {
		log.Printf("⚠️  Error updating notification_channels table: %v", err)
	}

	log.Println("✅ Migraciones completadas")
	return nil
}
