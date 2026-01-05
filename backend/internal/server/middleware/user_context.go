package middleware

import (
	"net/http"
	"strings"
	"uptrackai/internal/security/domain"
	userdomain "uptrackai/internal/user/domain"

	"github.com/gin-gonic/gin"
)

const (
	UserIDContextKey = "userId"
	RoleContextKey   = "role"
)

// ExtractUserID - Middleware que extrae el userId del JWT
func ExtractUserID(tokenGen domain.TokenGenerator) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := tokenGen.Parse(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		userId, err := userdomain.NewUserId(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		c.Set(UserIDContextKey, userId)
		c.Set(RoleContextKey, claims.Role)
		c.Next()
	}
}

// GetUserID - Helper para obtener el userId del context
func GetUserID(c *gin.Context) (userdomain.UserId, bool) {
	value, exists := c.Get(UserIDContextKey)
	if !exists {
		return "", false
	}

	userId, ok := value.(userdomain.UserId)
	return userId, ok
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
