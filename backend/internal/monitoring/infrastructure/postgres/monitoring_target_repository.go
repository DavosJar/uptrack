package postgres

import (
	"errors"
	"time"
	domain "uptrackai/internal/monitoring/domain"
	userdomain "uptrackai/internal/user/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PostgresMonitoringTargetRepository struct {
	db *gorm.DB
}

func NewPostgresMonitoringTargetRepository(db *gorm.DB) *PostgresMonitoringTargetRepository {
	return &PostgresMonitoringTargetRepository{db: db}
}

// Implementación de métodos del repositorio (Save, List, etc.)
func (r *PostgresMonitoringTargetRepository) Save(target *domain.MonitoringTarget) (*domain.MonitoringTarget, error) {
	// Verificar si es nuevo ANTES de asignar ID (simple check: si venía vacío, es Create)
	// Pero target.ID() es un value object, string vacío significa "nuevo" en este dominio
	isNew := target.ID() == ""

	if isNew {
		newId := uuid.Must(uuid.NewV7())
		target.AssignId(domain.TargetId(newId.String()))
	}

	entity := r.toEntity(target)

	var err error
	if isNew {
		// CREATE explícito para nuevos registros con ID manual
		err = r.db.Create(entity).Error
	} else {
		// SAVE (Update) para existentes
		// Usamos Claúsula OnConflict para Upsert robusto si fuera necesario,
		// pero aquí Save estándar con ID existente = Update

		// ⚠️ GORM Save con ID existente hace UPDATE.
		// Si el registro no existiera (caso raro de race condition o borrado manual), Save daría 0 rows affected pero no error.
		// Para robustez usamos Clauses(clause.OnConflict{UpdateAll: true}) que hace "INSERT ... ON CONFLICT UPDATE"
		err = r.db.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(entity).Error
	}

	if err != nil {
		return nil, err
	}

	return r.toDomain(entity)
}

func (r *PostgresMonitoringTargetRepository) List() ([]*domain.MonitoringTarget, error) {
	var entities []MonitoringTargetEntity
	if err := r.db.Find(&entities).Error; err != nil {
		return nil, err
	}

	targets := make([]*domain.MonitoringTarget, 0, len(entities))
	for _, e := range entities {
		target, _ := r.toDomain(&e)
		targets = append(targets, target)
	}
	return targets, nil
}

func (r *PostgresMonitoringTargetRepository) ListByUserAndRole(userID userdomain.UserId, role string) ([]*domain.MonitoringTarget, error) {
	var entities []MonitoringTargetEntity

	if role == "ADMIN" {
		// Admins see all targets
		if err := r.db.Find(&entities).Error; err != nil {
			return nil, err
		}
	} else {
		// Users only see their own targets
		userUUID := uuid.MustParse(string(userID))
		if err := r.db.Where("user_id = ?", userUUID).Find(&entities).Error; err != nil {
			return nil, err
		}
	}

	targets := make([]*domain.MonitoringTarget, 0, len(entities))
	for _, e := range entities {
		target, _ := r.toDomain(&e)
		targets = append(targets, target)
	}
	return targets, nil
}

func (r *PostgresMonitoringTargetRepository) GetByID(id domain.TargetId) (*domain.MonitoringTarget, error) {
	var entity MonitoringTargetEntity
	targetUUID, err := uuid.Parse(string(id))
	if err != nil {
		return nil, domain.ErrTargetNotFound // UUID inválido = no existe
	}

	if err := r.db.Where("id = ?", targetUUID).First(&entity).Error; err != nil {
		return nil, domain.ErrTargetNotFound
	}

	return r.toDomain(&entity)
}

func (r *PostgresMonitoringTargetRepository) GetByURLAndUser(url string, userID userdomain.UserId) (*domain.MonitoringTarget, error) {
	var entity MonitoringTargetEntity
	userUUID := uuid.MustParse(string(userID))

	if err := r.db.Where("url = ? AND user_id = ?", url, userUUID).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrTargetNotFound
		}
		return nil, err
	}

	return r.toDomain(&entity)
}

func (r *PostgresMonitoringTargetRepository) GetByNameAndUser(name string, userID userdomain.UserId) (*domain.MonitoringTarget, error) {
	var entity MonitoringTargetEntity
	userUUID := uuid.MustParse(string(userID))

	if err := r.db.Where("name = ? AND user_id = ?", name, userUUID).First(&entity).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrTargetNotFound
		}
		return nil, err
	}

	return r.toDomain(&entity)
}

