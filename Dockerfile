# Stage 1: Development con Air para hot reload
FROM golang:1.25-alpine AS development

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Instalar Air para hot reload
RUN go install github.com/air-verse/air@latest

# Copiar go.mod y go.sum primero (mejor caché)
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 8080

# Comando por defecto: usar Air
CMD ["air", "-c", ".air.toml"]

# Stage 2: Production build
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build optimizado para producción
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Stage 3: Production runtime
FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copiar binario desde builder
COPY --from=builder /app/main .
COPY --from=builder /app/web ./web

EXPOSE 8080

CMD ["./main"]
