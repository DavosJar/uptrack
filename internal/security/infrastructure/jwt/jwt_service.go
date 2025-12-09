package jwt

import (
	"errors"
	"os"
	"time"
	"uptrackai/internal/security/domain"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

var ErrInvalidToken = errors.New("invalid token")

type JWTService struct{}

func NewJWTService() *JWTService {
	return &JWTService{}
}

func jwtSecret() []byte {
	key := os.Getenv("JWT_SECRET")
	if key == "" {
		key = "super-secret-key"
	}
	return []byte(key)
}

type claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwtlib.RegisteredClaims
}

func (s *JWTService) Generate(userID, role string, duration time.Duration) (string, error) {
	c := claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwtlib.RegisteredClaims{
			ExpiresAt: jwtlib.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwtlib.NewNumericDate(time.Now()),
		},
	}
	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, c)
	return token.SignedString(jwtSecret())
}

func (s *JWTService) Parse(tokenStr string) (*domain.TokenClaims, error) {
	token, err := jwtlib.ParseWithClaims(tokenStr, &claims{}, func(token *jwtlib.Token) (interface{}, error) {
		if token.Method.Alg() != jwtlib.SigningMethodHS256.Alg() {
			return nil, ErrInvalidToken
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, ErrInvalidToken
	}
	c, ok := token.Claims.(*claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return &domain.TokenClaims{
		UserID:    c.UserID,
		Role:      c.Role,
		ExpiresAt: c.ExpiresAt.Time,
	}, nil
}
