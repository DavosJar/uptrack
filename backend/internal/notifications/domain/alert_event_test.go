package domain

import (
	"testing"
)

func TestAlertEvent_ShouldNotify(t *testing.T) {
	tests := []struct {
		name             string
		severity         AlertSeverity
		previousSeverity AlertSeverity
		want             bool
	}{
		{
			name:             "Should notify on severity change (OK -> WARNING)",
			severity:         SeverityWarning,
			previousSeverity: SeverityOk,
			want:             true,
		},
		{
			name:             "Should notify on severity change (WARNING -> CRITICAL)",
			severity:         SeverityCritical,
			previousSeverity: SeverityWarning,
			want:             true,
		},
		{
			name:             "Should notify on severity change (CRITICAL -> OK)",
			severity:         SeverityOk,
			previousSeverity: SeverityCritical,
			want:             true,
		},
		{
			name:             "Should NOT notify on same severity (OK -> OK)",
			severity:         SeverityOk,
			previousSeverity: SeverityOk,
			want:             false,
		},
		{
			name:             "Should NOT notify on same severity (CRITICAL -> CRITICAL)",
			severity:         SeverityCritical,
			previousSeverity: SeverityCritical,
			want:             false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			event := &AlertEvent{
				Severity:         tt.severity,
				PreviousSeverity: tt.previousSeverity,
			}
			if got := event.ShouldNotify(); got != tt.want {
				t.Errorf("AlertEvent.ShouldNotify() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAlertSeverity_String(t *testing.T) {
	tests := []struct {
		name     string
		severity AlertSeverity
		want     string
	}{
		{"OK", SeverityOk, "OK"},
		{"WARNING", SeverityWarning, "WARNING"},
		{"CRITICAL", SeverityCritical, "CRITICAL"},
		{"INFO", SeverityInfo, "INFO"},
		{"UNKNOWN", AlertSeverity(999), "UNKNOWN"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.severity.String(); got != tt.want {
				t.Errorf("AlertSeverity.String() = %v, want %v", got, tt.want)
			}
		})
	}
}
