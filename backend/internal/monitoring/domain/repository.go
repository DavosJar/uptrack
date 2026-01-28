package domain

import userdomain "uptrackai/internal/user/domain"

// Repository interface
type MonitoringTargetRepository interface {
	Save(target *MonitoringTarget) (*MonitoringTarget, error)
	List() ([]*MonitoringTarget, error)
	ListByUserAndRole(userID userdomain.UserId, role string) ([]*MonitoringTarget, error)
	GetByID(id TargetId) (*MonitoringTarget, error)
	GetByURLAndUser(url string, userID userdomain.UserId) (*MonitoringTarget, error)
	GetByNameAndUser(name string, userID userdomain.UserId) (*MonitoringTarget, error)
	Delete(id TargetId) error
	ToggleActive(id TargetId, isActive bool) error
}

type CheckResultRepository interface {
	Save(result *CheckResult) (*CheckResult, error)
	GetByTargetID(targetId TargetId, limit int) ([]*CheckResult, error)
}

type MetricsRepository interface {
	Save(result *CheckResult) error
	GetByTargetID(targetId TargetId, limit int) ([]*CheckResult, error)
}

type CheckConfigurationRepository interface {
	Save(config *CheckConfiguration) error
}

type TargetStatisticsRepository interface {
	Get(targetId TargetId) (*TargetStatistics, error)
	Save(stats *TargetStatistics) error
}
