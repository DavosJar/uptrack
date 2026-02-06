# Cortex Architecture

Cortex is the central nervous system of the observability stack. It is designed as a modular monolith in Rust that ingests, correlates, and acts upon data from multiple sources.

## Core Concept
Instead of disparate monitoring tools, Cortex centralizes intelligence to find correlations between hardware, database, and application performance.

## 🏗 Modular Architecture

### 1. Ingestion Layer (The Senses)
Passive collectors that gather raw data and normalize it into internal events.
- **Log Watcher (Implemented):** Tails structured log files from the Go API.
- **System Monitor (Planned):** Collects CPU, RAM, Disk I/O, and Network stats.
- **DB Monitor (Planned):** Ingests database performance metrics and slow query logs.

### 2. The Cortex (The Brain)
The central processing unit that runs analysis loops.
- **Event Bus:** Asynchronous channel receiving normalized events from all ingestors.
- **Correlator:** Engine that looks for patterns across different data sources (e.g., "High CPU" coincident with "Slow DB Query").
- **Anomaly Detector:** Statistical analysis to flag outliers.

### 3. Action Layer (The Hands)
Reacts to findings from the Cortex.
- **Alerter:** Sends notifications (Console, Slack, Email).
- **Cleaner:** Rotates and cleans old logs based on rules.
- **Mitigator:** (Advanced) Can trigger defensive actions like rate limiting.

## 🚀 Current Status
- [x] **Project Base:** Rust application structure.
- [x] **Log Ingestion:** Watching and parsing JSON logs from Go API.
- [ ] **System Monitoring:** *Pending implementation.*
- [ ] **Correlation Engine:** *Pending implementation.*
