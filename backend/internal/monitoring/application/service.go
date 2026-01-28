package application

import (
	"errors"
	"fmt"
	"uptrackai/internal/monitoring/domain"
)

// MonitoringApplicationService - Capa de aplicación que orquesta casos de uso
// NO conoce infraestructura, solo interfaces del dominio
type MonitoringApplicationService struct {
	targetRepo  domain.MonitoringTargetRepository
	metricsRepo domain.MetricsRepository
	checkRepo   domain.CheckResultRepository
	statsRepo   domain.TargetStatisticsRepository
}

func NewMonitoringApplicationService(
	targetRepo domain.MonitoringTargetRepository,
	metricsRepo domain.MetricsRepository,
	checkRepo domain.CheckResultRepository,
	statsRepo domain.TargetStatisticsRepository,
) *MonitoringApplicationService {
	return &MonitoringApplicationService{
		targetRepo:  targetRepo,
		metricsRepo: metricsRepo,
		checkRepo:   checkRepo,
		statsRepo:   statsRepo,
	}
}

// ==================== COMMANDS (Escritura) ====================

// CreateTarget - Crea un nuevo target de monitoreo
// Retorna Detail DTO, NO entidad de dominio
func (s *MonitoringApplicationService) CreateTarget(cmd CreateTargetCommand) (*MonitoringTargetDetailDTO, error) {
	// Validación de negocio: Verificar duplicados

	// 1. Verificar si ya existe un target con la misma URL para este usuario
	existingByUrl, err := s.targetRepo.GetByURLAndUser(cmd.URL, cmd.UserID)
	if err != nil && !errors.Is(err, domain.ErrTargetNotFound) {
		return nil, fmt.Errorf("error checking URL duplicates: %w", err)
	}
	if existingByUrl != nil {
		return nil, fmt.Errorf("objetivo duplicado: ya tienes un monitor para la URL %s", cmd.URL)
	}

	// 2. Verificar si ya existe un target con el mismo nombre para este usuario
	existingByName, err := s.targetRepo.GetByNameAndUser(cmd.Name, cmd.UserID)
	if err != nil && !errors.Is(err, domain.ErrTargetNotFound) {
		return nil, fmt.Errorf("error revisando duplicados de nombre: %w", err)
	}
	if existingByName != nil {
		return nil, fmt.Errorf("objetivo duplicado: ya tienes un monitor llamado '%s'", cmd.Name)
	}

	// Crear entidad de dominio
	target := domain.NewMinimalMonitoringTarget(cmd.Name, cmd.URL, cmd.TargetType, cmd.UserID)

	// Persistir
	savedTarget, err := s.targetRepo.Save(target)
	if err != nil {
		return nil, fmt.Errorf("failed to save target: %w", err)
	}

	// Mapear a Detail DTO antes de retornar
	dto := ToMonitoringTargetDetailDTO(savedTarget)
	return &dto, nil
}

// DeleteTarget - Elimina un target de monitoreo
func (s *MonitoringApplicationService) DeleteTarget(cmd DeleteTargetCommand) error {
	// Verificar existencia primero
	target, err := s.targetRepo.GetByID(cmd.TargetID)
	if err != nil {
		return fmt.Errorf("target not found: %w", err)
	}

	// Verificar permisos (Ownership)
	if cmd.Role != "ADMIN" && target.UserId() != cmd.UserID {
		return fmt.Errorf("unauthorized: user does not own this target")
	}

	// Ejecutar eliminación
	if err := s.targetRepo.Delete(cmd.TargetID); err != nil {
		return fmt.Errorf("failed to delete target: %w", err)
	}

	return nil
}

// ToggleActive - Activa o desactiva un target de monitoreo
func (s *MonitoringApplicationService) ToggleActive(cmd ToggleActiveCommand) error {
	// Verificar existencia primero
	target, err := s.targetRepo.GetByID(cmd.TargetID)
	if err != nil {
		return fmt.Errorf("target not found: %w", err)
	}

	// Verificar permisos (Ownership)
	if cmd.Role != "ADMIN" && target.UserId() != cmd.UserID {
		return fmt.Errorf("unauthorized: user does not own this target")
	}

	// Ejecutar toggle
	if err := s.targetRepo.ToggleActive(cmd.TargetID, cmd.IsActive); err != nil {
		return fmt.Errorf("failed to toggle target active status: %w", err)
	}

	return nil
}

