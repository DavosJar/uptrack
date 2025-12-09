package simulator

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

// StartSimulator inicia un servidor HTTP simulador en puerto 8080
func StartSimulator() {
	http.HandleFunc("/stable", handleStable)
	http.HandleFunc("/slow", handleSlow)
	http.HandleFunc("/unstable", handleUnstable)
	http.HandleFunc("/flapping", handleFlapping)
	http.HandleFunc("/down", handleDown)

	fmt.Println("🎭 Simulador iniciado en http://localhost:8080")
	go http.ListenAndServe(":8080", nil)
}

// handleStable - Siempre responde OK rápido (100-300ms)
func handleStable(w http.ResponseWriter, r *http.Request) {
	delay := 100 + rand.Intn(200)
	time.Sleep(time.Duration(delay) * time.Millisecond)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "stable", "delay": %d}`, delay)
}

// handleSlow - Siempre responde OK pero LENTO (2000-4000ms) → DEGRADED
func handleSlow(w http.ResponseWriter, r *http.Request) {
	delay := 2000 + rand.Intn(2000)
	time.Sleep(time.Duration(delay) * time.Millisecond)
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "slow", "delay": %d}`, delay)
}

// handleUnstable - Alterna entre OK/DOWN pero logra 3 iguales entre 5-9 intentos
var unstableCounter = 0

func handleUnstable(w http.ResponseWriter, r *http.Request) {
	unstableCounter++
	delay := 150 + rand.Intn(100)
	time.Sleep(time.Duration(delay) * time.Millisecond)

	// Patrón: DOWN, UP, DOWN, UP, DOWN, UP, UP, UP (8 pings, 3 UP al final)
	if unstableCounter%8 == 6 || unstableCounter%8 == 7 || unstableCounter%8 == 0 {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status": "unstable_ok", "counter": %d}`, unstableCounter)
	} else {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"status": "unstable_error", "counter": %d}`, unstableCounter)
	}
}

// handleFlapping - Nunca consigue 3 iguales, alterna continuamente
var flappingCounter = 0

func handleFlapping(w http.ResponseWriter, r *http.Request) {
	flappingCounter++
	delay := 100 + rand.Intn(150)
	time.Sleep(time.Duration(delay) * time.Millisecond)

	// Alterna: UP, DOWN, UP, DOWN, UP, DOWN...
	if flappingCounter%2 == 0 {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status": "flapping_ok", "counter": %d}`, flappingCounter)
	} else {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, `{"status": "flapping_error", "counter": %d}`, flappingCounter)
	}
}

// handleDown - Siempre responde 500 (servicio caído)
func handleDown(w http.ResponseWriter, r *http.Request) {
	delay := 50 + rand.Intn(100)
	time.Sleep(time.Duration(delay) * time.Millisecond)
	w.WriteHeader(http.StatusInternalServerError)
	fmt.Fprintf(w, `{"status": "down", "error": "Service unavailable"}`)
}
