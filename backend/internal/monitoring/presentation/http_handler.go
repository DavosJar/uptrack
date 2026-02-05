package presentation

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"uptrackai/internal/app"
	"uptrackai/internal/monitoring/application"
	"uptrackai/internal/monitoring/domain"
	"uptrackai/internal/server/middleware"

	"github.com/gin-gonic/gin"
)

// Helper functions for consistent API responses
func buildMonitoringErrorResponse(c *gin.Context, status int, code, msg string) {
	resp := app.BuildErrorResponse(msg, false).
		WithMeta("error_code", code).
		WithMeta("timestamp", time.Now().Format(time.RFC3339))
	c.JSON(status, resp)
}

func buildMonitoringOKResponse(c *gin.Context, status int, message string, data interface{}) app.APIResponse {
	return app.BuildOKResponse(message, true, data)
}

type MonitoringHandler struct {
	appService *application.MonitoringApplicationService
}

func NewMonitoringHandler(appService *application.MonitoringApplicationService) *MonitoringHandler {
	return &MonitoringHandler{appService: appService}
}

// RegisterRoutes registra las rutas del handler
func (h *MonitoringHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/targets", h.GetAllTargets)
	router.POST("/targets", h.CreateTarget)
	router.DELETE("/targets/:id", h.DeleteTarget)
	router.PATCH("/targets/:id/toggle", h.ToggleActive)
	router.PUT("/targets/:id/configuration", h.UpdateConfiguration)
	router.GET("/targets/:id", h.GetTargetByID)
	router.GET("/targets/:id/metrics", h.GetTargetMetrics)
	router.GET("/targets/:id/history", h.GetTargetHistory)
	router.GET("/targets/:id/statistics", h.GetTargetStatistics)
}

// GetAllTargets obtiene todos los targets de monitoreo
// @Summary Get all monitoring targets
// @Description Retrieve a paginated list of all monitoring targets for the authenticated user
// @Tags monitoring
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} app.APIResponse{data=[]TargetResponse}
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /targets [get]
func (h *MonitoringHandler) GetAllTargets(c *gin.Context) {
	// Obtener userId y role del context (puesto por middleware)
	userId, exists := middleware.GetUserID(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "user_id_missing", "User ID not found in context")
		return
	}

	role, exists := middleware.GetRole(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "role_missing", "Role not found in context")
		return
	}

	// Parsear parámetros de paginación (opcional por ahora)
	page := 1
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	limit := 20
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Ejecutar query a través de application service (retorna DTOs)
	query := application.GetAllTargetsQuery{
		UserID: userId,
		Role:   role,
	}
	dtos, err := h.appService.GetAllTargets(query)
	if err != nil {
		buildMonitoringErrorResponse(c, http.StatusInternalServerError, "fetch_targets_failed", "Failed to fetch targets")
		return
	}

	// Retornar con HATEOAS y paginación (simulada - en FASE 2 será real)
	response := app.BuildOKResponse("targets_retrieved", true, dtos).
		WithLink("self", "/api/v1/targets").
		WithPagination("/api/v1/targets", page, limit, len(dtos))
	c.JSON(http.StatusOK, response)
}

