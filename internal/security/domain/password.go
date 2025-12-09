package domain

// PasswordHasher define la interfaz para hashear y verificar contrase
type PasswordHasher interface {
	HashPassword(password string) (string, error)
	CheckPassword(hash, password string) bool
}
