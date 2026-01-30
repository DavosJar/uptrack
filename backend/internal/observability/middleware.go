package observability

import (
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
)

// Regex para detectar UUIDs (v4 y v7)
var uuidRegex = regexp.MustCompile(`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`)

// normalizePath reemplaza UUIDs por :id para agrupar métricas
func normalizePath(path string) string {
	return uuidRegex.ReplaceAllString(path, ":id")
}

// responseCapture wrapper para capturar status y size de la respuesta
type responseCapture struct {
	gin.ResponseWriter
	status int
	size   int
}

func (r *responseCapture) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *responseCapture) Write(b []byte) (int, error) {
	size, err := r.ResponseWriter.Write(b)
	r.size += size
	return size, err
}

// GinTelemetryMiddleware crea un middleware Gin para capturar telemetría
// Es extremadamente ligero: si telemetría está deshabilitada, no hace nada
func GinTelemetryMiddleware(telemetry *Telemetry) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Fast path: si telemetría está deshabilitada, continuar sin overhead
		if telemetry == nil || !telemetry.IsEnabled() {
			c.Next()
			return
		}

		// Skip OPTIONS (CORS preflight) - son ruido, 50% del tráfico
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		start := time.Now()

		// Wrapper para capturar status y tamaño
		capture := &responseCapture{
			ResponseWriter: c.Writer,
			status:         200, // default
			size:           0,
		}
		c.Writer = capture

		// Ejecutar handler
		c.Next()

		// Capturar métricas (async-safe porque Log usa mutex interno)
		duration := time.Since(start)

		entry := LogEntry{
			Timestamp:  time.Now(),
			Level:      GetLogLevel(capture.status),
			Method:     c.Request.Method,
			Path:       normalizePath(c.Request.URL.Path), // Normalizar UUIDs → :id
			Status:     capture.status,
			DurationMs: float64(duration.Microseconds()) / 1000.0,
			IP:         c.ClientIP(),
			Size:       capture.size,
		}

		// Fire-and-forget: no bloqueamos el response por telemetría
		go func() {
			_ = telemetry.Log(entry)
		}()
	}
}
