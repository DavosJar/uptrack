mod api;
mod cli;

use std::process::{self, Command};
use std::sync::{Arc, Mutex};
use std::thread;

// Constants defined early as requested
const LOGS_DIR: &str = "../../logs";

fn clear_screen() {
    if cfg!(target_os = "windows") {
        let _ = Command::new("cmd").args(&["/C", "cls"]).status();
    } else {
        let _ = Command::new("clear").status();
    }
}

fn main() {
    let (tx, rx) = crossbeam_channel::unbounded();

    let analyzer = Arc::new(Mutex::new(api::analyzer::Analyzer::new()));

    // Clear screen once
    clear_screen();
    println!("Starting Log Ingestor...");
    println!("Watching directory: {}", LOGS_DIR);

    // Spawn watcher thread
    thread::spawn(move || {
        if let Err(e) = api::ingestor::watch_logs(LOGS_DIR, tx) {
            eprintln!("Watcher failed: {}", e);
            process::exit(1);
        }
    });

    // Spawn Processor Thread
    let analyzer_clone = Arc::clone(&analyzer);
    thread::spawn(move || {
        for log in rx {
            // Process log silently
            let mut guard = analyzer_clone.lock().unwrap();
            guard.process_log(log);
        }
    });

    // Give threads a moment to start and print initialization messages
    thread::sleep(std::time::Duration::from_millis(100));
    println!(); // Blank line for clarity

    // Start CLI
    cli::run(analyzer, LOGS_DIR);
}
