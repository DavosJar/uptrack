use crossbeam_channel::Sender;
use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::io::{self, BufRead, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::time::Duration;

use super::models::LogEntry;

pub fn watch_logs(dir_path: &str, sender: Sender<LogEntry>) -> Result<(), Box<dyn Error>> {
    let path = Path::new(dir_path);

    if !path.exists() {
        return Err(format!("Directory not found: {}", dir_path).into());
    }

    let (tx, rx) = crossbeam_channel::unbounded();

    let mut watcher = RecommendedWatcher::new(
        tx,
        Config::default().with_poll_interval(Duration::from_secs(1)),
    )?;

    watcher.watch(path, RecursiveMode::NonRecursive)?;
    println!("Watching directory: {:?}", path);

    let mut file_offsets: HashMap<PathBuf, u64> = HashMap::new();

    preload_recent_logs(path, &mut file_offsets, &sender);

    for res in rx {
        let event = match res {
            Ok(event) => event,
            Err(e) => {
                eprintln!("Watch error: {:?}", e);
                continue;
            }
        };

        match event.kind {
            EventKind::Modify(_) => {
                process_event_paths(&event.paths, &mut file_offsets, &sender, false)?;
            }
            EventKind::Create(_) => {
                process_event_paths(&event.paths, &mut file_offsets, &sender, true)?;
            }
            _ => {}
        }
    }

    Ok(())
}

fn preload_recent_logs(
    path: &Path,
    file_offsets: &mut HashMap<PathBuf, u64>,
    sender: &Sender<LogEntry>,
) {
    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(e) => {
            eprintln!("Failed to read directory: {}", e);
            return;
        }
    };

    let mut log_files: Vec<PathBuf> = entries
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("log"))
        .collect();

    println!("Found {} log files", log_files.len());

    // Sort by modification time, newest first
    log_files.sort_by_key(|p| {
        fs::metadata(p)
            .and_then(|m| m.modified())
            .ok()
            .map(|t| std::cmp::Reverse(t))
    });

    // Calculate cutoff time (10 minutes ago)
    let ten_minutes_ago = chrono::Local::now() - chrono::Duration::minutes(10);
    println!(
        "Loading logs from after: {}",
        ten_minutes_ago.format("%Y-%m-%d %H:%M:%S")
    );

    let mut total_loaded = 0;

    for log_file in log_files {
        let file = match fs::File::open(&log_file) {
            Ok(f) => f,
            Err(_) => continue,
        };

        let reader = io::BufReader::new(file);
        let mut entries_to_send = Vec::new();

        for line in reader.lines().flatten() {
            // Fast-fail: Skip empty lines
            if line.trim().is_empty() {
                continue;
            }

            // Fast-fail: Skip unparseable lines
            let entry = match serde_json::from_str::<LogEntry>(&line) {
                Ok(e) => e,
                Err(e) => {
                    eprintln!("Failed to parse log entry: {}", e);
                    continue;
                }
            };

            // Fast-fail: Skip if timestamp can't be parsed
            let timestamp = match chrono::DateTime::parse_from_rfc3339(&entry.timestamp) {
                Ok(t) => t,
                Err(e) => {
                    eprintln!("Failed to parse timestamp '{}': {}", entry.timestamp, e);
                    continue;
                }
            };

            // Fast-fail: Skip if older than 10 minutes
            if timestamp.with_timezone(&chrono::Local) < ten_minutes_ago {
                continue;
            }

            entries_to_send.push(entry);
        }

        // Send preloaded entries
        for entry in entries_to_send {
            let _ = sender.send(entry);
            total_loaded += 1;
        }

        // Set offset to end of file for future monitoring
        if let Ok(metadata) = fs::metadata(&log_file) {
            file_offsets.insert(log_file, metadata.len());
        }
    }

    println!("Preloaded {} logs from last 10 minutes", total_loaded);
}

fn process_event_paths(
    paths: &[PathBuf],
    file_offsets: &mut HashMap<PathBuf, u64>,
    sender: &Sender<LogEntry>,
    is_new_file: bool,
) -> Result<(), Box<dyn Error>> {
    for path in paths {
        // Fast-fail: Skip non-.log files
        if path.extension().and_then(|s| s.to_str()) != Some("log") {
            continue;
        }

        if is_new_file {
            println!("New log file created: {:?}", path);
            file_offsets.insert(path.clone(), 0);
        }

        read_new_content(path, file_offsets, sender)?;
    }
    Ok(())
}

fn read_new_content(
    path: &PathBuf,
    offsets: &mut HashMap<PathBuf, u64>,
    sender: &Sender<LogEntry>,
) -> Result<(), Box<dyn Error>> {
    let mut file = fs::File::open(path)?;
    let current_len = file.metadata()?.len();
    let offset = offsets.entry(path.clone()).or_insert(0);

    // Handle file truncation/rotation
    if current_len < *offset {
        *offset = 0;
    }

    // Fast-fail: No new content to read
    if current_len <= *offset {
        return Ok(());
    }

    file.seek(SeekFrom::Start(*offset))?;
    let reader = io::BufReader::new(file);

    for line in reader.lines() {
        let line = line?;

        // Fast-fail: Skip empty lines
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<LogEntry>(&line) {
            Ok(entry) => {
                let _ = sender.send(entry);
            }
            Err(e) => eprintln!("Parse error: {} in line: {}", e, line),
        }
    }

    // Update offset to current length
    *offset = current_len;
    Ok(())
}
