# Cortex Development Roadmap

Technical roadmap to finalize `cortex` as a complete monitoring solution for `healthapi`.

---

## ✅ Phase 1: API Performance Monitoring (COMPLETED)
*Goal: Real-time API metrics with high precision*

- [x] **Data Structure**: Implemented `HashMap<(Method, Path), StatsAccumulator>` in memory
- [x] **Percentile Calculation**: P90, P95, P99 latency tracking
- [x] **Error Tracking**: Error Rate (%) per endpoint
- [x] **Float Precision**: Sub-millisecond latency (0.45ms)
- [x] **Fast-Fail Pattern**: Clean code without nested ifs
- [x] **Interactive CLI**: On-demand metrics via `latency` command
- [x] **Preload**: 10-minute historical data on startup
- [x] **Architecture**: Domain-based structure (`api/`, `cli/`)

---

## 🚧 Phase 2: System Monitoring (The Context)
*Goal: Correlate API performance with infrastructure health*

- [ ] **System Ingestor** (`src/system/ingestor.rs`)
  - [ ] Integrate `sysinfo` crate
  - [ ] Poll CPU %, RAM usage, Disk I/O every 5 seconds
  - [ ] Send metrics to analyzer via channel

- [ ] **System Analyzer** (`src/system/analyzer.rs`)
  - [ ] Track resource usage trends
  - [ ] Detect spikes and anomalies
  - [ ] Calculate moving averages

- [ ] **CLI Integration**
  - [ ] Add `system` command to display current stats
  - [ ] Show historical trends (last 10 minutes)
  - [ ] Add system health header to `latency` dashboard

---

## 🚧 Phase 3: Persistence (The Memory)
*Goal: Survive restarts without losing metrics*

- [ ] **Snapshot Module** (`src/persistence/snapshot.rs`)
  - [ ] Serialize `Analyzer` state to JSON every 1 minute
  - [ ] Save to `data/stats_snapshot.json`
  - [ ] Load snapshot on startup if exists
  - [ ] Handle corruption gracefully

- [ ] **Configuration**
  - [ ] Add `.env` support for configurable paths
  - [ ] Define retention policies (snapshot age, log age)
  - [ ] Make preload window configurable

---

## 🚧 Phase 4: Correlation Engine (The Brain)
*Goal: Find patterns across API + System metrics*

- [ ] **Event Bus** (`src/core/event_bus.rs`)
  - [ ] Unified event stream from all ingestors
  - [ ] Timestamp-based correlation window
  - [ ] Event prioritization

- [ ] **Correlator** (`src/core/correlator.rs`)
  - [ ] Rule: "High latency" + "High CPU" → Alert
  - [ ] Rule: "Error spike" + "Low memory" → Alert
  - [ ] Pattern matching rules engine
  - [ ] Root cause suggestions

- [ ] **CLI Integration**
  - [ ] Add `correlations` command
  - [ ] Display recent findings
  - [ ] Show suggested actions

---

## 🚧 Phase 5: Alerting & Actions (The Hands)
*Goal: Proactive notifications and automated responses*

- [ ] **Alerter** (`src/actions/alerter.rs`)
  - [ ] Console alerts with colored output
  - [ ] Webhook support (Slack, Discord)
  - [ ] Email notifications
  - [ ] Alert deduplication

- [ ] **Cleaner** (`src/actions/cleaner.rs`)
  - [ ] Auto-delete logs older than N days
  - [ ] Configurable retention rules
  - [ ] Safe cleanup with verification

- [ ] **CLI Integration**
  - [ ] Add `alerts` command to view active alerts
  - [ ] Add `silence <alert_id>` to mute alerts
  - [ ] Add `clean` command for manual cleanup

---

## 🚧 Phase 6: Database Monitoring (Optional)
*Goal: Complete observability stack*

- [ ] **DB Ingestor** (`src/db/ingestor.rs`)
  - [ ] Parse slow query logs
  - [ ] Track connection pool stats
  - [ ] Monitor query latency

- [ ] **DB Analyzer** (`src/db/analyzer.rs`)
  - [ ] Identify slow queries
  - [ ] Detect connection leaks
  - [ ] Query pattern analysis

- [ ] **CLI Integration**
  - [ ] Add `db` command for database health
  - [ ] Show slow queries
  - [ ] Display connection pool status

---

## Definition of Done

Cortex runs as a standalone monitoring daemon that:
1. **Ingests** logs from API, system metrics, and optionally DB
2. **Analyzes** performance with percentiles and trends
3. **Correlates** issues across layers (e.g., "Slow API due to high CPU")
4. **Alerts** on anomalies via console/webhooks
5. **Persists** state to survive restarts
6. **Cleans** old data automatically

---

## Next Steps

**Immediate Priority:** Phase 2 - System Monitoring
- Start with CPU/RAM tracking
- Integrate with existing CLI
- Prepare for correlation engine
