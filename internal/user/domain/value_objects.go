package domain

import (
	"regexp"
	"strings"
)

// Value Object: Email
type Email string

// NewEmail crea y valida un nuevo Email
func NewEmail(value string) (Email, error) {
	email := Email(value)
	if err := email.Validate(); err != nil {
		return "", err
	}
	return email, nil
}

// Validate realiza validación compleja del email
func (e Email) Validate() error {
	emailStr := string(e)

	// Verificar que no esté vacío
	if strings.TrimSpace(emailStr) == "" {
		return ErrEmailEmpty
	}

	// Verificar longitud máxima (RFC 5321)
	if len(emailStr) > 254 {
		return ErrEmailTooLong
	}

	// Verificar formato básico con regex complejo
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9.!#$%&'*+/=?^_` + "`" + `{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`)
	if !emailRegex.MatchString(emailStr) {
		return ErrEmailInvalidFormat
	}

	// Separar local y dominio
	parts := strings.Split(emailStr, "@")
	if len(parts) != 2 {
		return ErrEmailInvalidFormat
	}

	localPart := parts[0]
	domainPart := parts[1]

	// Validar parte local (antes del @)
	if len(localPart) == 0 || len(localPart) > 64 {
		return ErrEmailLocalPartInvalid
	}

	// No puede empezar o terminar con punto
	if strings.HasPrefix(localPart, ".") || strings.HasSuffix(localPart, ".") {
		return ErrEmailLocalPartInvalid
	}

	// No puede tener puntos consecutivos
	if strings.Contains(localPart, "..") {
		return ErrEmailLocalPartInvalid
	}

	// Validar parte del dominio (después del @)
	if len(domainPart) == 0 || len(domainPart) > 253 {
		return ErrEmailDomainInvalid
	}

	// Debe tener al menos un punto en el dominio
	if !strings.Contains(domainPart, ".") {
		return ErrEmailDomainInvalid
	}

	// Validar TLD (Top Level Domain)
	domainParts := strings.Split(domainPart, ".")
	tld := domainParts[len(domainParts)-1]
	if len(tld) < 2 {
		return ErrEmailTLDInvalid
	}

	// Verificar que no contenga caracteres especiales no permitidos en el dominio
	domainRegex := regexp.MustCompile(`^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$`)
	if !domainRegex.MatchString(domainPart) {
		return ErrEmailDomainInvalid
	}

	return nil
}

// String retorna la representación en string del email
func (e Email) String() string {
	return string(e)
}

// IsEmpty verifica si el email está vacío
func (e Email) IsEmpty() bool {
	return strings.TrimSpace(string(e)) == ""
}

// Domain retorna la parte del dominio del email
func (e Email) Domain() string {
	parts := strings.Split(string(e), "@")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}

// LocalPart retorna la parte local del email (antes del @)
func (e Email) LocalPart() string {
	parts := strings.Split(string(e), "@")
	if len(parts) == 2 {
		return parts[0]
	}
	return ""
}

// Normalize normaliza el email (lowercase)
func (e Email) Normalize() Email {
	return Email(strings.ToLower(strings.TrimSpace(string(e))))
}

// Value Object: UserId
type UserId string

func NewUserId(value string) (UserId, error) {
	if strings.TrimSpace(value) == "" {
		return "", ErrUserIdEmpty
	}
	return UserId(value), nil
}

func (u UserId) String() string {
	return string(u)
}
