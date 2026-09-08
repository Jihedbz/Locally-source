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

/// Launch a detached process without blocking.
pub fn launch_detached(cmd: &str, args: &[&str], current_dir: Option<&Path>) -> AppResult<String> {
    let mut command = Command::new(cmd);

    if let Some(dir) = current_dir {
        command.current_dir(dir);
    }

    command.args(args);

    command.spawn().map_err(|e| {
        AppError::CommandFailed(format!("Failed to launch '{}': {}", cmd, e))
    })?;

    Ok(format!("Launched '{}'", cmd))
}

/// Get operating system name
pub fn get_operating_system() -> String {
    std::env::consts::OS.to_string()
}

use std::collections::HashMap;
use std::process::Child;
use std::sync::{Arc, Mutex};

#[derive(Default, Clone)]
pub struct ProcessManager {
    processes: Arc<Mutex<HashMap<String, Arc<Mutex<Option<Child>>>>>>,
}

impl ProcessManager {
    pub fn register(&self, id: String, child: Child) -> Arc<Mutex<Option<Child>>> {
        let child_arc = Arc::new(Mutex::new(Some(child)));
        if let Ok(mut guard) = self.processes.lock() {
            guard.insert(id, Arc::clone(&child_arc));
        }
        child_arc
    }

    pub fn unregister(&self, id: &str) {
        if let Ok(mut guard) = self.processes.lock() {
            guard.remove(id);
        }
    }

    pub fn cancel(&self, id: &str) -> bool {
        let child_arc = {
            let Ok(guard) = self.processes.lock() else {
                return false;
            };
            guard.get(id).cloned()
        };

        if let Some(child_arc) = child_arc {
            if let Ok(mut guard) = child_arc.lock() {
                if let Some(mut child) = guard.take() {
                    let _ = child.kill();
                    return true;
                }
            }
        }
        false
    }
}

/// Formats npm error messages into human-readable descriptions
pub fn format_npm_error(stderr: &str) -> String {
    let stderr_trimmed = stderr.trim();
    let stderr_lower = stderr_trimmed.to_lowercase();

    if stderr_lower.contains("enotfound")
        || stderr_lower.contains("eai_again")
        || stderr_lower.contains("getaddrinfo")
        || stderr_lower.contains("fetch failed")
        || stderr_lower.contains("offline")
        || stderr_lower.contains("network")
        || stderr_lower.contains("etimeout")
        || stderr_lower.contains("err_socket_timeout")
    {
        "npm registry is unreachable or offline. Please check your network connection.".to_string()
    } else if stderr_lower.contains("e404") || stderr_lower.contains("not found - 404") {
        "Package or package version not found on npm registry.".to_string()
    } else if stderr_lower.contains("einvalidpackagename") {
        "Invalid npm package name or format.".to_string()
    } else if stderr_lower.contains("enoent") && stderr_lower.contains("package.json") {
        "package.json was not found in the project directory.".to_string()
    } else if stderr_lower.contains("is not recognized as an internal or external command")
        || stderr_lower.contains("command not found")
        || stderr_lower.contains("no such file or directory")
    {
        "npm command was not found. Please ensure Node.js and npm are installed and added to system PATH.".to_string()
    } else if !stderr_trimmed.is_empty() {
        stderr_trimmed
            .lines()
            .find(|line| line.starts_with("npm ERR!"))
            .unwrap_or(stderr_trimmed)
            .to_string()
    } else {
        "An unexpected npm error occurred.".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_offline_errors() {
        let err = format_npm_error("npm ERR! code ENOTFOUND\nnpm ERR! syscall getaddrinfo");
        assert!(err.contains("unreachable or offline"));
    }

    #[test]
    fn formats_not_found_package_errors() {
        let err = format_npm_error("npm ERR! code E404\nnpm ERR! 404 Not Found - GET https://registry.npmjs.org/nonexistent");
        assert!(err.contains("not found on npm registry"));
    }

    #[test]
    fn formats_missing_npm_command_errors() {
        let err = format_npm_error("'npm' is not recognized as an internal or external command");
        assert!(err.contains("npm command was not found"));
    }

    #[test]
    fn formats_bytes_correctly() {
        assert_eq!(format_size(500), "500 B");
        assert_eq!(format_size(1024), "1.00 KB");
        assert_eq!(format_size(1024 * 1024), "1.00 MB");
        assert_eq!(format_size(1024 * 1024 * 1024), "1.00 GB");
    }

    #[test]
    fn launch_detached_handles_invalid_command() {
        let result = launch_detached("non_existent_binary_12345", &[], None);
        assert!(result.is_err());
    }
}

