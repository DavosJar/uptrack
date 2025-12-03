# 🗺️ UptracKAI - Roadmap to MVP 0.9

**Objetivo**: Producto funcional para despliegue manual con features core completos.  
**v1.0**: Versión producción con membresías, pagos y multi-tenant completo.

**Timeline Total**: 12 semanas (mejor terminar antes que tarde)

---

## 📋 Estado Actual: v0.5-ready

### ✅ Completado (v0.5 - Monitoring Core)
- [x] **Sistema de monitoreo completo** (targets, check_results, metrics, target_statistics)
- [x] **Scheduler básico implementado** (5 min interval fijo)
- [x] **API REST completa** (6 endpoints con application service)
- [x] **Clean Architecture aplicada** (domain, application, infrastructure, presentation)
- [x] **Tests unitarios** (33 tests de dominio + application service)
- [x] **PostgreSQL con 6 tablas** (users, credentials, monitoring_targets, check_results, metrics, target_statistics)
- [x] **HATEOAS y paginación** (listo para FASE 2)
- [x] **Middleware y CORS** completos
- [x] **Arquitectura DDD completa** (domain, infrastructure, presentation, application)
- [x] **Clean Architecture refactorizada** (application layer implementada correctamente)
- [x] **Sistema de usuarios completo**:
  - Tabla `users` con campos: id, email, full_name, avatar_url, timezone, language, timestamps
  - Tabla `credentials` separada con password_hash, login_attempts, lockout, etc.
  - FK constraints y índices únicos
- [x] **Autenticación JWT completa**:
  - Register endpoint con transacciones atómicas
  - Login endpoint con JWT generation
  - Password hashing con bcrypt
  - Account lockout por intentos fallidos
- [x] **APIResponse consistente**:
  - `success` y `message` en todas las respuestas
  - HATEOAS links completos
  - Metadata estructurada
  - Errores estandarizados
- [x] **Middleware de autenticación** (ExtractUserID implementado)
- [x] **Sistema de monitoreo avanzado**:
  - 6 estados de detección (UP, DOWN, DEGRADED, UNSTABLE, FLAPPING, UNKNOWN)
  - Confirmación adaptativa (3-12 pings)
  - Umbrales dinámicos con EMA
  - Optimización de métricas
- [x] **API REST completa** (6 endpoints refactorizados con application service)
- [x] **Autorización implementada** (ownership verification en application layer)
- [x] **PostgreSQL con 4 tablas** (users, credentials, monitoring_targets, check_results, metrics, target_statistics)
- [x] **Scheduler básico** (5 min interval - temporal hasta FASE 2)
- [x] **CORS habilitado**
- [x] **Health check endpoint**
- [x] **Tests unitarios** (33 tests de dominio + application service)
- [x] **Transacciones atómicas** en registro de usuarios
- [x] **HATEOAS completo** en todas las respuestas
- [x] **Paginación simulada** (lista para FASE 2)

---

## 🎯 FASE 1: User System & Autenticación (COMPLETADO ✅)
**Duración real**: 5-7 días  
**Estado**: ✅ FINALIZADO

### ✅ Sub-fase 1.1: User Core (COMPLETADO)
- [x] **1.1.1** Tabla `users` creada ✅
- [x] **1.1.2** Tabla `credentials` creada ✅
- [x] **1.1.3** `internal/user/domain/user.go` implementado ✅
- [x] **1.1.4** `internal/user/infrastructure/postgres/` implementado ✅
- [x] **1.1.5** `internal/user/application/` implementado ✅
- [x] **1.1.6** `internal/auth/domain/` implementado ✅

### ✅ Sub-fase 1.2: Autenticación JWT (COMPLETADO)
- [x] **1.2.1** `internal/auth/infrastructure/postgres/` implementado ✅
- [x] **1.2.2** `internal/auth/application/` implementado ✅
- [x] **1.2.3** JWT implementado (secret, claims, exp 24h) ✅
- [x] **1.2.4** Endpoints `/auth/register` y `/auth/login` ✅
- [x] **1.2.5** Middleware actualizado ✅
- [x] **1.2.6** Constraint único implementado ✅
- [x] **1.2.7** Tests de autenticación implementados ✅

