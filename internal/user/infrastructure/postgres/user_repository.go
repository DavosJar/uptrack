// SaveWithEmail crea un usuario mínimo solo con email

package postgres

import (
	"uptrackai/internal/user/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository implementa domain.UserRepository
type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Save crea o actualiza un usuario
func (r *UserRepository) Save(user *domain.User) (*domain.User, error) {
	if user.ID() == "" {
		// Nuevo usuario
		id := uuid.Must(uuid.NewV7())
		user.AssignId(domain.UserId(id.String()))
		entity := toUserEntity(user)
		if err := r.db.Create(entity).Error; err != nil {
			return nil, err
		}
	}
	// Usuario existente - Update
	entity := toUserEntity(user)
	if err := r.db.Save(entity).Error; err != nil {
		return nil, err
	}
	return toDomainUser(entity), nil
}

// SaveTx crea o actualiza un usuario dentro de una transacción
func (r *UserRepository) SaveTx(tx *gorm.DB, user *domain.User) (*domain.User, error) {
	if user.ID() == "" {
		// Nuevo usuario
		id := uuid.Must(uuid.NewV7())
		user.AssignId(domain.UserId(id.String()))
		entity := toUserEntity(user)
		if err := tx.Create(entity).Error; err != nil {
			return nil, err
		}
	}
	// Usuario existente - Update
	entity := toUserEntity(user)
	if err := tx.Save(entity).Error; err != nil {
		return nil, err
	}
	return toDomainUser(entity), nil
}

// GetByID obtiene usuario por ID
func (r *UserRepository) GetByID(id domain.UserId) (*domain.User, error) {
	entity := &UserEntity{}
	if err := r.db.Where("id = ?", string(id)).First(entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return toDomainUser(entity), nil
}

// GetByEmail obtiene usuario por email
func (r *UserRepository) GetByEmail(email string) (*domain.User, error) {
	entity := &UserEntity{}
	if err := r.db.Where("email = ?", email).First(entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return toDomainUser(entity), nil
}

// List obtiene todos los usuarios (admin)
func (r *UserRepository) List() ([]*domain.User, error) {
	var entities []UserEntity
	if err := r.db.Find(&entities).Error; err != nil {
		return nil, err
	}

	users := make([]*domain.User, 0, len(entities))
	for i := range entities {
		users = append(users, toDomainUser(&entities[i]))
	}
	return users, nil
}

// Delete elimina un usuario (por ahora hard delete)
func (r *UserRepository) Delete(id domain.UserId) error {
	return r.db.Delete(&UserEntity{}, "id = ?", string(id)).Error
}
func (r *UserRepository) SaveWithEmail(email string) (*domain.User, error) {
	emailObj, err := domain.NewEmail(email)
	if err != nil {
		return nil, err
	}
	usr := domain.NewMinimalUser(emailObj)
	return r.Save(usr)
}

func (r *UserRepository) SaveWithEmailTx(tx interface{}, email string) (*domain.User, error) {
	txDB := tx.(*gorm.DB)
	emailObj, err := domain.NewEmail(email)
	if err != nil {
		return nil, err
	}
	usr := domain.NewMinimalUser(emailObj)
	return r.SaveTx(txDB, usr)
}

// Mappers: Entity ↔ Domain

func toUserEntity(user *domain.User) *UserEntity {

	useridString := user.ID().String()
	userId := uuid.MustParse(useridString)
	return &UserEntity{
		ID:        userId,
		Email:     user.Email().String(),
		FullName:  user.FullName(),
		AvatarURL: user.AvatarURL(),
		Timezone:  user.Timezone(),
		Language:  user.Language(),
		CreatedAt: user.CreatedAt(),
		UpdatedAt: user.UpdatedAt(),
	}
}

func toDomainUser(entity *UserEntity) *domain.User {
	email, _ := domain.NewEmail(entity.Email)
	userId, _ := domain.NewUserId(entity.ID.String())

	return domain.NewFullUser(
		userId,
		email,
		entity.FullName,
		entity.AvatarURL,
		entity.Timezone,
		entity.Language,
		entity.CreatedAt,
		entity.UpdatedAt,
	)
}
