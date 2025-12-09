package domain

// UserRepository - Interface del repositorio (sin dependencias de infraestructura)
type UserRepository interface {
	Save(user *User) (*User, error)
	GetByID(id UserId) (*User, error)
	GetByEmail(email string) (*User, error)
	List() ([]*User, error)
	Delete(id UserId) error
	SaveWithEmail(email string) (*User, error)
	SaveWithEmailTx(tx interface{}, email string) (*User, error) // tx es *gorm.DB, pero para no importar gorm aquí
}
