package application

import (
	"uptrackai/internal/monitoring/domain"
	userdomain "uptrackai/internal/user/domain"
)

// Queries (Read operations)

type GetAllTargetsQuery struct {
	UserID userdomain.UserId
	Role   string
}

type GetTargetByIDQuery struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
}

type GetTargetMetricsQuery struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
	Limit    int
}

type GetTargetHistoryQuery struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
	Limit    int
}

type GetTargetStatisticsQuery struct {
	TargetID domain.TargetId
	UserID   userdomain.UserId
}
