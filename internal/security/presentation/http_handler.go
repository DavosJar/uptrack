package presentation

import (
	"net/http"
	"time"
	"uptrackai/internal/app"
	secsvc "uptrackai/internal/security/application"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// SecurityHandler implementa HTTPHandler para rutas de autenticación
type SecurityHandler struct {
	Auth AuthService
}

func NewSecurityHandler(auth AuthService) *SecurityHandler {
	return &SecurityHandler{Auth: auth}
}

// RegisterRoutes expone /register y /login
func (h *SecurityHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.POST("/register", RegisterHandler(h.Auth))
	router.POST("/login", LoginHandler(h.Auth))
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required,min=8" example:"password123"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email" example:"user@example.com"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// RegisterHandler maneja el registro de usuario
type AuthService interface {
	Register(input secsvc.RegisterInput) error
	Login(input secsvc.LoginInput) (string, error)
}

// Helpers de respuesta para seguridad usando APIResponse
func AuthSuccessResponse(c *gin.Context, token string) {
	// Parsear el token para obtener la expiración
	var expiresAt *jwt.NumericDate
	if parsedToken, _, err := jwt.NewParser().ParseUnverified(token, jwt.MapClaims{}); err == nil {
		if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok {
			if exp, ok := claims["exp"].(float64); ok {
				expiresAt = &jwt.NumericDate{Time: time.Unix(int64(exp), 0)}
			}
		}
	}

	expiresIn := 3600 // fallback
	if expiresAt != nil {
		expiresIn = int(time.Until(expiresAt.Time).Seconds())
	}

	resp := app.BuildOKResponse("login_success", true, gin.H{"token": token}).
		WithLink("profile", "/profile").
		WithLink("logout", "/logout").
		WithMeta("token_type", "Bearer").
		WithMeta("expires_in", expiresIn)
	c.JSON(http.StatusOK, resp)
}

func RegisterSuccessResponse(c *gin.Context) {
	resp := app.BuildOKResponse("user_registered", true, nil).
		WithLink("login", "/login").
		WithLink("verify_email", "/verify-email").
		WithMeta("next_step", "login").
		WithMeta("message", "User registered successfully. Please login.")
	c.JSON(http.StatusCreated, resp)
}

func AuthErrorResponse(c *gin.Context, status int, code, msg string) {
	resp := app.BuildErrorResponse(msg, false).
		WithMeta("error_code", code).
		WithMeta("timestamp", time.Now().Format(time.RFC3339))
	c.JSON(status, resp)
}

// RegisterHandler maneja el registro de usuario
// @Summary Register a new user
// @Description Register a new user with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "User registration data"
// @Success 201 {object} app.APIResponse "User registered successfully"
// @Failure 400 {object} app.APIResponse "Invalid request"
// @Failure 409 {object} app.APIResponse "User already exists"
// @Router /register [post]
func RegisterHandler(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			AuthErrorResponse(c, http.StatusBadRequest, "invalid_request", err.Error())
			return
		}
		err := svc.Register(secsvc.RegisterInput{Email: req.Email, Password: req.Password})
		if err != nil {
			AuthErrorResponse(c, http.StatusConflict, "register_failed", err.Error())
			return
		}
		RegisterSuccessResponse(c)
	}
}

// LoginHandler maneja el login de usuario
// @Summary Login user
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "User login credentials"
// @Success 200 {object} app.APIResponse "Login successful"
// @Failure 400 {object} app.APIResponse "Invalid request"
// @Failure 401 {object} app.APIResponse "Invalid credentials"
// @Router /login [post]
func LoginHandler(svc AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			AuthErrorResponse(c, http.StatusBadRequest, "invalid_request", err.Error())
			return
		}
		token, err := svc.Login(secsvc.LoginInput{Email: req.Email, Password: req.Password})
		if err != nil {
			AuthErrorResponse(c, http.StatusUnauthorized, "login_failed", err.Error())
			return
		}
		AuthSuccessResponse(c, token)
	}
}
