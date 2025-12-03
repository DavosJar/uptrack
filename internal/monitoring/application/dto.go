package application

// DTOs (Data Transfer Objects)
import (
	"time"
	"uptrackai/internal/monitoring/domain"
)

// MonitoringTargetSummaryDTO - DTO resumido para listas
type MonitoringTargetSummaryDTO struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	URL              string `json:"url"`
	TargetType       string `json:"target_type"`
	CurrentStatus    string `json:"current_status"`
	LastCheckedAt    string `json:"last_checked_at,omitempty"`
	LastResponseTime int    `json:"last_response_time,omitempty"`
	AvgResponseTime  int    `json:"avg_response_time,omitempty"`
}

func ToMonitoringTargetSummaryDTO(target *domain.MonitoringTarget, stats *domain.TargetStatistics) MonitoringTargetSummaryDTO {
	avgResponseTime := 0
	if stats != nil {
		avgResponseTime = stats.AvgResponseTimeMs()
	}

	return MonitoringTargetSummaryDTO{
		ID:            string(target.ID()),
		Name:          target.Name(),
		URL:           target.Url(),
		TargetType:    target.TargetType().String(),
		CurrentStatus: target.CurrentStatus().String(),
		LastCheckedAt: func() string {
			if !target.LastCheckedAt().IsZero() {
				return target.LastCheckedAt().Format(time.RFC3339)
			}
			return ""
		}(),
		LastResponseTime: target.LastResponseTime(),
		AvgResponseTime:  avgResponseTime,
	}
}

// MonitoringTargetDetailDTO - DTO completo para detalle individual
type MonitoringTargetDetailDTO struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	URL              string                 `json:"url"`
	TargetType       string                 `json:"target_type"`
	PreviousStatus   string                 `json:"previous_status"`
	CurrentStatus    string                 `json:"current_status"`
	CreatedAt        string                 `json:"created_at"`
	LastCheckedAt    string                 `json:"last_checked_at,omitempty"`
	LastResponseTime int                    `json:"last_response_time,omitempty"`
	Configuration    map[string]interface{} `json:"configuration"`
}

func ToMonitoringTargetDetailDTO(target *domain.MonitoringTarget) MonitoringTargetDetailDTO {
	return MonitoringTargetDetailDTO{
		ID:             string(target.ID()),
		Name:           target.Name(),
		URL:            target.Url(),
		TargetType:     target.TargetType().String(),
		PreviousStatus: target.PreviousStatus().String(),
		CurrentStatus:  target.CurrentStatus().String(),
		CreatedAt:      target.CreatedAt().Format(time.RFC3339),
		LastCheckedAt: func() string {
			if !target.LastCheckedAt().IsZero() {
				return target.LastCheckedAt().Format(time.RFC3339)
			}
			return ""
		}(),
		LastResponseTime: target.LastResponseTime(),
		Configuration: map[string]interface{}{
			"timeout_seconds":     target.Configuration().TimeoutSeconds(),
			"retry_count":         target.Configuration().RetryCount(),
			"retry_delay_seconds": target.Configuration().RetryDelaySeconds(),
			"alert_on_failure":    target.Configuration().AlertOnFailure(),
			"alert_on_recovery":   target.Configuration().AlertOnRecovery(),
		},
	}
}

// MetricDTO - DTO para métricas
type MetricDTO struct {
	Timestamp      time.Time `json:"timestamp"`
	ResponseTimeMs int       `json:"response_time_ms"`
}

func ToMetricDTO(checkResult *domain.CheckResult) MetricDTO {
	return MetricDTO{
		Timestamp:      checkResult.Timestamp(),
		ResponseTimeMs: checkResult.ResponseTimeMs(),
	}
}

// CheckResultDTO - DTO para historial de cambios de estado
type CheckResultDTO struct {
	Timestamp      time.Time `json:"timestamp"`
	Status         string    `json:"status"`
	ResponseTimeMs int       `json:"response_time_ms"`
	ErrorMessage   string    `json:"error_message,omitempty"`
}

func ToCheckResultDTO(checkResult *domain.CheckResult) CheckResultDTO {
	return CheckResultDTO{
		Timestamp:      checkResult.Timestamp(),
		Status:         string(checkResult.Status()),
		ResponseTimeMs: checkResult.ResponseTimeMs(),
		ErrorMessage:   checkResult.ErrorMessage(),
	}
}

// StatisticsDTO - DTO para estadísticas agregadas
type StatisticsDTO struct {
	TargetID          string  `json:"target_id"`
	TotalChecks       int     `json:"total_checks"`
	AvgResponseTimeMs int     `json:"avg_response_time_ms"`
	SuccessRate       float64 `json:"success_rate"`
}

func ToStatisticsDTO(targetId string, stats *domain.TargetStatistics) StatisticsDTO {
	return StatisticsDTO{
		TargetID:          targetId,
		TotalChecks:       stats.TotalChecksCount(),
		AvgResponseTimeMs: stats.AvgResponseTimeMs(),
		SuccessRate:       100.0, // TODO: calcular cuando tengamos failed_checks_count
	}
}