### ✅ Entregable v0.4 (COMPLETADO)
- ✅ Sistema multi-usuario funcional con JWT
- ✅ Users y Credentials separados (seguridad)
- ✅ Endpoints protegidos con ownership verification
- ✅ Un usuario = una URL única (constraint DB)
- ✅ Account lockout por intentos fallidos
- ✅ APIResponse consistente en TODOS los endpoints
- ✅ HATEOAS completo
- ✅ Transacciones atómicas  

---

## 🎯 FASE 2: Scheduling Dinámico (v0.5 → v0.6)
**Duración estimada**: 4-5 días  
**Prioridad**: 🔥 CRÍTICO  
**Estado**: 🔄 PRÓXIMO

### 🔹 Sub-fase 2.1: Database Schema Updates
**Duración**: 1 día

- [ ] **2.1.1** Agregar campos a `monitoring_targets`
  - `check_interval_minutes` (int, default 5)
  - `next_check_at` (timestamp)
  - `last_check_at` (timestamp)
  - `is_active` (boolean, default true)
  
- [ ] **2.1.2** Actualizar migraciones
  - Nueva migración para campos nuevos
  - Índices en `next_check_at` para queries eficientes
  
- [ ] **2.1.3** Actualizar entidades GORM
  - `MonitoringTargetEntity` con nuevos campos
  - Mappers actualizados

### 🔹 Sub-fase 2.2: Domain Logic Updates
**Duración**: 1-2 días

- [ ] **2.2.1** Actualizar `internal/monitoring/domain/monitoring_target.go`
  - Nuevos campos en `MonitoringTarget`
  - Value objects: `CheckInterval`, `NextCheckAt`
  - Methods: `ScheduleNextCheck()`, `IsDueForCheck()`
  
- [ ] **2.2.2** Actualizar `internal/monitoring/domain/check_configuration.go`
  - Integrar interval dinámico
  - Validation de interval (1-60 min)
  
- [ ] **2.2.3** Tests unitarios actualizados
  - Tests para scheduling logic
  - Tests para interval validation

### 🔹 Sub-fase 2.3: Application Layer Updates
**Duración**: 1 día

- [ ] **2.3.1** Actualizar `internal/monitoring/application/commands.go`
  - `CreateTargetCommand` con `check_interval_minutes`
  - `UpdateTargetCommand` con interval updates
  
- [ ] **2.3.2** Actualizar `internal/monitoring/application/service.go`
  - Scheduling logic en application service
  - `ScheduleTargetChecks()` method
  
- [ ] **2.3.3** DTOs actualizados
  - `TargetDTO` con nuevos campos
  - `CreateTargetRequest` con interval

### 🔹 Sub-fase 2.4: Worker Pool Implementation
**Duración**: 1-2 días

- [ ] **2.4.1** Actualizar `internal/scheduler/scheduler.go`
  - Reemplazar interval fijo por dinámico
  - Query targets due: `WHERE next_check_at <= NOW() AND is_active = true`
  - Update `next_check_at` después de cada check
  
- [ ] **2.4.2** Implementar worker pool
  - `internal/scheduler/worker_pool.go`
  - Pool de goroutines (configurable, default 10)
  - Queue de checks pendientes
  - Rate limiting por target
  
- [ ] **2.4.3** Actualizar `internal/scheduler/scheduler_simulator.go`
  - Simulador con scheduling dinámico
  - Tests de concurrencia

### 🔹 Sub-fase 2.5: API Updates
**Duración**: 1 día

- [ ] **2.5.1** Actualizar endpoints
  - `POST /api/v1/targets` - incluir `check_interval_minutes`
  - `PUT /api/v1/targets/{id}` - actualizar interval
  - `GET /api/v1/targets/{id}` - mostrar `next_check_at`
  
- [ ] **2.5.2** Validación de input
  - Interval: 1-60 minutos
  - `is_active` toggle
  
- [ ] **2.5.3** Tests de integración
  - Crear target con interval personalizado
  - Verificar scheduling automático

