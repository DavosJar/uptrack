package config

import (
	"log"
	"os"
	"path/filepath"
	"strconv"

	"uptrackai/internal/observability"
)

// InitTelemetry inicializa el sistema de telemetría basado en variables de entorno
// TELEMETRY_ENABLED=true|false (default: true)
// TELEMETRY_LOG_DIR=path (default: ./logs)
// TELEMETRY_CONSOLE=true|false (default: false)
// TELEMETRY_FORMAT=json|text (default: json)
func InitTelemetry() (*observability.Telemetry, error) {
	enabled := getEnvBool("TELEMETRY_ENABLED", true)

	if !enabled {
		log.Println("📊 Telemetry: DISABLED")
		return observability.NewTelemetry(observability.TelemetryConfig{
			Enabled: false,
		})
	}

	// Directorio de logs (relativo al ejecutable o absoluto)
	logDir := os.Getenv("TELEMETRY_LOG_DIR")
	if logDir == "" {
		// Default: ../logs (uptrack/logs/ - compartido con Cortex)
		logDir = filepath.Join("..", "logs")
	}

	cfg := observability.TelemetryConfig{
		Enabled:       true,
		LogDir:        logDir,
		EnableConsole: getEnvBool("TELEMETRY_CONSOLE", false),
		Format:        getEnvString("TELEMETRY_FORMAT", "json"),
	}

	telemetry, err := observability.NewTelemetry(cfg)
	if err != nil {
		return nil, err
	}

	log.Printf("📊 Telemetry: ENABLED (dir=%s, format=%s)", cfg.LogDir, cfg.Format)
	return telemetry, nil
}

func getEnvBool(key string, defaultVal bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	parsed, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return parsed
}

func getEnvString(key string, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
