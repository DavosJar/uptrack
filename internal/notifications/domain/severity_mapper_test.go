package domain

import (
	"testing"
)

func TestSeverityMapper_Map(t *testing.T) {
	mapper := NewSeverityMapper()

	tests := []struct {
		name  string
		state string
		want  AlertSeverity
	}{
		{"Map UP to OK", "UP", SeverityOk},
		{"Map DOWN to CRITICAL", "DOWN", SeverityCritical},
		{"Map DEGRADED to WARNING", "DEGRADED", SeverityWarning},
		{"Map UNKNOWN state to INFO (default)", "NON_EXISTENT_STATE", SeverityInfo},
		{"Map ROOT_FAIL to CRITICAL", "ROOT_FAIL", SeverityCritical},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := mapper.Map(tt.state); got != tt.want {
				t.Errorf("SeverityMapper.Map() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSeverityMapper_Register(t *testing.T) {
	mapper := NewSeverityMapper()
	newState := "CUSTOM_STATE"
	newSeverity := SeverityCritical

	// Verify it doesn't exist or is default before
	if got := mapper.Map(newState); got != SeverityInfo {
		t.Errorf("Expected default SeverityInfo for unknown state, got %v", got)
	}

	// Register new state
	mapper.Register(newState, newSeverity)

	// Verify it maps correctly now
	if got := mapper.Map(newState); got != newSeverity {
		t.Errorf("SeverityMapper.Map() after Register = %v, want %v", got, newSeverity)
	}
}