// UpdateConfiguration - Actualiza la configuración de un target
func (s *MonitoringApplicationService) UpdateConfiguration(cmd UpdateConfigurationCommand) (*MonitoringTargetDetailDTO, error) {
	// Verificar existencia primero
	target, err := s.targetRepo.GetByID(cmd.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	// Verificar permisos (Ownership)
	if cmd.Role != "ADMIN" && target.UserId() != cmd.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Crear nueva configuración
	newConfig := domain.NewCheckConfiguration(
		cmd.TimeoutSeconds,
		cmd.RetryCount,
		cmd.RetryDelaySeconds,
		cmd.CheckIntervalSeconds,
	)

	// Establecer alertas
	if cmd.AlertOnFailure {
		newConfig.EnableFailureAlerts()
	} else {
		newConfig.DisableFailureAlerts()
	}

	if cmd.AlertOnRecovery {
		newConfig.EnableRecoveryAlerts()
	} else {
		newConfig.DisableRecoveryAlerts()
	}

	// Actualizar configuración del target
	if err := target.UpdateConfiguration(newConfig); err != nil {
		return nil, fmt.Errorf("failed to update configuration: %w", err)
	}

	// Guardar cambios
	if _, err := s.targetRepo.Save(target); err != nil {
		return nil, fmt.Errorf("failed to save target: %w", err)
	}

	// Retornar DTO actualizado
	dto := ToMonitoringTargetDetailDTO(target)
	return &dto, nil
}

// ==================== QUERIES (Lectura) ====================

// UpdateTargetName - Actualiza el nombre de un target
// Retorna Detail DTO, NO entidad de dominio
func (s *MonitoringApplicationService) UpdateTargetName(cmd UpdateTargetCommand) (*MonitoringTargetDetailDTO, error) {
	// Obtener target
	target, err := s.targetRepo.GetByID(cmd.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	// Verificar ownership (autorización)
	if target.UserId() != cmd.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Aplicar cambio en dominio
	if err := target.Rename(cmd.Name); err != nil {
		return nil, fmt.Errorf("invalid name: %w", err)
	}

	// Persistir
	updatedTarget, err := s.targetRepo.Save(target)
	if err != nil {
		return nil, fmt.Errorf("failed to update target: %w", err)
	}

	// Mapear a Detail DTO antes de retornar
	dto := ToMonitoringTargetDetailDTO(updatedTarget)
	return &dto, nil
}

// ==================== QUERIES (Lectura) ====================

// GetAllTargets - Obtiene todos los targets según rol (resumen)
// Retorna Summary DTOs para listas, NO entidades de dominio
func (s *MonitoringApplicationService) GetAllTargets(query GetAllTargetsQuery) ([]MonitoringTargetSummaryDTO, error) {
	targets, err := s.targetRepo.ListByUserAndRole(query.UserID, query.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch targets: %w", err)
	}

	// Obtener estadísticas para todos los targets
	statsMap := make(map[string]*domain.TargetStatistics)
	for _, target := range targets {
		stats, err := s.statsRepo.Get(target.ID())
		if err != nil {
			// Si no hay estadísticas, usar nil (se manejará en el DTO)
			statsMap[string(target.ID())] = nil
		} else {
			statsMap[string(target.ID())] = stats
		}
	}

	// Convertir a Summary DTOs con estadísticas
	dtos := make([]MonitoringTargetSummaryDTO, 0, len(targets))
	for _, target := range targets {
		stats := statsMap[string(target.ID())]
		dto := ToMonitoringTargetSummaryDTO(target, stats)
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

// GetTargetByID - Obtiene un target específico con autorización (detalle completo)
// Retorna Detail DTO con configuración, NO entidad de dominio
func (s *MonitoringApplicationService) GetTargetByID(query GetTargetByIDQuery) (*MonitoringTargetDetailDTO, error) {
	target, err := s.targetRepo.GetByID(query.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	// Verificar ownership
	if target.UserId() != query.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Mapear a Detail DTO
	dto := ToMonitoringTargetDetailDTO(target)
	return &dto, nil
}

// GetTargetMetrics - Obtiene métricas históricas de un target
// Retorna DTOs, NO entidades de dominio
func (s *MonitoringApplicationService) GetTargetMetrics(query GetTargetMetricsQuery) ([]MetricDTO, error) {
	// Verificar ownership primero
	target, err := s.targetRepo.GetByID(query.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	if target.UserId() != query.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Obtener métricas
	metrics, err := s.metricsRepo.GetByTargetID(query.TargetID, query.Limit)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch metrics: %w", err)
	}

	// Convertir a DTOs
	dtos := make([]MetricDTO, 0, len(metrics))
	for _, metric := range metrics {
		dtos = append(dtos, ToMetricDTO(metric))
	}

	return dtos, nil
}

// GetTargetHistory - Obtiene historial de cambios de estado
// Retorna DTOs, NO entidades de dominio
func (s *MonitoringApplicationService) GetTargetHistory(query GetTargetHistoryQuery) ([]CheckResultDTO, error) {
	// Verificar ownership
	target, err := s.targetRepo.GetByID(query.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	if target.UserId() != query.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Obtener historial
	history, err := s.checkRepo.GetByTargetID(query.TargetID, query.Limit)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch history: %w", err)
	}

	// Convertir a DTOs
	dtos := make([]CheckResultDTO, 0, len(history))
	for _, result := range history {
		dtos = append(dtos, ToCheckResultDTO(result))
	}

	return dtos, nil
}

// GetTargetStatistics - Obtiene estadísticas agregadas
// Retorna DTO, NO entidad de dominio
func (s *MonitoringApplicationService) GetTargetStatistics(query GetTargetStatisticsQuery) (*StatisticsDTO, error) {
	// Verificar ownership
	target, err := s.targetRepo.GetByID(query.TargetID)
	if err != nil {
		return nil, fmt.Errorf("target not found: %w", err)
	}

	if target.UserId() != query.UserID {
		return nil, fmt.Errorf("unauthorized: user does not own this target")
	}

	// Obtener estadísticas
	stats, err := s.statsRepo.Get(query.TargetID)
	if err != nil {
		return nil, fmt.Errorf("statistics not found: %w", err)
	}

	// Convertir a DTO
	dto := ToStatisticsDTO(string(query.TargetID), stats)
	return &dto, nil
}
