package domain

// DefaultSeverityMap define la configuración base de severidades.
// Usamos un mapa para evitar switch/case y permitir extensión fácil.
// Al usar strings como claves, desacoplamos este dominio de los tipos específicos de otros módulos (como TargetStatus).
var DefaultSeverityMap = map[string]AlertSeverity{
	// Monitoring States (coinciden con TargetStatus.String())
	"UP":       SeverityOk,
	"DOWN":     SeverityCritical,
	"DEGRADED": SeverityWarning,
	"FLAPPING": SeverityWarning,
	"UNSTABLE": SeverityWarning,
	"UNKNOWN":  SeverityInfo,

	// System States (Futuros)
	"ROOT_WORKING":  SeverityOk,
	"ROOT_FAIL":     SeverityCritical,
	"PROVIDER_FAIL": SeverityWarning,
}

// SeverityMapper maneja la traducción de estados a severidades
type SeverityMapper struct {
	mappings map[string]AlertSeverity
}

// NewSeverityMapper crea un mapper con las configuraciones por defecto
func NewSeverityMapper() *SeverityMapper {
	m := make(map[string]AlertSeverity)
	for k, v := range DefaultSeverityMap {
		m[k] = v
	}
	return &SeverityMapper{
		mappings: m,
	}
}

// Map traduce un estado (string) a su severidad correspondiente.
// Si el estado no existe, retorna SeverityInfo por defecto.
func (m *SeverityMapper) Map(state string) AlertSeverity {
	if severity, exists := m.mappings[state]; exists {
		return severity
	}
	return SeverityInfo
}

// Register permite agregar o sobreescribir mapeos dinámicamente
func (m *SeverityMapper) Register(state string, severity AlertSeverity) {
	m.mappings[state] = severity
}
