use crate::api::analyzer::Analyzer;
use std::io::{self, Write};
use std::sync::{Arc, Mutex};

pub fn run(analyzer: Arc<Mutex<Analyzer>>, logs_dir: &str) {
    loop {
        print!("> ");
        io::stdout().flush().unwrap();

        let mut input = String::new();
        if io::stdin().read_line(&mut input).is_err() {
            println!("Error reading command");
            continue;
        }

        let command = input.trim();
        match command {
            "latency" => {
                let guard = analyzer.lock().unwrap();
                guard.display_latency(logs_dir);
            }
            "quit" | "exit" => {
                println!("Exiting Cortex...");
                break;
            }
            "help" => {
                println!("Available commands:");
                println!("  latency - Show performance metrics (P90, P95, P99, Error Rate)");
                println!("  exit    - Quit the application");
            }
            "" => {} // Ignore empty
            _ => {
                println!("Unknown command: '{}'. Type 'help' for commands.", command);
            }
        }
    }
}
