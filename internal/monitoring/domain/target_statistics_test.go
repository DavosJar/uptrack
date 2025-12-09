package domain

import (
	"testing"
)

func TestNewTargetStatistics_Success(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewTargetStatistics(targetId)

	if stats == nil {
		t.Fatal("Expected statistics to be created")
	}
	if stats.TargetId() != targetId {
		t.Errorf("Expected targetId %s, got %s", targetId, stats.TargetId())
	}
	if stats.AvgResponseTimeMs() != 0 {
		t.Error("Expected initial avg response time to be 0")
	}
	if stats.TotalChecksCount() != 0 {
		t.Error("Expected initial total checks to be 0")
	}
}

func TestNewFullTargetStatistics_Success(t *testing.T) {
	targetId := TargetId("target-123")
	avgTime := 150
	totalChecks := 100

	stats := NewFullTargetStatistics(targetId, avgTime, totalChecks)

	if stats.AvgResponseTimeMs() != avgTime {
		t.Errorf("Expected avg time %d, got %d", avgTime, stats.AvgResponseTimeMs())
	}
	if stats.TotalChecksCount() != totalChecks {
		t.Errorf("Expected total checks %d, got %d", totalChecks, stats.TotalChecksCount())
	}
}

// FASE 1: COLD START (totalChecks == 0)
func TestUpdateWithNewChecks_ColdStart(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewTargetStatistics(targetId)

	// Primera actualización: arranque en frío
	stats.UpdateWithNewChecks(200, 3)

	if stats.AvgResponseTimeMs() != 200 {
		t.Errorf("Expected avg time 200 in cold start, got %d", stats.AvgResponseTimeMs())
	}
	if stats.TotalChecksCount() != 3 {
		t.Errorf("Expected total checks 3, got %d", stats.TotalChecksCount())
	}
}

// FASE 2: ACCUMULATION (0 < totalChecks < 1080)
func TestUpdateWithNewChecks_Accumulation_WeightedAverage(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewTargetStatistics(targetId)

	// Cold start: 100ms con 10 checks
	stats.UpdateWithNewChecks(100, 10)

	// Acumulación: agregar 200ms con 5 checks
	// Promedio ponderado: (100*10 + 200*5) / (10+5) = 2000/15 = 133.33 ≈ 133
	stats.UpdateWithNewChecks(200, 5)

	expected := 133 // (1000 + 1000) / 15
	if stats.AvgResponseTimeMs() != expected {
		t.Errorf("Expected weighted avg %d, got %d", expected, stats.AvgResponseTimeMs())
	}
	if stats.TotalChecksCount() != 15 {
		t.Errorf("Expected total checks 15, got %d", stats.TotalChecksCount())
	}
}

func TestUpdateWithNewChecks_Accumulation_MultipleUpdates(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewTargetStatistics(targetId)

	// Simular varias actualizaciones en fase de acumulación
	stats.UpdateWithNewChecks(100, 10) // avg=100, total=10
	stats.UpdateWithNewChecks(150, 10) // avg=125, total=20
	stats.UpdateWithNewChecks(200, 10) // avg≈150, total=30

	if stats.TotalChecksCount() != 30 {
		t.Errorf("Expected total checks 30, got %d", stats.TotalChecksCount())
	}

	// El promedio debe estar entre 100 y 200
	avg := stats.AvgResponseTimeMs()
	if avg < 100 || avg > 200 {
		t.Errorf("Expected avg between 100-200, got %d", avg)
	}
}

// FASE 3: STABLE (totalChecks >= 1080) - EMA con alpha=0.997
func TestUpdateWithNewChecks_StableEMA(t *testing.T) {
	targetId := TargetId("target-123")
	// Crear stats en fase estable (≥1080 checks)
	stats := NewFullTargetStatistics(targetId, 150, 1080)

	// Actualizar con nuevo promedio de 200ms
	// EMA: nuevo = 150*0.997 + 200*0.003 = 149.55 + 0.6 = 150.15 ≈ 150
	stats.UpdateWithNewChecks(200, 3)

	// El promedio debe moverse MUY POCO (alpha=0.997 = 99.7% histórico)
	avg := stats.AvgResponseTimeMs()
	if avg < 149 || avg > 151 {
		t.Errorf("Expected EMA to move slightly from 150, got %d", avg)
	}

	// Total checks NO debe crecer en fase estable
	if stats.TotalChecksCount() != 1080 {
		t.Errorf("Expected total checks to stay at 1080, got %d", stats.TotalChecksCount())
	}
}

func TestUpdateWithNewChecks_StableEMA_SignificantChange(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewFullTargetStatistics(targetId, 100, 1080)

	// Actualizar con valor muy diferente (500ms)
	// EMA: 100*0.997 + 500*0.003 = 99.7 + 1.5 = 101.2 ≈ 101
	stats.UpdateWithNewChecks(500, 3)

	avg := stats.AvgResponseTimeMs()
	// Debe moverse muy poco incluso con cambio drástico
	if avg < 100 || avg > 102 {
		t.Errorf("Expected EMA to resist drastic change, got %d", avg)
	}
}

// TEST DE TRANSICIÓN: Accumulation → Stable
func TestUpdateWithNewChecks_TransitionToStable(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewFullTargetStatistics(targetId, 150, 1075) // Cerca del límite

	// Agregar 6 checks → pasa de 1075 a 1081 (entra en fase estable)
	stats.UpdateWithNewChecks(200, 6)

	// Debe seguir en 1081, no en 1087
	if stats.TotalChecksCount() > 1081 {
		t.Errorf("Expected total checks to stabilize around 1080, got %d", stats.TotalChecksCount())
	}
}

// TEST EDGE CASE: Actualizar con 0 checks (no debería cambiar nada)
func TestUpdateWithNewChecks_ZeroChecks(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewFullTargetStatistics(targetId, 150, 100)

	originalAvg := stats.AvgResponseTimeMs()
	originalTotal := stats.TotalChecksCount()

	stats.UpdateWithNewChecks(200, 0)

	if stats.AvgResponseTimeMs() != originalAvg {
		t.Error("Expected avg to remain unchanged with 0 new checks")
	}
	if stats.TotalChecksCount() != originalTotal {
		t.Error("Expected total checks to remain unchanged with 0 new checks")
	}
}

// TEST: Verificar que EMA mantiene estabilidad a largo plazo
func TestUpdateWithNewChecks_LongTermStability(t *testing.T) {
	targetId := TargetId("target-123")
	stats := NewFullTargetStatistics(targetId, 150, 1080)

	// Simular 100 actualizaciones con ruido moderado
	for i := 0; i < 100; i++ {
		// Valores oscilando entre 140-160
		newAvg := 145 + (i % 20) // 145-165 alternando
		stats.UpdateWithNewChecks(newAvg, 3)
	}

	avg := stats.AvgResponseTimeMs()
	// Debe mantenerse cerca de 150 gracias al EMA
	if avg < 145 || avg > 160 {
		t.Errorf("Expected EMA to maintain stability around 150, got %d", avg)
	}
}
