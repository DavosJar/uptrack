package observability

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// LogEntry representa una entrada de log estructurada para análisis
type LogEntry struct {
	Timestamp  time.Time `json:"timestamp"`
	Level      string    `json:"level"`
	Method     string    `json:"method"`
	Path       string    `json:"path"`
	Status     int       `json:"status"`
	DurationMs float64   `json:"duration_ms"`
	IP         string    `json:"ip"`
	Size       int       `json:"size"`
}

// TelemetryConfig configuración del sistema de telemetría
type TelemetryConfig struct {
	Enabled       bool
	LogDir        string
	EnableConsole bool
	Format        string // "json" o "text"
}

// Telemetry sistema de telemetría para métricas de requests HTTP
type Telemetry struct {
	config      TelemetryConfig
	writer      *fileWriter
	currentHour int
	mutex       sync.Mutex
}

type fileWriter struct {
	file *os.File
}

// NewTelemetry crea una nueva instancia de telemetría
func NewTelemetry(cfg TelemetryConfig) (*Telemetry, error) {
	if !cfg.Enabled {
		return &Telemetry{config: cfg}, nil
	}

	// Crear directorio si no existe
	if err := os.MkdirAll(cfg.LogDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create log directory: %w", err)
	}

	t := &Telemetry{
		config:      cfg,
		currentHour: time.Now().Hour(),
	}

	// Abrir archivo inicial
	if err := t.openWriter(); err != nil {
		return nil, err
	}

	return t, nil
}

// Log escribe una entrada de telemetría
func (t *Telemetry) Log(entry LogEntry) error {
	if !t.config.Enabled {
		return nil
	}

	t.mutex.Lock()
	defer t.mutex.Unlock()

	// Verificar si necesitamos rotar
	if t.shouldRotate() {
		if err := t.rotate(); err != nil {
			return fmt.Errorf("rotation failed: %w", err)
		}
	}

	// Formatear entry
	data, err := t.format(entry)
	if err != nil {
		return fmt.Errorf("formatting failed: %w", err)
	}

	// Escribir a archivo
	if t.writer != nil && t.writer.file != nil {
		if _, err := t.writer.file.Write(data); err != nil {
			return fmt.Errorf("write failed: %w", err)
		}
	}

	// Console output si está habilitado
	if t.config.EnableConsole {
		fmt.Print(string(data))
	}

	return nil
}

// Close cierra el sistema de telemetría
func (t *Telemetry) Close() error {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	if t.writer != nil && t.writer.file != nil {
		return t.writer.file.Close()
	}
	return nil
}

// IsEnabled retorna si la telemetría está habilitada
func (t *Telemetry) IsEnabled() bool {
	return t.config.Enabled
}

// --- Internal methods ---

func (t *Telemetry) shouldRotate() bool {
	currentHour := time.Now().Hour()
	if currentHour != t.currentHour {
		t.currentHour = currentHour
		return true
	}
	return false
}

func (t *Telemetry) rotate() error {
	// Cerrar archivo actual
	if t.writer != nil && t.writer.file != nil {
		t.writer.file.Close()
	}

	// Abrir nuevo archivo
	return t.openWriter()
}

func (t *Telemetry) openWriter() error {
	filepath := t.getFilePath()
	file, err := os.OpenFile(filepath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	t.writer = &fileWriter{file: file}
	return nil
}

func (t *Telemetry) getFilePath() string {
	now := time.Now()
	filename := fmt.Sprintf("%s_%02dh.log",
		now.Format("2006-01-02"),
		now.Hour(),
	)
	return filepath.Join(t.config.LogDir, filename)
}

func (t *Telemetry) format(entry LogEntry) ([]byte, error) {
	switch t.config.Format {
	case "text":
		return t.formatText(entry), nil
	default:
		return t.formatJSON(entry)
	}
}

func (t *Telemetry) formatJSON(entry LogEntry) ([]byte, error) {
	data, err := json.Marshal(entry)
	if err != nil {
		return nil, err
	}
	return append(data, '\n'), nil
}

func (t *Telemetry) formatText(entry LogEntry) []byte {
	return []byte(fmt.Sprintf("[%s] %s %s %s %d %.2fms %d bytes\n",
		entry.Timestamp.Format("2006-01-02 15:04:05"),
		entry.Level,
		entry.Method,
		entry.Path,
		entry.Status,
		entry.DurationMs,
		entry.Size,
	))
}

// GetLogLevel determina el nivel de log basado en el status HTTP
func GetLogLevel(status int) string {
	switch {
	case status >= 500:
		return "ERROR"
	case status >= 400:
		return "WARNING"
	default:
		return "INFO"
	}
}
