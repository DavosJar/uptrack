package application

import (
	"uptrackai/internal/monitoring/domain"
	userdomain "uptrackai/internal/user/domain"
)

// Commands (escritura)

type CreateTargetCommand struct {
	UserID     userdomain.UserId
	Name       string
	URL        string
	TargetType domain.TargetType
}

type UpdateTargetCommand struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
	Name     string
}

type DeleteTargetCommand struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
	Role     string
}

type ToggleActiveCommand struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
	Role     string
	IsActive bool
}

type UpdateConfigurationCommand struct {
	TargetID             domain.TargetId
	UserID               userdomain.UserId
	Role                 string
	TimeoutSeconds       int
	RetryCount           int
	RetryDelaySeconds    int
	CheckIntervalSeconds int
	AlertOnFailure       bool
	AlertOnRecovery      bool
}
