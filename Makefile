# --- CONFIGURACIÓN ---
# Aquí definimos el comando. Si arreglas los permisos, borra "sudo".
# Si actualizas a la versión nueva, cambia "docker-compose" por "docker compose".
DC = sudo docker compose -f backend/docker-compose.yml

.PHONY: help docker-up docker-up-d docker-down docker-build docker-logs docker-logs-app docker-logs-db docker-clean docker-restart docker-shell air-local db-connect db-docker test test-verbose build run tidy swagger clean local_dev check-env

help: ## Muestra los comandos disponibles
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Docker Commands (Usan sudo) ---
docker-up: ## Levantar todo (bloquea terminal)
	$(DC) up

docker-up-d: ## Levantar todo en segundo plano (detached)
	$(DC) up -d

docker-down: ## Apagar y remover contenedores
	$(DC) down

docker-build: ## Reconstruir y levantar
	$(DC) up --build

docker-logs: ## Ver logs de todo
	$(DC) logs -f

docker-logs-app: ## Ver logs solo de la app Go
	$(DC) logs -f app

docker-logs-db: ## Ver logs solo de PostgreSQL
	$(DC) logs -f postgres

docker-clean: ## PELIGRO: Borra contenedores y VOLÚMENES (Datos BD)
	$(DC) down -v

docker-restart: ## Reiniciar servicios
	$(DC) restart

docker-shell: ## Entrar a la terminal del contenedor app
	$(DC) exec app sh

# --- Local Development (Sin sudo, ahorra RAM) ---
air-local: ## Correr Air nativo en Linux
	cd backend && air -c .air.toml

check-env: ## Verifica y crea .env si no existe
	@if [ ! -f backend/.env ]; then \
		echo "Creando backend/.env desde .env.example"; \
		cp backend/.env.example backend/.env; \
	fi

local_dev: check-env ## Levanta Postgres en Docker (persistente), y Backend + Frontend en local
	@echo "🛑 Deteniendo contenedor de app (Docker) para liberar puerto 8080..."
	-$(DC) stop app
	@echo "🚀 Levantando base de datos (sin borrar datos)..."
	$(DC) up -d postgres
	@echo "⏳ Esperando a que PostgreSQL esté listo para aceptar conexiones..."
	@until $(DC) exec -T postgres pg_isready -U postgres; do \
		echo "   Esperando a Postgres..."; \
		sleep 2; \
	done
	@echo "✅ Base de datos lista. Iniciando Backend y Frontend..."
	@trap 'kill 0' EXIT; \
	(cd backend && go run main.go) & \
	(cd uptrack-gui && pnpm dev) & \
	wait

# --- Database ---
db-connect: ## Conectar a PG desde el host (requiere psql instalado)
	psql -h localhost -p 5432 -U postgres -d uptrackai

db-docker: ## Conectar a PG dentro del contenedor (Usa sudo)
	$(DC) exec postgres psql -U postgres -d uptrackai

# --- Go Commands (Nativos) ---
test: ## Correr tests
	go test ./...

test-verbose: ## Correr tests con detalles
	go test -v ./...

build: ## Compilar binario para Linux
	go build -o ./tmp/main .

run: ## Correr sin compilar
	go run main.go

tidy: ## Limpiar dependencias
	go mod tidy

swagger: ## Generar docs Swagger
	swag init

# --- Cleanup ---
clean: ## Borrar archivos temporales
	rm -rf tmp/
	rm -f *.log