// GetDueTargets obtiene los targets que necesitan ser chequeados (Active AND NextCheckAt <= Now)
func (r *PostgresMonitoringTargetRepository) GetDueTargets() ([]*domain.MonitoringTarget, error) {
	var entities []MonitoringTargetEntity
	now := time.Now()

	// Consulta optimizada usando el índice en next_check_at
	// También traemos los que nunca han sido checado (NextCheckAt es nulo o zero)
	if err := r.db.Where("is_active = ? AND (next_check_at <= ? OR next_check_at IS NULL)", true, now).Find(&entities).Error; err != nil {
		return nil, err
	}

	if len(entities) > 0 {
		// Loguear muestreo para debug
		// log.Printf("🔍 DB fetch: %d due targets. Sample[0].ID: %s | NextCheck: %v", len(entities), entities[0].ID, entities[0].NextCheckAt)
	}

	targets := make([]*domain.MonitoringTarget, 0, len(entities))
	for _, e := range entities {
		target, _ := r.toDomain(&e)
		targets = append(targets, target)
	}
	return targets, nil
}

func (r *PostgresMonitoringTargetRepository) Delete(id domain.TargetId) error {
	targetUUID, err := uuid.Parse(string(id))
	if err != nil {
		return err
	}
	return r.db.Delete(&MonitoringTargetEntity{}, "id = ?", targetUUID).Error
}

func (r *PostgresMonitoringTargetRepository) ToggleActive(id domain.TargetId, isActive bool) error {
	targetUUID, err := uuid.Parse(string(id))
	if err != nil {
		return err
	}
	return r.db.Model(&MonitoringTargetEntity{}).Where("id = ?", targetUUID).Update("is_active", isActive).Error
}

// --- MAPPERS (privados, dentro del mismo archivo) ---

func (r *PostgresMonitoringTargetRepository) toEntity(target *domain.MonitoringTarget) *MonitoringTargetEntity {
	//converit a uuid
	targetIdUUID := uuid.MustParse(target.ID().String())
	userIdUUID := uuid.MustParse(target.UserId().String())

	entity := &MonitoringTargetEntity{
		ID:                   targetIdUUID,
		UserID:               userIdUUID,
		Name:                 target.Name(),
		URL:                  target.Url(),
		TargetType:           string(target.TargetType()),
		IsActive:             target.IsActive(),
		PreviousStatus:       string(target.PreviousStatus()),
		CurrentStatus:        string(target.CurrentStatus()),
		CheckIntervalSeconds: target.Configuration().CheckIntervalSeconds(),
		TimeoutSeconds:       target.Configuration().TimeoutSeconds(),
		RetryCount:           target.Configuration().RetryCount(),
		RetryDelaySeconds:    target.Configuration().RetryDelaySeconds(),
		NextCheckAt:          target.NextCheckAt(), // IMPORTANTE: Guardar el próximo chequeo calculado
	}

	// Solo mapear CreatedAt si ya existe (update), no en create
	if !target.CreatedAt().IsZero() && targetIdUUID != uuid.Nil {
		entity.CreatedAt = target.CreatedAt()
	}

	// Mapear métricas de ejecución explícitas
	if !target.LastCheckedAt().IsZero() {
		entity.LastCheckedAt = target.LastCheckedAt()
	}

	return entity
}
func (r *PostgresMonitoringTargetRepository) toDomain(entity *MonitoringTargetEntity) (*domain.MonitoringTarget, error) {
	// Convertir UUID a string
	entityIdStr := entity.ID.String()
	entityUserIdStr := entity.UserID.String()

	// Crear value objects (capturando errores)
	targetId, err := domain.NewTargetId(entityIdStr)
	if err != nil {
		return nil, err
	}

	userId, err := userdomain.NewUserId(entityUserIdStr)
	if err != nil {
		return nil, err
	}
	// Usar valor guardado o default si es 0
	interval := entity.CheckIntervalSeconds
	if interval <= 0 {
		interval = 300
	}

	config := domain.NewCheckConfiguration(
		entity.TimeoutSeconds,
		entity.RetryCount,
		entity.RetryDelaySeconds,
		interval,
	)

	previousStatus := domain.TargetStatus(entity.PreviousStatus)
	currentStatus := domain.TargetStatus(entity.CurrentStatus)

	// Preferir LastCheckedAt explícito, fallback a UpdatedAt si es antiguo
	lastChecked := entity.LastCheckedAt
	if lastChecked.IsZero() && !entity.UpdatedAt.IsZero() {
		lastChecked = entity.UpdatedAt
	}

	return domain.NewFullMonitoringTarget(
		targetId,
		userId,
		entity.Name,
		entity.URL,
		domain.TargetType(entity.TargetType),
		config,
		entity.IsActive,
		previousStatus,
		currentStatus,
		entity.CreatedAt,
		lastChecked,
	), nil
}
