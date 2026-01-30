use super::models::LogEntry;
use chrono::Local;
use std::collections::HashMap;
use std::process::Command;
use std::time::Instant;

pub struct Analyzer {
    // Map: (Method, Path) -> (Latencies, ErrorTimestamps)
    stats: HashMap<(String, String), (Vec<f64>, Vec<Instant>)>,
    start_time: Instant,
}

impl Analyzer {
    pub fn new() -> Self {
        Self {
            stats: HashMap::new(),
            start_time: Instant::now(),
        }
    }

    pub fn process_log(&mut self, log: LogEntry) {
        let key = (log.method.clone(), log.path.clone());
        let entry = self.stats.entry(key).or_insert((Vec::new(), Vec::new()));

        // Add latency
        entry.0.push(log.duration_ms as f64);

        // Track error (assuming status >= 400 is an error)
        if log.status >= 400 {
            entry.1.push(Instant::now());
        }
    }

    pub fn display_latency(&self, source_dir: &str) {
        self.clear_screen();
        println!("=== Cortex Performance Dashboard ===");
        println!("Monitoring: {}", source_dir);
        println!("Uptime: {:.1}s", self.start_time.elapsed().as_secs_f64());
        println!("Last Updated: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
        println!(
            "-------------------------------------------------------------------------------------"
        );
        println!(
            "{:<10} {:<30} {:<8} {:<8} {:<8} {:<10}",
            "METHOD", "ENDPOINT", "P50(ms)", "P95(ms)", "P99(ms)", "ERR(%)"
        );
        println!(
            "-------------------------------------------------------------------------------------"
        );

        let mut sorted_endpoints: Vec<(String, String)> = self.stats.keys().cloned().collect();
        sorted_endpoints.sort();

        for (method, path) in sorted_endpoints {
            if let Some((latencies, errors)) = self.stats.get(&(method.clone(), path.clone())) {
                let mut sorted_latencies = latencies.clone();
                sorted_latencies
                    .sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

                let count = sorted_latencies.len();
                let p50 = if count > 0 {
                    sorted_latencies[(count as f64 * 0.50) as usize]
                } else {
                    0.0
                };
                let p95 = if count > 0 {
                    sorted_latencies[(count as f64 * 0.95) as usize]
                } else {
                    0.0
                };
                let p99 = if count > 0 {
                    sorted_latencies[(count as f64 * 0.99) as usize]
                } else {
                    0.0
                };

                // Calculate Error Percentage (Total Errors / Total Requests)
                let error_count = errors.len();
                let error_rate = if count > 0 {
                    (error_count as f64 / count as f64) * 100.0
                } else {
                    0.0
                };

                println!(
                    "{:<10} {:<30} {:<8.2} {:<8.2} {:<8.2} {:<10.2}",
                    method, path, p50, p95, p99, error_rate
                );
            }
        }
        println!(
            "-------------------------------------------------------------------------------------"
        );
    }

    pub fn clear_screen(&self) {
        if cfg!(target_os = "windows") {
            let _ = Command::new("cmd").args(&["/C", "cls"]).status();
        } else {
            let _ = Command::new("clear").status();
        }
    }
}
