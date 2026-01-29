package infrastructure

import (
	"database/sql"
	"fmt"
	"runtime"
	"sync"
	"time"
)

// SelfDiagnostics recopila métricas internas del propio sistema UpTrackAI
type SelfDiagnostics struct {
	db    *sql.DB
	start time.Time
}

type SystemHealth struct {
	Uptime      string `json:"uptime"`
	Goroutines  int    `json:"goroutines"`
	MemoryUsage string `json:"memory_usage_mb"`
	Database    string `json:"database_status"`
	DBOpenConns int    `json:"db_open_conns"`
	LastPanic   string `json:"last_panic,omitempty"` // Para mostrar resiliencia
}

var lastPanicMsg string
var panicLock sync.Mutex

// RecordPanic permite que el middleware global registre si hubo un crash recuperado
func RecordPanic(msg string) {
	panicLock.Lock()
	defer panicLock.Unlock()
	lastPanicMsg = fmt.Sprintf("[%s] %s", time.Now().Format(time.RFC3339), msg)
}

func NewSelfDiagnostics(db *sql.DB) *SelfDiagnostics {
	return &SelfDiagnostics{
		db:    db,
		start: time.Now(),
	}
}

func (s *SelfDiagnostics) CheckHealth() SystemHealth {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	dbStatus := "OK"
	if err := s.db.Ping(); err != nil {
		dbStatus = "CRITICAL: DISCONNECTED"
	}

	panicLock.Lock()
	defer panicLock.Unlock()

	return SystemHealth{
		Uptime:      time.Since(s.start).String(),
		Goroutines:  runtime.NumGoroutine(),                  // Termómetro de concurrencia
		MemoryUsage: fmt.Sprintf("%d MB", m.Alloc/1024/1024), // Uso real de RAM
		Database:    dbStatus,
		DBOpenConns: s.db.Stats().OpenConnections,
		LastPanic:   lastPanicMsg,
	}
}
