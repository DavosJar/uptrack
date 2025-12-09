package config

import (
	"log"
	"uptrackai/internal/security/presentation"

	"uptrackai/internal/security/infrastructure/jwt"
	"uptrackai/internal/server/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// HTTPHandler interfaz para registrar handlers
type HTTPHandler interface {
	RegisterRoutes(router *gin.RouterGroup)
}

// StartHTTPServer inicia el servidor HTTP con Gin en modo release
// NO recibe Repositories - handlers ya tienen sus dependencias inyectadas
func StartHTTPServer(port string, handlers ...HTTPHandler) {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())

	// CORS middleware - PERMITE TODO
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "false")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check (público, sin autenticación)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "uptrackai",
		})
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Separate public auth routes from protected API routes
	var securityHandler *presentation.SecurityHandler
	var otherHandlers []HTTPHandler

	for _, handler := range handlers {
		if sh, ok := handler.(*presentation.SecurityHandler); ok {
			securityHandler = sh
		} else {
			otherHandlers = append(otherHandlers, handler)
		}
	}

	// Auth routes (públicas - sin middleware de autenticación)
	if securityHandler != nil {
		auth := router.Group("/api/v1")
		securityHandler.RegisterRoutes(auth)
	}

	// API v1 routes (protegidas con middleware)
	v1 := router.Group("/api/v1")
	
	// Inicializar servicio de JWT para el middleware
	tokenService := jwt.NewJWTService()
	v1.Use(middleware.ExtractUserID(tokenService))

	for _, handler := range otherHandlers {
		handler.RegisterRoutes(v1)
	}

	log.Printf("🚀 HTTP Server listening on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}
