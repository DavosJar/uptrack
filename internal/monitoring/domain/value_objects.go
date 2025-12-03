package domain

import "strings"

// Value Object: TargetId
type TargetId string

func NewTargetId(value string) (TargetId, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrTargetIdEmpty
	}
	return TargetId(value), nil
}

func (t TargetId) String() string {
	return string(t)
}

func (t TargetId) IsEmpty() bool {
	return strings.TrimSpace(string(t)) == ""
}

// Value Object: CheckResultId
type CheckResultId string

func NewCheckResultId(value string) (CheckResultId, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrCheckResultIdEmpty
	}
	return CheckResultId(value), nil
}

func (c CheckResultId) String() string {
	return string(c)
}

// Value Object: ConfigId
type ConfigId string

func NewConfigId(value string) (ConfigId, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrConfigIdEmpty
	}
	return ConfigId(value), nil
}

func (c ConfigId) String() string {
	return string(c)
}

// Enum: TargetStatus
type TargetStatus string

const (
	TargetStatusUp       TargetStatus = "UP"
	TargetStatusDown     TargetStatus = "DOWN"
	TargetStatusDegraded TargetStatus = "DEGRADED"
	TargetStatusFlapping TargetStatus = "FLAPPING"
	TargetStatusUnstable TargetStatus = "UNSTABLE"
	TargetStatusUnknown  TargetStatus = "UNKNOWN"
)

func (t TargetStatus) String() string {
	return string(t)
}

func (t TargetStatus) IsValid() bool {
	switch t {
	case TargetStatusUp, TargetStatusDown, TargetStatusDegraded, TargetStatusFlapping, TargetStatusUnstable, TargetStatusUnknown:
		return true
	}
	return false
}

// Enum: TargetType
type TargetType string

const (
	TargetTypeAPI TargetType = "API"
	TargetTypeWEB TargetType = "WEB"
)

func (t TargetType) String() string {
	return string(t)
}

func (t TargetType) IsValid() bool {
	switch t {
	case TargetTypeAPI, TargetTypeWEB:
		return true
	}
	return false
}
