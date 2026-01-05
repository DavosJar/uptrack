# 🚀 UpTrackAI - Intelligent Monitoring System

<div align="center">

![Go](https://img.shields.io/badge/go-%2300ADD8.svg?style=for-the-badge&logo=go&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

</div>

Sistema de monitoreo inteligente diseñado para detectar cambios de estado reales en servicios, eliminando falsos positivos mediante confirmación adaptativa.

![Arquitectura General](docs/diagrams/img/Diagrama%20de%20Contenedores%20C4%20-%20UpTrackAI.png)

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje:** Go (Golang) 1.21+
- **Framework Web:** Gin
- **ORM:** GORM
- **Base de Datos:** PostgreSQL
- **Arquitectura:** Clean Architecture

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts

### Infraestructura & Docs
- **Contenedores:** Docker & Docker Compose
- **Documentación:** Quarto & Swagger/OpenAPI

## 🚀 Inicialización Rápida

### Opción A: Docker (Recomendado)

Levanta todo el entorno (Base de datos, Backend y Frontend) con un solo comando.

```bash
# Levantar servicios
docker-compose up --build

# Acceder
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
```

### Opción B: Desarrollo Local

Si prefieres ejecutar los servicios individualmente en tu máquina.

#### 1. Backend
Requisito: PostgreSQL corriendo localmente.

```bash
# En la raíz del proyecto
go mod tidy
go run main.go
```

#### 2. Frontend
Requisito: Node.js 18+ y pnpm.

```bash
cd uptrack-gui

# Instalar dependencias
pnpm install

# Configurar entorno (opcional si el backend corre en puerto 8080)
# cp .env.example .env

# Iniciar servidor de desarrollo
pnpm dev
```
Accede al frontend en `http://localhost:5173`.

## 📚 Documentación Detallada

Este proyecto cuenta con una documentación exhaustiva generada con **Quarto**, que incluye:
- Diagramas de arquitectura (C4, Clases, Flujos).
- Detalles de implementación de módulos.
- Guías de base de datos.

Puedes encontrar los archivos fuente en la carpeta `docs/` o visualizar el sitio generado en `docs/_book/index.html`.

---
![Flujo de Monitoreo](docs/diagrams/img/Flujo%20de%20Monitoreo%20-%20UpTrackAI.png)
*Flujo de detección y confirmación de estados*