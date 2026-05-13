use crate::utils::{execute_command, get_operating_system};
use crate::types::{AppError, AppResult};
use tauri::command;
use std::path::Path;

/// Returns the operating system name.
#[command(rename = "get_operating_system")]
pub fn get_operating_system_command() -> AppResult<String> {
    Ok(get_operating_system())
}

/// Returns the last modified timestamp (in seconds) for a directory.
/// 
/// # Arguments
/// * `dir_path` - Path to the directory.
#[command(rename = "get_last_modified")]
pub async fn get_last_modified_command(dir_path: String) -> AppResult<Option<u64>> {
    crate::utils::get_last_modified(&dir_path).await
}

/// Opens a directory in the default file explorer (Explorer, Finder, xdg-open).
/// 
/// # Arguments
/// * `path` - Path to the directory.
#[command]
pub fn open_in_explorer(path: String) -> AppResult<String> {
    log::info!("Opening explorer at: {}", path);
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!("Path does not exist: {}", path)));
    }

    let result = if cfg!(target_os = "windows") {
        execute_command("explorer", &["/select,", &path], None)
    } else if cfg!(target_os = "macos") {
        execute_command("open", &[&path], None)
    } else if cfg!(target_os = "linux") {
        execute_command("xdg-open", &[&path], None)
    } else {
        return Err(AppError::CommandFailed("Unsupported operating system".to_string()));
    };

    result.map(|_| format!("Opened explorer at {}", path))
}

#[command]
pub fn open_in_vscode(path: String) -> AppResult<String> {
    log::info!("Opening VSCode at: {}", path);
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!("Path does not exist: {}", path)));
    }

    let result = if cfg!(target_os = "windows") {
        execute_command("cmd", &["/C", "code", &path], None)
    } else if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
        execute_command("code", &[&path], None)
    } else {
        return Err(AppError::CommandFailed("Unsupported operating system".to_string()));
    };

    result.map(|_| format!("Opened VSCode at {}", path))
}

#[command]
pub fn open_terminal(path: String) -> AppResult<String> {
    log::info!("Opening terminal at: {}", path);
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!("Path does not exist: {}", path)));
    }

    let result = if cfg!(target_os = "windows") {
        execute_command(
            "cmd",
            &[
                "/C",
                "start",
                "cmd.exe",
                "/K",
                &format!("cd /d \"{}\"", path),
            ],
            None,
        )
    } else if cfg!(target_os = "macos") {
        // Create an AppleScript that opens Terminal and runs a cd command
        let apple_script = format!(
            "tell application \"Terminal\"\n\
             do script \"cd '{}'\" \n\
             activate\n\
             end tell",
            path.replace("'", "'\\''") // Escape single quotes for AppleScript
        );

        execute_command("osascript", &["-e", &apple_script], None)
    } else if cfg!(target_os = "linux") {
        // Try to determine which terminal emulator to use
        if execute_command("which", &["gnome-terminal"], None).is_ok() {
            execute_command("gnome-terminal", &["--working-directory", &path], None)
        } else if execute_command("which", &["konsole"], None).is_ok() {
            execute_command("konsole", &["--workdir", &path], None)
        } else if execute_command("which", &["xterm"], None).is_ok() {
            execute_command("xterm", &["-e", &format!("cd {} && bash", path)], None)
        } else {
            return Err(AppError::CommandFailed("No supported terminal emulator found".to_string()));
        }
    } else {
        return Err(AppError::CommandFailed("Unsupported operating system".to_string()));
    };

    result.map(|_| format!("Opened terminal at {}", path))
}
