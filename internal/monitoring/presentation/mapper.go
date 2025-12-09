package presentation

import (
	"time"
	"uptrackai/internal/monitoring/domain"
)

// ToTargetResponse convierte un domain.MonitoringTarget a TargetResponse
func ToTargetResponse(target *domain.MonitoringTarget, stats *domain.TargetStatistics) TargetResponse {
	avgResponseTime := 0
	if stats != nil {
		avgResponseTime = stats.AvgResponseTimeMs()
	}

	var lastCheckedAt *time.Time
	if !target.LastCheckedAt().IsZero() {
		t := target.LastCheckedAt()
		lastCheckedAt = &t
	}

	return TargetResponse{
		ID:                string(target.ID()),
		Name:              target.Name(),
		URL:               target.Url(),
		Type:              string(target.TargetType()),
		CurrentStatus:     string(target.CurrentStatus()),
		LastCheckedAt:     lastCheckedAt,
		AvgResponseTimeMs: avgResponseTime,
		CreatedAt:         target.CreatedAt(),
	}
}

// ToTargetResponseList convierte una lista de targets a TargetResponse
func ToTargetResponseList(targets []*domain.MonitoringTarget, statsMap map[string]*domain.TargetStatistics) []TargetResponse {
	responses := make([]TargetResponse, 0, len(targets))
	for _, target := range targets {
		stats := statsMap[string(target.ID())]
		responses = append(responses, ToTargetResponse(target, stats))
	}
	return responses
}

// ToTargetDetailResponse convierte un target a TargetDetailResponse (con configuración)
func ToTargetDetailResponse(target *domain.MonitoringTarget, stats *domain.TargetStatistics) TargetDetailResponse {
	avgResponseTime := 0
	if stats != nil {
		avgResponseTime = stats.AvgResponseTimeMs()
	}

	var lastCheckedAt *time.Time
	if !target.LastCheckedAt().IsZero() {
		t := target.LastCheckedAt()
		lastCheckedAt = &t
	}

	return TargetDetailResponse{
		ID:                string(target.ID()),
		Name:              target.Name(),
		URL:               target.Url(),
		Type:              string(target.TargetType()),
		CurrentStatus:     string(target.CurrentStatus()),
		LastCheckedAt:     lastCheckedAt,
		AvgResponseTimeMs: avgResponseTime,
		CreatedAt:         target.CreatedAt(),
		Configuration: ConfigurationDetail{
			TimeoutSeconds:    target.Configuration().TimeoutSeconds(),
			RetryCount:        target.Configuration().RetryCount(),
			RetryDelaySeconds: target.Configuration().RetryDelaySeconds(),
		},
	}
}
