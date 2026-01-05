package domain

import "github.com/google/uuid"

// CredentialRepository define las operaciones de persistencia para credenciales
type CredentialRepository interface {
	Create(cred *Credential) error
	CreateTx(tx interface{}, cred *Credential) error
	GetByUserID(userID uuid.UUID) (*Credential, error)
	GetByID(id uuid.UUID) (*Credential, error)
	Update(cred *Credential) error
}