// CreateTarget crea un nuevo target de monitoreo
// @Summary Create a new monitoring target
// @Description Create a new monitoring target for the authenticated user
// @Tags monitoring
// @Accept json
// @Produce json
// @Param request body CreateTargetRequest true "Target creation data"
// @Success 201 {object} app.APIResponse{data=TargetResponse}
// @Failure 400 {object} app.APIResponse "Invalid request"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /targets [post]
func (h *MonitoringHandler) CreateTarget(c *gin.Context) {
	// Parsear request
	var req CreateTargetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obtener userId del context
	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Ejecutar command a través de application service
	cmd := application.CreateTargetCommand{
		UserID:     userId,
		Name:       req.Name,
		URL:        req.URL,
		TargetType: domain.TargetType(req.Type),
	}
	dto, err := h.appService.CreateTarget(cmd)
	if err != nil {
		if strings.Contains(err.Error(), "objetivo duplicado") {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear el objetivo: " + err.Error()})
		return
	}

	// Retornar con HATEOAS
	response := app.BuildOKResponse("target_created", true, dto).
		WithLink("self", "/api/v1/targets/"+dto.ID).
		WithLink("metrics", "/api/v1/targets/"+dto.ID+"/metrics").
		WithLink("history", "/api/v1/targets/"+dto.ID+"/history").
		WithLink("statistics", "/api/v1/targets/"+dto.ID+"/statistics")
	c.JSON(http.StatusCreated, response)
}

// DeleteTarget elimina un target existente
// @Summary Delete monitoring target
// @Description Delete a specific monitoring target. User must own the target.
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Success 200 {object} app.APIResponse "Target deleted successfully"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 404 {object} app.APIResponse "Target not found"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /targets/{id} [delete]
func (h *MonitoringHandler) DeleteTarget(c *gin.Context) {
	userId, exists := middleware.GetUserID(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "user_id_missing", "User ID not found in context")
		return
	}

	role, exists := middleware.GetRole(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "role_missing", "Role not found in context")
		return
	}

	targetID := c.Param("id")
	if targetID == "" {
		buildMonitoringErrorResponse(c, http.StatusBadRequest, "invalid_id", "Target ID is required")
		return
	}

	cmd := application.DeleteTargetCommand{
		TargetID: domain.TargetId(targetID),
		UserID:   userId,
		Role:     role,
	}

	if err := h.appService.DeleteTarget(cmd); err != nil {
		// Aquí podríamos mapear mejor los errores (ej. not found vs unauthorized)
		// Por ahora simplificado.
		if err.Error() == "unauthorized: user does not own this target" {
			buildMonitoringErrorResponse(c, http.StatusForbidden, "forbidden", err.Error())
			return
		}
		// Idealmente el servicio debería retornar un error tipado para saber si es NotFound
		buildMonitoringErrorResponse(c, http.StatusInternalServerError, "delete_failed", "Failed to delete target: "+err.Error())
		return
	}

	response := app.BuildOKResponse("Target deleted successfully", true, nil)
	c.JSON(http.StatusOK, response)
}

// ToggleActive activa o desactiva un target
// @Summary Toggle monitoring target active status
// @Description Activate or deactivate a specific monitoring target. User must own the target.
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Param body body ToggleActiveRequest true "Toggle request body"
// @Success 200 {object} app.APIResponse "Target status toggled successfully"
// @Failure 400 {object} app.APIResponse "Bad request"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 403 {object} app.APIResponse "Forbidden"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /targets/{id}/toggle [patch]
func (h *MonitoringHandler) ToggleActive(c *gin.Context) {
	userId, exists := middleware.GetUserID(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "user_id_missing", "User ID not found in context")
		return
	}

	role, exists := middleware.GetRole(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "role_missing", "Role not found in context")
		return
	}

	targetID := c.Param("id")
	if targetID == "" {
		buildMonitoringErrorResponse(c, http.StatusBadRequest, "invalid_id", "Target ID is required")
		return
	}

	var requestBody struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		buildMonitoringErrorResponse(c, http.StatusBadRequest, "invalid_body", "Invalid request body")
		return
	}

	cmd := application.ToggleActiveCommand{
		TargetID: domain.TargetId(targetID),
		UserID:   userId,
		Role:     role,
		IsActive: requestBody.IsActive,
	}

	if err := h.appService.ToggleActive(cmd); err != nil {
		if err.Error() == "unauthorized: user does not own this target" {
			buildMonitoringErrorResponse(c, http.StatusForbidden, "forbidden", err.Error())
			return
		}
		buildMonitoringErrorResponse(c, http.StatusInternalServerError, "toggle_failed", "Failed to toggle target status: "+err.Error())
		return
	}

	statusText := "deactivated"
	if requestBody.IsActive {
		statusText = "activated"
	}

	response := app.BuildOKResponse("Target "+statusText+" successfully", true, nil)
	c.JSON(http.StatusOK, response)
}

