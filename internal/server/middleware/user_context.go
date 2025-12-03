package middleware

import (
	"strings"
	"uptrackai/internal/security"
	"uptrackai/internal/user/domain"

	"github.com/gin-gonic/gin"
)

const UserIDContextKey = "userId"

// ExtractUserID - Middleware que extrae el userId del JWT
func ExtractUserID() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header required"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := security.ParseJWT(token)
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
			return
		}

		userId, err := domain.NewUserId(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid user ID in token"})
			return
		}

		c.Set(UserIDContextKey, userId)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// GetUserID - Helper para obtener el userId del context
func GetUserID(c *gin.Context) (domain.UserId, bool) {
	value, exists := c.Get(UserIDContextKey)
	if !exists {
		return "", false
	}

	userId, ok := value.(domain.UserId)
	return userId, ok
}

// GetRole - Helper para obtener el role del context
func GetRole(c *gin.Context) (string, bool) {
	value, exists := c.Get("role")
	if !exists {
		return "", false
	}

	role, ok := value.(string)
	return role, ok
}
