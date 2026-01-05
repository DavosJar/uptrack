package domain

// CalculateNewAverage realiza el cálculo matemático puro del nuevo promedio
// Separamos la lógica matemática ("mecanismo") del estado del objeto ("negocio")
func CalculateNewAverage(currentAvg, currentTotalChecks, newAvg, newChecks int) int {
	if currentTotalChecks == 0 {
		return newAvg
	}

	// Fórmula estándar de promedio ponderado:
	// (AvgActual * TotalChecks + AvgNuevo * NuevosChecks) / (TotalChecks + NuevosChecks)
	// El "capping" de TotalChecks (maxChecks) se maneja en el objeto de dominio, no aquí.
	totalWeight := float64(currentTotalChecks + newChecks)
	weightedSum := (float64(currentAvg) * float64(currentTotalChecks)) + (float64(newAvg) * float64(newChecks))

	return int(weightedSum / totalWeight)
}