### Entregable v0.5
✅ Scheduling dinámico funcional  
✅ Worker pool con concurrencia  
✅ Intervals personalizables (1-60 min)  
✅ Queue eficiente de checks  
✅ Rate limiting implementado  

---

## 📧 FASE 3: Sistema de Notificaciones (v0.6)
**Duración estimada**: 2 semanas  
**Prioridad**: ⭐ ALTA

### Tareas
- [ ] **3.1** Crear tablas de notificaciones
  ```sql
  notification_channels (id, user_id, type, config_json, enabled)
  notification_rules (id, target_id, channel_id, notify_on_states)
  ```
  
- [ ] **3.2** Implementar `internal/notifications/domain/`
  - `notification_channel.go` - Email, Webhook, Slack
  - `notification_rule.go` - Qué estados notificar
  
- [ ] **3.3** Servicio de Email (SMTP)
  - Config: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  - Template HTML para alertas
  - Subject: "[UptracKAI] {target_name} is {status}"
  
- [ ] **3.4** Servicio de Webhook
  - POST JSON a URL configurada
  - Payload: target_id, status, timestamp, response_time
  - Retry con backoff (3 intentos)
  
- [ ] **3.5** Integrar en scheduler
  - Después de `handleStableState()` / `handleFlappingState()`
  - Obtener rules del target
  - Enviar notificación a cada canal activo
  
- [ ] **3.6** Endpoints de configuración
  - `POST /api/v1/channels` - Crear canal
  - `GET /api/v1/channels` - Listar mis canales
  - `DELETE /api/v1/channels/:id` - Eliminar canal
  - `POST /api/v1/targets/:id/notifications` - Configurar alertas
  
- [ ] **3.7** Tests de notificaciones
  - Mock SMTP server
  - Mock webhook endpoint
  - Verificar que se envían en cambios de estado

### Entregable v0.6
✅ Notificaciones por email funcionales  
✅ Webhooks configurables  
✅ Reglas por target  

---

## ⚙️ FASE 4: Memberships & Límites (v0.7)
**Duración estimada**: 1 semana  
**Prioridad**: ⭐ ALTA

### Tareas

- [ ] **4.1** Crear tabla `memberships`
  - Campos: id (UUID), user_id (FK unique), plan_name (string), status (enum), targets_limit, checks_per_minute_limit, retention_days, started_at, expires_at, cancelled_at, metadata (JSONB), created_at, updated_at
  - FK constraint: user_id → users.id (unique)
  - Índice en user_id
  
- [ ] **4.2** Crear tabla `security_events` (auditoría)
  - Campos: id (UUID), credential_id (FK), event_type (string), ip_address, user_agent, metadata (JSONB), created_at
  - FK constraint: credential_id → credentials.id
  - Índice en credential_id y created_at
  
- [ ] **4.3** Implementar `internal/membership/domain/`
  - Entity: Membership
  - Value objects: PlanType, MembershipStatus
  - Methods: IsActive(), CanCreateTarget(), CanSetInterval()
  - Repository interface
  
- [ ] **4.4** Implementar `internal/membership/infraestruture/postgres/`
  - MembershipEntity (GORM model)
  - MembershipRepository
  
- [ ] **4.5** Implementar `internal/membership/application/`
  - MembershipApplicationService
  - Queries: GetMembershipByUserIDQuery
  - Commands: CreateMembershipCommand, UpgradePlanCommand
  
- [ ] **4.6** Definir planes por defecto
  ```go
  FREE: targets_limit=5, checks_per_minute=12, retention_days=7, min_interval=5
  PRO: targets_limit=50, checks_per_minute=120, retention_days=30, min_interval=1
  ENTERPRISE: targets_limit=unlimited, checks_per_minute=600, retention_days=365, min_interval=1
  ```
  
- [ ] **4.7** Middleware de validación de límites
  - Verificar antes de `POST /targets`
  - Verificar antes de `PUT /targets/:id/interval`
  - Return 402 Payment Required si excede
  
- [ ] **4.8** Actualizar `GET /auth/me`
  - Incluir membership info (plan, limits, usage)
  
- [ ] **4.9** Seed inicial
  - Crear membership FREE para usuarios existentes
  