// UpdateConfiguration actualiza la configuración de un target
// @Summary Update monitoring target configuration
// @Description Update configuration settings for a specific monitoring target. User must own the target.
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Param body body UpdateConfigurationRequest true "Configuration update body"
// @Success 200 {object} app.APIResponse{data=TargetDetailResponse} "Configuration updated successfully"
// @Failure 400 {object} app.APIResponse "Bad request"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 403 {object} app.APIResponse "Forbidden"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /targets/{id}/configuration [put]
func (h *MonitoringHandler) UpdateConfiguration(c *gin.Context) {
	userId, exists := middleware.GetUserID(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "user_id_missing", "User ID not found in context")
		return
	}

	role, exists := middleware.GetRole(c)
	if !exists {
		buildMonitoringErrorResponse(c, http.StatusUnauthorized, "role_missing", "Role not found in context")
		return
	}

	targetID := c.Param("id")
	if targetID == "" {
		buildMonitoringErrorResponse(c, http.StatusBadRequest, "invalid_id", "Target ID is required")
		return
	}

	var requestBody struct {
		TimeoutSeconds       int  `json:"timeout_seconds" binding:"required,min=1,max=60"`
		RetryCount           int  `json:"retry_count" binding:"required,min=0,max=10"`
		RetryDelaySeconds    int  `json:"retry_delay_seconds" binding:"required,min=1,max=60"`
		CheckIntervalSeconds int  `json:"check_interval_seconds" binding:"required,min=30,max=3600"`
		AlertOnFailure       bool `json:"alert_on_failure"`
		AlertOnRecovery      bool `json:"alert_on_recovery"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		buildMonitoringErrorResponse(c, http.StatusBadRequest, "invalid_body", "Invalid request body: "+err.Error())
		return
	}

	cmd := application.UpdateConfigurationCommand{
		TargetID:             domain.TargetId(targetID),
		UserID:               userId,
		Role:                 role,
		TimeoutSeconds:       requestBody.TimeoutSeconds,
		RetryCount:           requestBody.RetryCount,
		RetryDelaySeconds:    requestBody.RetryDelaySeconds,
		CheckIntervalSeconds: requestBody.CheckIntervalSeconds,
		AlertOnFailure:       requestBody.AlertOnFailure,
		AlertOnRecovery:      requestBody.AlertOnRecovery,
	}

	dto, err := h.appService.UpdateConfiguration(cmd)
	if err != nil {
		if err.Error() == "unauthorized: user does not own this target" {
			buildMonitoringErrorResponse(c, http.StatusForbidden, "forbidden", err.Error())
			return
		}
		buildMonitoringErrorResponse(c, http.StatusInternalServerError, "update_failed", "Failed to update configuration: "+err.Error())
		return
	}

	response := app.BuildOKResponse("Configuration updated successfully", true, dto)
	c.JSON(http.StatusOK, response)
}

// GetTargetByID obtiene un target específico por ID (con configuración)
// @Summary Get monitoring target by ID
// @Description Retrieve detailed information about a specific monitoring target
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Success 200 {object} app.APIResponse{data=TargetDetailResponse}
// @Failure 400 {object} app.APIResponse "Invalid target ID"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 404 {object} app.APIResponse "Target not found"
// @Security BearerAuth
// @Router /targets/{id} [get]
func (h *MonitoringHandler) GetTargetByID(c *gin.Context) {
	// Parsear ID del path
	idStr := c.Param("id")
	targetId, err := domain.NewTargetId(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID format"})
		return
	}

	// Obtener userId del context
	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Ejecutar query a través de application service (retorna DTO)
	query := application.GetTargetByIDQuery{
		TargetID: targetId,
		UserID:   userId,
	}
	dto, err := h.appService.GetTargetByID(query)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Retornar con HATEOAS
	response := app.BuildOKResponse("target_retrieved", true, dto).
		WithLink("self", "/api/v1/targets/"+idStr).
		WithLink("metrics", "/api/v1/targets/"+idStr+"/metrics").
		WithLink("history", "/api/v1/targets/"+idStr+"/history").
		WithLink("statistics", "/api/v1/targets/"+idStr+"/statistics")
	c.JSON(http.StatusOK, response)
}

// GetTargetMetrics obtiene el historial de métricas de un target
// @Summary Get target metrics
// @Description Retrieve metrics history for a specific monitoring target
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(100)
// @Success 200 {object} app.APIResponse{data=[]MetricResponse}
// @Failure 400 {object} app.APIResponse "Invalid target ID"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 403 {object} app.APIResponse "Forbidden"
// @Security BearerAuth
// @Router /targets/{id}/metrics [get]
func (h *MonitoringHandler) GetTargetMetrics(c *gin.Context) {
	// Parsear ID del path
	idStr := c.Param("id")
	targetId, err := domain.NewTargetId(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID format"})
		return
	}

	// Obtener userId del context
	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Parsear parámetros de paginación
	page := 1
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	limit := 100
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Ejecutar query a través de application service (retorna DTOs)
	query := application.GetTargetMetricsQuery{
		TargetID: targetId,
		UserID:   userId,
		Limit:    limit,
	}
	dtos, err := h.appService.GetTargetMetrics(query)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	// Retornar con HATEOAS y paginación
	baseURL := "/api/v1/targets/" + idStr + "/metrics"
	response := app.BuildOKResponse("target_metrics_retrieved", true, dtos).
		WithLink("self", baseURL).
		WithLink("target", "/api/v1/targets/"+idStr).
		WithPagination(baseURL, page, limit, len(dtos))
	c.JSON(http.StatusOK, response)
}

// GetTargetHistory obtiene el historial de cambios de estado (check results)
// @Summary Get target status history
// @Description Retrieve status change history for a specific monitoring target
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(50)
// @Success 200 {object} app.APIResponse{data=[]CheckResultResponse}
// @Failure 400 {object} app.APIResponse "Invalid target ID"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 403 {object} app.APIResponse "Forbidden"
// @Security BearerAuth
// @Router /targets/{id}/history [get]
func (h *MonitoringHandler) GetTargetHistory(c *gin.Context) {
	// Parsear ID del path
	idStr := c.Param("id")
	targetId, err := domain.NewTargetId(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID format"})
		return
	}

	// Obtener userId del context
	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Parsear parámetros de paginación
	page := 1
	if pageParam := c.Query("page"); pageParam != "" {
		if parsedPage, err := strconv.Atoi(pageParam); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	limit := 50
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Ejecutar query a través de application service (retorna DTOs)
	query := application.GetTargetHistoryQuery{
		TargetID: targetId,
		UserID:   userId,
		Limit:    limit,
	}
	dtos, err := h.appService.GetTargetHistory(query)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	// Retornar con HATEOAS y paginación
	baseURL := "/api/v1/targets/" + idStr + "/history"
	response := app.BuildOKResponse("target_history_retrieved", true, dtos).
		WithLink("self", baseURL).
		WithLink("target", "/api/v1/targets/"+idStr).
		WithPagination(baseURL, page, limit, len(dtos))
	c.JSON(http.StatusOK, response)
}

// GetTargetStatistics obtiene las estadísticas agregadas de un target
// @Summary Get target statistics
// @Description Retrieve aggregated statistics for a specific monitoring target
// @Tags monitoring
// @Accept json
// @Produce json
// @Param id path string true "Target ID"
// @Success 200 {object} app.APIResponse{data=StatisticsResponse}
// @Failure 400 {object} app.APIResponse "Invalid target ID"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 403 {object} app.APIResponse "Forbidden"
// @Security BearerAuth
// @Router /targets/{id}/statistics [get]
func (h *MonitoringHandler) GetTargetStatistics(c *gin.Context) {
	// Parsear ID del path
	idStr := c.Param("id")
	targetId, err := domain.NewTargetId(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID format"})
		return
	}

	// Obtener userId del context
	userId, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Ejecutar query a través de application service (retorna DTO)
	query := application.GetTargetStatisticsQuery{
		TargetID: targetId,
		UserID:   userId,
	}
	dto, err := h.appService.GetTargetStatistics(query)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	// Retornar con HATEOAS
	response := app.BuildOKResponse("target_statistics_retrieved", true, dto).
		WithLink("self", "/api/v1/targets/"+idStr+"/statistics").
		WithLink("target", "/api/v1/targets/"+idStr).
		WithLink("metrics", "/api/v1/targets/"+idStr+"/metrics").
		WithLink("history", "/api/v1/targets/"+idStr+"/history")
	c.JSON(http.StatusOK, response)
}
