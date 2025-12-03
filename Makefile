# --- CONFIGURACIÓN ---
# Aquí definimos el comando. Si arreglas los permisos, borra "sudo".
# Si actualizas a la versión nueva, cambia "docker-compose" por "docker compose".
DC = sudo docker-compose

.PHONY: help docker-up docker-up-d docker-down docker-build docker-logs docker-logs-app docker-logs-db docker-clean docker-restart docker-shell air-local db-connect db-docker test test-verbose build run tidy swagger clean

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
	air -c .air.toml

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