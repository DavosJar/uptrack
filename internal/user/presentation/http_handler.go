package presentation

// HTTP Handlers

import (
	"uptrackai/internal/app"
	"uptrackai/internal/user/application"

	"net/http"
	"uptrackai/internal/server/middleware"

	"github.com/gin-gonic/gin"
)

// UserHandler - Handler HTTP para usuarios
type UserHandler struct {
	userService *application.Service
}

// NewUserHandler - Constructor del UserHandler
func NewUserHandler(userService *application.Service) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// RegisterRoutes - Registra las rutas del UserHandler
func (h *UserHandler) RegisterRoutes(router *gin.RouterGroup) {
	users := router.Group("/users")
	{
		users.GET("/me", h.GetMe)
		users.PUT("/me", h.CompleteUserProfile)
	}
}

// GetMe - Obtiene el perfil del usuario autenticado
// @Summary Get current user profile
// @Description Retrieve profile information for the authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {object} app.APIResponse{data=application.UserProfileDTO}
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 404 {object} app.APIResponse "User not found"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /users/me [get]
func (h *UserHandler) GetMe(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("User ID not found in context", false))
		return
	}

	dto, err := h.userService.GetUserProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, app.BuildErrorResponse("User not found", false))
		return
	}

	c.JSON(http.StatusOK, app.BuildOKResponse("User profile retrieved successfully", true, dto))

}

// CompleteUserProfile - Completa o actualiza el perfil del usuario autenticado
// @Summary Complete or update user profile
// @Description Complete or update the profile information for the authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Param profile body application.CompleteUserProfileCommand true "Profile data"
// @Success 200 {object} app.APIResponse{data=application.UserProfileDTO}
// @Failure 400 {object} app.APIResponse "Bad request"
// @Failure 401 {object} app.APIResponse "Unauthorized"
// @Failure 404 {object} app.APIResponse "User not found"
// @Failure 500 {object} app.APIResponse "Internal server error"
// @Security BearerAuth
// @Router /users/me [put]
func (h *UserHandler) CompleteUserProfile(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, app.BuildErrorResponse("User ID not found in context", false))
		return
	}

	var cmd application.CompleteUserProfileCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, app.BuildErrorResponse("Invalid request body", false))
		return
	}

	dto, err := h.userService.CompleteUserProfile(userID, cmd)
	if err != nil {
		c.JSON(http.StatusNotFound, app.BuildErrorResponse("User not found", false))
		return
	}

	c.JSON(http.StatusOK, app.BuildOKResponse("User profile updated successfully", true, dto))
}