- [ ] **4.10** Configuración avanzada por target
  - `custom_headers` JSONB (para APIs con auth)
  - `expected_status_codes` INT[] (no solo 200)
  - `custom_timeout` INT (override del default)
  
- [ ] **4.6** Actualizar DTOs y validaciones
  - Validar headers JSON válido
  - Validar status codes en rango 100-599
  
- [ ] **4.7** Tests de límites
  - Test: usuario FREE intenta crear 6to target → 402
  - Test: usuario FREE intenta interval=1 → 402

### Entregable v0.7
✅ Sistema de planes funcional  
✅ Límites por usuario  
✅ Configuración avanzada de checks  

---

## 🚀 FASE 5: Performance & Escalabilidad (v0.8)
**Duración estimada**: 1-2 semanas  
**Prioridad**: 🟡 MEDIA

### Tareas
- [ ] **5.1** Circuit Breaker
  - Si target falla 3 veces consecutivas → pausar 15 min
  - Después de 15 min → reintentar 1 vez
  - Si falla de nuevo → pausar 1 hora (backoff exponencial)
  
- [ ] **5.2** Índices de DB optimizados
  ```sql
  CREATE INDEX idx_next_check ON monitoring_targets(next_check_at) WHERE next_check_at IS NOT NULL;
  CREATE INDEX idx_user_targets ON monitoring_targets(user_id, url);
  CREATE INDEX idx_metrics_target_time ON metrics(monitoring_target_id, timestamp DESC);
  ```
  
- [ ] **5.3** Connection Pooling PostgreSQL
  - `max_open_conns = 25`
  - `max_idle_conns = 10`
  - `conn_max_lifetime = 5m`
  
- [ ] **5.4** Rate Limiting
  - Middleware: 100 req/min por IP
  - 429 Too Many Requests si excede
  
- [ ] **5.5** Métricas del scheduler
  - Total targets procesados por ciclo
  - Tiempo promedio por check
  - Workers idle vs busy
  - Log cada 1 minuto
  
- [ ] **5.6** Optimización de queries
  - Eager loading de estadísticas en `GET /targets`
  - Paginación en todos los endpoints de lista
  - Limit default = 50, max = 200

- [ ] **5.7** 🌐 Detección de Proveedor de Hosting (Provider Intelligence)
  - Agregar columna `hosting_provider` y `hosting_region` a `monitoring_targets`
  - Implementar `detectProvider()` con DNS lookup + ASN via WHOIS
  - Librería: `github.com/likexian/whois-go`
  - Crear tabla `provider_health` (provider, region, timestamp, metrics agregadas)
  - Job agregador: cada 5 min calcular failure_rate por proveedor
  - Endpoint `GET /api/v1/providers/status` (estado actual de proveedores)
  - Lógica de correlación: Si mi target falla Y provider >30% failure → PROVIDER_ANOMALY
  - Nuevo tipo de alerta con mensaje: "No es tu app, es la infraestructura de {provider}"
  - Evitar spam: Solo 1 notificación por incidente de proveedor
  - **Estrategia "Emergency Ping"**: 
    - Al detectar fallo, lanzar pings inmediatos a 5-10 targets aleatorios del mismo proveedor.
    - Si >30% fallan → Confirmar `PROVIDER_OUTAGE`.
    - Enviar alerta única: "AWS está experimentando problemas, es posible que tu sistema se vea afectado".

### Entregable v0.8
✅ Circuit breaker funcional  
✅ DB optimizada con índices  
✅ Rate limiting  
✅ Sistema escalable para 1000+ targets  
✅ **Provider Intelligence**: Diferencia entre falla de app vs infraestructura  

---

## 🎨 FASE 6: CRUD Completo & Dashboard (v0.9)
**Duración estimada**: 1 semana  
**Prioridad**: 🟡 MEDIA

### Tareas
- [ ] **6.1** Endpoints faltantes
  - `DELETE /api/v1/targets/:id` - Soft delete (add deleted_at)
  - `PUT /api/v1/targets/:id` - Actualizar nombre, URL, config
  - `GET /api/v1/dashboard` - Summary stats del usuario
  
