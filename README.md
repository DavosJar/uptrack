# 🚀 UptracKAI - Intelligent Monitoring System

Sistema de monitoreo inteligente que detecta cambios de estado reales en APIs y servicios. Elimina falsos positivos usando confirmación adaptativa y clasifica problemas en 6 estados: UP, DOWN, DEGRADED, UNSTABLE, FLAPPING, UNKNOWN.

## 🚀 Cómo Correr

### **Docker (Recomendado)**

```bash
# Linux/Mac
./run.sh up

# Windows
.\run.ps1 up

# O directo (funciona en ambos)
docker-compose up
```

Levanta PostgreSQL 17.6 + servidor con hot reload. Cambios en `.go` reinician automáticamente.

**Comandos útiles:**
```bash
./run.sh up-d      # Background
./run.sh logs-app  # Ver logs
./run.sh down      # Detener
./run.sh clean     # Limpiar BD
```

### **Local**
```bash
go run .
