package domain

import (
	"time"
)

// Entity: CheckResult
type CheckResult struct {
	checkResultId      CheckResultId
	monitoringTargetId TargetId // ← NUEVO
	timestamp          time.Time
	responseTimeMs     int
	reachable          bool
	status             TargetStatus
	errorMessage       string
}

func NewCheckResult(targetId TargetId, responseTimeMs int, reachable bool, status TargetStatus) *CheckResult {
	return &CheckResult{
		monitoringTargetId: targetId, // ← NUEVO
		timestamp:          time.Now(),
		responseTimeMs:     responseTimeMs,
		reachable:          reachable,
		status:             status,
	}
}

func NewCheckResultWithError(targetId TargetId, errorMessage string) *CheckResult {
	return &CheckResult{
		monitoringTargetId: targetId, // ← NUEVO
		timestamp:          time.Now(),
		reachable:          false,
		status:             TargetStatusDown,
		errorMessage:       errorMessage,
	}
}

func NewFullCheckResult(id CheckResultId, targetId TargetId, timestamp time.Time, responseTimeMs int, reachable bool, status TargetStatus, errorMessage string) *CheckResult {
	return &CheckResult{
		checkResultId:      id,
		monitoringTargetId: targetId,
		timestamp:          timestamp,
		responseTimeMs:     responseTimeMs,
		reachable:          reachable,
		status:             status,
		errorMessage:       errorMessage,
	}
}

// Getters
func (c *CheckResult) CheckResultId() CheckResultId {
	return c.checkResultId
}
func (c *CheckResult) MonitoringTargetId() TargetId {
	return c.monitoringTargetId
}
func (c *CheckResult) Timestamp() time.Time {
	return c.timestamp
}

func (c *CheckResult) ResponseTimeMs() int {
	return c.responseTimeMs
}

func (c *CheckResult) Reachable() bool {
	return c.reachable
}

func (c *CheckResult) Status() TargetStatus {
	return c.status
}

func (c *CheckResult) ErrorMessage() string {
	return c.errorMessage
}

func (c *CheckResult) IsHealthy() bool {
	return c.reachable && c.status == TargetStatusUp
}
