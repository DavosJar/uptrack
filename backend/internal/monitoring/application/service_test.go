package application

import (
	"testing"
	"uptrackai/internal/monitoring/domain"
	userdomain "uptrackai/internal/user/domain"
)

// ==================== MOCKS ====================

// MockTargetRepository - Mock del repositorio para testing
type MockTargetRepository struct {
	targets map[string]*domain.MonitoringTarget
}

func NewMockTargetRepository() *MockTargetRepository {
	return &MockTargetRepository{
		targets: make(map[string]*domain.MonitoringTarget),
	}
}

func (m *MockTargetRepository) Save(target *domain.MonitoringTarget) (*domain.MonitoringTarget, error) {
	m.targets[string(target.ID())] = target
	return target, nil
}

func (m *MockTargetRepository) List() ([]*domain.MonitoringTarget, error) {
	result := make([]*domain.MonitoringTarget, 0, len(m.targets))
	for _, t := range m.targets {
		result = append(result, t)
	}
	return result, nil
}

func (m *MockTargetRepository) GetByID(id domain.TargetId) (*domain.MonitoringTarget, error) {
	target, exists := m.targets[string(id)]
	if !exists {
		return nil, domain.ErrTargetNotFound
	}
	return target, nil
}

// ListByUserAndRole - Mock implementation for interface compatibility
func (m *MockTargetRepository) ListByUserAndRole(userID userdomain.UserId, role string) ([]*domain.MonitoringTarget, error) {
	// For testing, return all targets (or filter by userID if needed)
	result := make([]*domain.MonitoringTarget, 0)
	for _, t := range m.targets {
		if t.UserId() == userID {
			result = append(result, t)
		}
	}
	return result, nil
}

func (m *MockTargetRepository) GetByURLAndUser(url string, userID userdomain.UserId) (*domain.MonitoringTarget, error) {
	for _, t := range m.targets {
		if t.Url() == url && t.UserId() == userID {
			return t, nil
		}
	}
	return nil, domain.ErrTargetNotFound
}

func (m *MockTargetRepository) GetByNameAndUser(name string, userID userdomain.UserId) (*domain.MonitoringTarget, error) {
	for _, t := range m.targets {
		if t.Name() == name && t.UserId() == userID {
			return t, nil
		}
	}
	return nil, domain.ErrTargetNotFound
}

func (m *MockTargetRepository) Delete(id domain.TargetId) error {
	delete(m.targets, string(id))
	return nil
}

func (m *MockTargetRepository) ToggleActive(id domain.TargetId, isActive bool) error {
	target, exists := m.targets[string(id)]
	if !exists {
		return domain.ErrTargetNotFound
	}
	target.SetActive(isActive)
	return nil
}

// GetDueTargets - Mock implementation for interface compatibility
func (m *MockTargetRepository) GetDueTargets() ([]*domain.MonitoringTarget, error) {
	// For testing, return all targets (or filter as needed)
	result := make([]*domain.MonitoringTarget, 0, len(m.targets))
	for _, t := range m.targets {
		result = append(result, t)
	}
	return result, nil
}

// MockStatsRepository - Mock simplificado
type MockStatsRepository struct{}

func (m *MockStatsRepository) Save(stats *domain.TargetStatistics) error {
	return nil
}

func (m *MockStatsRepository) Get(targetId domain.TargetId) (*domain.TargetStatistics, error) {
	return domain.NewTargetStatistics(targetId), nil
}

// MockMetricsRepository - Mock simplificado
type MockMetricsRepository struct{}

func (m *MockMetricsRepository) Save(result *domain.CheckResult) error {
	return nil
}

func (m *MockMetricsRepository) GetByTargetID(targetId domain.TargetId, limit int) ([]*domain.CheckResult, error) {
	return []*domain.CheckResult{}, nil
}

// MockCheckRepository - Mock simplificado
type MockCheckRepository struct{}

func (m *MockCheckRepository) Save(result *domain.CheckResult) (*domain.CheckResult, error) {
	return result, nil
}

func (m *MockCheckRepository) GetByTargetID(targetId domain.TargetId, limit int) ([]*domain.CheckResult, error) {
	return []*domain.CheckResult{}, nil
}

// ==================== TESTS ====================

func TestCreateTarget_Success(t *testing.T) {
	// Arrange
	service := NewMonitoringApplicationService(
		NewMockTargetRepository(),
		&MockMetricsRepository{},
		&MockCheckRepository{},
		&MockStatsRepository{},
	)

	userId, _ := userdomain.NewUserId("user-123")
	cmd := CreateTargetCommand{
		UserID:     userId,
		Name:       "Google",
		URL:        "https://google.com",
		TargetType: domain.TargetTypeAPI,
	}

	// Act
	dto, err := service.CreateTarget(cmd)

	// Assert
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if dto == nil {
		t.Fatal("Expected DTO to be created, got nil")
	}

	if dto.Name != "Google" {
		t.Errorf("Expected name 'Google', got: %s", dto.Name)
	}

	if dto.URL != "https://google.com" {
		t.Errorf("Expected URL 'https://google.com', got: %s", dto.URL)
	}
}

func TestGetTargetByID_Unauthorized(t *testing.T) {
	// Arrange
	service := NewMonitoringApplicationService(
		NewMockTargetRepository(),
		&MockMetricsRepository{},
		&MockCheckRepository{},
		&MockStatsRepository{},
	)

	// Crear target con user1
	user1, _ := userdomain.NewUserId("user-1")
	createCmd := CreateTargetCommand{
		UserID:     user1,
		Name:       "Test Target",
		URL:        "https://example.com",
		TargetType: domain.TargetTypeAPI,
	}
	dto, _ := service.CreateTarget(createCmd)

	// Intentar acceder con user2
	user2, _ := userdomain.NewUserId("user-2")
	targetId, _ := domain.NewTargetId(dto.ID)
	query := GetTargetByIDQuery{
		TargetID: targetId,
		UserID:   user2,
	}

	// Act
	result, err := service.GetTargetByID(query)

	// Assert
	if err == nil {
		t.Fatal("Expected authorization error, got nil")
	}

	if result != nil {
		t.Error("Expected nil result for unauthorized access")
	}

	if err.Error() != "unauthorized: user does not own this target" {
		t.Errorf("Expected authorization error message, got: %v", err)
	}
}

func TestGetTargetByID_Authorized(t *testing.T) {
	// Arrange
	service := NewMonitoringApplicationService(
		NewMockTargetRepository(),
		&MockMetricsRepository{},
		&MockCheckRepository{},
		&MockStatsRepository{},
	)

	// Crear target con user1
	user1, _ := userdomain.NewUserId("user-1")
	createCmd := CreateTargetCommand{
		UserID:     user1,
		Name:       "Test Target",
		URL:        "https://example.com",
		TargetType: domain.TargetTypeAPI,
	}
	createdDTO, _ := service.CreateTarget(createCmd)

	// Acceder con el mismo user1
	targetId, _ := domain.NewTargetId(createdDTO.ID)
	query := GetTargetByIDQuery{
		TargetID: targetId,
		UserID:   user1,
	}

	// Act
	result, err := service.GetTargetByID(query)

	// Assert
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if result == nil {
		t.Fatal("Expected DTO, got nil")
	}

	if result.ID != createdDTO.ID {
		t.Errorf("Expected target ID %s, got: %s", createdDTO.ID, result.ID)
	}
}