- [ ] **6.2** Dashboard endpoint
  ```json
  {
    "total_targets": 25,
    "up_count": 23,
    "down_count": 1,
    "degraded_count": 1,
    "avg_response_time_ms": 150,
    "uptime_percentage": 92.0
  }
  ```
  
- [ ] **6.3** Paginación en GET /targets
  - Query params: `?page=1&limit=20`
  - Response headers: `X-Total-Count`, `X-Page`, `X-Per-Page`
  
- [ ] **6.4** Filtros en endpoints
  - `GET /targets?status=DOWN` - Solo targets DOWN
  - `GET /targets?search=google` - Buscar por nombre/URL
  
- [ ] **6.5** Soft delete implementation
  - Agregar `deleted_at` TIMESTAMP nullable
  - Queries deben filtrar `WHERE deleted_at IS NULL`
  
- [ ] **6.6** Actualizar documentación OpenAPI
  - Agregar nuevos endpoints
  - Ejemplos de requests/responses
  - Códigos de error completos

### Entregable v0.9
✅ CRUD completo  
✅ Dashboard endpoint  
✅ Paginación y filtros  
✅ API REST 100% funcional  

---

## 🐳 FASE 7: Docker & Deploy Ready (v0.9.5)
**Duración estimada**: 1 semana  
**Prioridad**: 🟢 BAJA

### Tareas
- [ ] **7.1** Dockerfile multi-stage
  ```dockerfile
  FROM golang:1.21 AS builder
  WORKDIR /app
  COPY . .
  RUN go build -o uptrackai .
  
  FROM alpine:latest
  COPY --from=builder /app/uptrackai /uptrackai
  CMD ["/uptrackai"]
  ```
  
- [ ] **7.2** docker-compose.yml
  - Service: app (Go)
  - Service: postgres
  - Service: redis (opcional, para futuro)
  - Networks y volumes
  
- [ ] **7.3** Variables de entorno
  - `.env.example` con todas las vars
  - DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
  - JWT_SECRET, SMTP_*, PORT
  
- [ ] **7.4** Migraciones automáticas
  - Ejecutar `RunMigrations()` al iniciar
  - No ejecutar seed en producción (solo en dev)
  
