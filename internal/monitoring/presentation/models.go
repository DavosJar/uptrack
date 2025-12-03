package presentation

import "time"

// TargetResponse representa un target de monitoreo en la respuesta HTTP
type TargetResponse struct {
	ID                string     `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name              string     `json:"name" example:"My Website"`
	URL               string     `json:"url" example:"https://example.com"`
	Type              string     `json:"type" example:"WEB"`
	CurrentStatus     string     `json:"current_status" example:"UP"`
	LastCheckedAt     *time.Time `json:"last_checked_at,omitempty"`
	AvgResponseTimeMs int        `json:"avg_response_time_ms" example:"150"`
	CreatedAt         time.Time  `json:"created_at"`
}

// TargetDetailResponse incluye configuración del target
type TargetDetailResponse struct {
	ID                string              `json:"id"`
	Name              string              `json:"name"`
	URL               string              `json:"url"`
	Type              string              `json:"type"`
	CurrentStatus     string              `json:"current_status"`
	LastCheckedAt     *time.Time          `json:"last_checked_at,omitempty"`
	AvgResponseTimeMs int                 `json:"avg_response_time_ms"`
	CreatedAt         time.Time           `json:"created_at"`
	Configuration     ConfigurationDetail `json:"configuration"`
}

type ConfigurationDetail struct {
	TimeoutSeconds    int `json:"timeout_seconds"`
	RetryCount        int `json:"retry_count"`
	RetryDelaySeconds int `json:"retry_delay_seconds"`
}

// CreateTargetRequest representa la petición para crear un target
type CreateTargetRequest struct {
	Name string `json:"name" binding:"required" example:"My Website"`
	URL  string `json:"url" binding:"required,url" example:"https://example.com"`
	Type string `json:"type" binding:"required,oneof=WEB API" example:"WEB"`
}

// MetricResponse representa una métrica individual
type MetricResponse struct {
	Timestamp      time.Time `json:"timestamp"`
	ResponseTimeMs int       `json:"response_time_ms"`
}

// CheckResultResponse representa un cambio de estado (alerta)
type CheckResultResponse struct {
	Timestamp      time.Time `json:"timestamp"`
	Status         string    `json:"status"`
	ResponseTimeMs int       `json:"response_time_ms"`
	ErrorMessage   string    `json:"error_message,omitempty"`
}

// StatisticsResponse representa las estadísticas de un target
type StatisticsResponse struct {
	TargetID          string  `json:"target_id"`
	TotalChecks       int     `json:"total_checks"`
	AvgResponseTimeMs int     `json:"avg_response_time_ms"`
	SuccessRate       float64 `json:"success_rate"`
}
