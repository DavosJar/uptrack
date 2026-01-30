use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub method: String,
    pub path: String,
    pub status: i32,
    pub duration_ms: f64,
    pub ip: String,
    pub size: i64,
}
