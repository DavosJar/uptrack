package presentation

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

const RoleContextKey = "role"

// Roles
const (
	RoleAdmin = "ADMIN"
	RoleUser  = "USER"
)

// AuthMiddleware verifica si la seguridad está activa y valida el rol
func AuthMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if os.Getenv("SECURITY_DISABLED") == "true" {
			c.Next()
			return
		}

		role, exists := GetRole(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Role not found in context"})
			return
		}

		if role != requiredRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

// GetRole - Helper para obtener el role del context
func GetRole(c *gin.Context) (string, bool) {
	value, exists := c.Get(RoleContextKey)
	if !exists {
		return "", false
	}

	role, ok := value.(string)
	return role, ok
}
