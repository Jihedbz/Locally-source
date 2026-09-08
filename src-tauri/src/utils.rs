use crate::types::{AppError, AppResult};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::UNIX_EPOCH;

/// Format bytes to human-readable size
pub fn format_size(size: u64) -> String {
    if size < 1024 {
        format!("{} B", size)
    } else if size < 1024 * 1024 {
        format!("{:.2} KB", size as f64 / 1024.0)
    } else if size < 1024 * 1024 * 1024 {
        format!("{:.2} MB", size as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.2} GB", size as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}

pub fn get_dir_size(path: &Path) -> AppResult<u64> {
    if !path.exists() {
        return Err(AppError::PathNotFound(path.display().to_string()));
    }

    let mut size = 0u64;

    if path.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                let Ok(metadata) = fs::symlink_metadata(&entry_path) else {
                    continue;
                };

                if metadata.file_type().is_symlink() {
                    continue;
                }

                if metadata.is_dir() {
                    if let Ok(child_size) = get_dir_size(&entry_path) {
                        size += child_size;
                    }
                } else if metadata.is_file() {
                    size += metadata.len();
                }
            }
        }
    }

    Ok(size)
}

/// Get last modified timestamp for directory
pub async fn get_last_modified(dir_path: &str) -> AppResult<Option<u64>> {
    let mut latest_mtime = 0u64;
    let path = Path::new(dir_path);

    if !path.exists() {
        return Err(AppError::PathNotFound(dir_path.to_string()));
    }

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = fs::metadata(entry.path()) {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(duration_since_epoch) = modified.duration_since(UNIX_EPOCH) {
                        let mtime = duration_since_epoch.as_secs();
                        if mtime > latest_mtime {
                            latest_mtime = mtime;
                        }
                    }
                }
            }
        }
    }

    if latest_mtime > 0 {
        Ok(Some(latest_mtime))
    } else {
        Ok(None)
    }
}

/// Execute system command with proper error handling
pub fn execute_command(cmd: &str, args: &[&str], current_dir: Option<&Path>) -> AppResult<String> {
    let mut command = Command::new(cmd);

    if let Some(dir) = current_dir {
        command.current_dir(dir);
    }

    command.args(args);

    let output = command.output().map_err(|e| {
        AppError::CommandFailed(format!("Failed to execute command '{}': {}", cmd, e))
    })?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(AppError::CommandFailed(format!(
            "Command '{}' failed: {}",
            cmd,
            stderr.trim()
        )))
    }
}

/// Get operating system name
pub fn get_operating_system() -> String {
    std::env::consts::OS.to_string()
}