- [ ] **7.5** Health check mejorado
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "scheduler": "running",
    "version": "0.9.5"
  }
  ```
  
- [ ] **7.6** README completo
  - Instalación local
  - Instalación con Docker
  - Variables de entorno
  - Endpoints disponibles
  - Ejemplos de uso

### Entregable v0.9.5
✅ Dockerizado  
✅ docker-compose funcional  
✅ Listo para desplegar en VPS/Cloud  

---

## 📊 Resumen de Fases

| Fase | Versión | Duración | Features |
|------|---------|----------|----------|
| **FASE 1** | v0.4 | 1-2 sem | Auth JWT, Multi-usuario, Protección de rutas |
| **FASE 2** | v0.5 | 1-2 sem | Scheduling dinámico, Worker pool, Graceful shutdown |
| **FASE 3** | v0.6 | 2 sem | Email, Webhooks, Notificaciones configurables |
| **FASE 4** | v0.7 | 1 sem | Planes FREE/PRO, Límites, Config avanzada |
| **FASE 5** | v0.8 | 1-2 sem | Circuit breaker, Performance, Rate limiting |
| **FASE 6** | v0.9 | 1 sem | CRUD completo, Dashboard, Filtros |
| **FASE 7** | v0.9.5 | 1 sem | Docker, Deploy ready |

**TOTAL ESTIMADO**: 9-12 semanas

> 💡 **Filosofía**: Mejor terminar en 8 semanas que prometer 6 y entregar en 10. Este timeline tiene buffer para aprender y corregir errores.

---

## 🎯 Milestone: MVP 0.9 COMPLETADO

### ✅ Features Core
- [x] Autenticación JWT
- [x] Multi-usuario con límites
- [x] Scheduling dinámico por target
- [x] Worker pool concurrente
- [x] Notificaciones (email + webhook)
- [x] Circuit breaker
- [x] CRUD completo
- [x] Dashboard endpoint
- [x] Dockerizado

### 🚀 Listo para:
- Despliegue manual en VPS
- Testing con usuarios reales
- Feedback loop para v1.0

---

## 🏆 v1.0 - Versión Producción (Post-MVP)

### Features Pendientes para v1.0
- [ ] **Pagos & Suscripciones**
  - Stripe integration
  - Plans con checkout
  - Webhook de Stripe para renovaciones
  - Downgrade automático si falla pago
  
- [ ] **Dashboard Web**
  - Frontend en Angular/React
  - Gráficos en tiempo real
  - Configuración visual
  
- [ ] **Notificaciones avanzadas**
  - Telegram bot
  - Discord webhook
  - PagerDuty integration
  
- [ ] **Reportes**
  - PDF de uptime mensual
  - Status page pública
  - Badges para README
  
- [ ] **Multi-región**
  - Checks desde 3+ ubicaciones
  - Latency por región
  
- [ ] **Observabilidad**
  - Prometheus metrics
  - Grafana dashboards
  - Distributed tracing
  
- [ ] **Admin Panel**
  - Ver todos los usuarios
  - Cambiar planes manualmente
  - Soporte tickets

- [ ] **Provider Intelligence Dashboard** (extensión de v0.8)
  - Mapa de calor de proveedores
  - Status page pública: `status.uptrackai.com`
  - Histórico de outages por proveedor
  - Comparativa de confiabilidad (AWS vs GCP vs Azure)
  - API pública para consultar estado de proveedores

### Estimado v1.0
**Duración adicional**: 8-12 semanas  
**Target**: Producto SaaS completo y monetizable

---

## 📝 Notas

- **Testing**: Agregar tests después de cada fase
- **Deploy continuo**: Usar v0.X en staging, v1.0 en producción
- **Feedback**: Recolectar antes de comprometer features de v1.0
- **Performance**: Monitorear métricas desde v0.8

---

## 💡 Features Innovadoras

### 🌐 Provider Intelligence (v0.8)

**Problema resuelto:**  
"Mi app está caída, ¿es mi código o el hosting?"

**Solución:**  
Detectar el proveedor de hosting (AWS, GCP, Azure, DigitalOcean, etc.) mediante DNS + ASN lookup. Agregar estadísticas de todos los targets del mismo proveedor. Si >30% fallan simultáneamente, clasificar como `PROVIDER_ANOMALY` en lugar de `APP_FAILURE`.

**Value Proposition:**
```
❌ ANTES: "Mi app está DOWN, ¿es mi código? ¿la DB? ¿memoria?"
✅ AHORA: "AWS us-east-1 tiene problemas (67% servicios afectados). 
          NO es tu app, espera a que AWS lo resuelva."
```

**Diferenciación competitiva:**
- Pingdom: ❌ No correlaciona proveedores
- UptimeRobot: ❌ Solo alerta individual
- Datadog: ✅ Sí lo hace, pero $$$$$
- **UptracKAI**: ✅ Lo hace en plan FREE

**Implementación técnica:**
```go
// 1. Detectar proveedor
ip := net.LookupHost("api.miapp.com")
asn := whois.QueryASN(ip) // "AS16509 - Amazon.com, Inc."

// 2. Agregar estadísticas
stats := getProviderStats("AWS", "us-east-1", last5Minutes)

// 3. Clasificar anomalía
if stats.FailureRate > 0.30 {
    alert.Type = "PROVIDER_OUTAGE"
    alert.Message = "Problema de infraestructura, no de tu app"
}
```

**Tabla necesaria:**
```sql
CREATE TABLE provider_health (
    provider_name VARCHAR(100),  -- "AWS", "GCP", "DigitalOcean"
    region VARCHAR(50),          -- "us-east-1", "eu-west-1"
    timestamp TIMESTAMP,
    total_checks INT,
    failed_checks INT,
    avg_response_time_ms INT,
    status VARCHAR(20),          -- HEALTHY, DEGRADED, OUTAGE
    confidence_score FLOAT       -- 0.0 - 1.0
);
```

**ROI:**
- Implementación: 3-4 días
- Diferenciador de marketing: ALTO
- Ahorro de tiempo de debugging: ENORME
- Feature única en el mercado (a este precio)

---

**Última actualización**: 2025-11-24
