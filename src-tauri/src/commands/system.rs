use crate::types::{AppError, AppResult};
use crate::utils::{get_operating_system, launch_detached};
use std::path::Path;
use tauri::command;

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
        return Err(AppError::PathNotFound(format!(
            "Path does not exist: {}",
            path
        )));
    }

    let result = if cfg!(target_os = "windows") {
        launch_detached("explorer", &["/select,", &path], None)
    } else if cfg!(target_os = "macos") {
        launch_detached("open", &[&path], None)
    } else if cfg!(target_os = "linux") {
        launch_detached("xdg-open", &[&path], None)
    } else {
        return Err(AppError::CommandFailed(
            "Unsupported operating system".to_string(),
        ));
    };

    result.map(|_| format!("Opened explorer at {}", path))
}

#[command]
pub fn open_in_vscode(
    path: String,
    editor: Option<String>,
    custom_editor_path: Option<String>,
) -> AppResult<String> {
    log::info!(
        "Opening editor at: {} (editor: {:?}, custom: {:?})",
        path,
        editor,
        custom_editor_path
    );
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!(
            "Path does not exist: {}",
            path
        )));
    }

    let editor_type = editor.as_deref().unwrap_or("vscode");

    let result = if editor_type == "custom" {
        if let Some(custom_path) = custom_editor_path.as_deref().filter(|s| !s.trim().is_empty()) {
            launch_detached(custom_path, &[&path], None)
        } else {
            Err(AppError::CommandFailed(
                "Custom editor path is not configured".to_string(),
            ))
        }
    } else if cfg!(target_os = "windows") {
        let binary = match editor_type {
            "cursor" => "cursor",
            "webstorm" => "webstorm",
            _ => "code",
        };
        launch_detached("cmd", &["/C", "start", "", binary, &path], None)
    } else if cfg!(target_os = "macos") {
        let (app_name, cli_cmd) = match editor_type {
            "cursor" => ("Cursor", "cursor"),
            "webstorm" => ("WebStorm", "webstorm"),
            _ => ("Visual Studio Code", "code"),
        };
        launch_detached("open", &["-a", app_name, &path], None)
            .or_else(|_| launch_detached(cli_cmd, &[&path], None))
    } else if cfg!(target_os = "linux") {
        let binary = match editor_type {
            "cursor" => "cursor",
            "webstorm" => "webstorm",
            _ => "code",
        };
        launch_detached(binary, &[&path], None)
    } else {
        return Err(AppError::CommandFailed(
            "Unsupported operating system".to_string(),
        ));
    };

    result.map(|_| format!("Opened editor at {}", path))
}

#[command]
pub fn open_terminal(
    path: String,
    terminal: Option<String>,
    custom_terminal_path: Option<String>,
) -> AppResult<String> {
    log::info!(
        "Opening terminal at: {} (terminal: {:?}, custom: {:?})",
        path,
        terminal,
        custom_terminal_path
    );
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!(
            "Path does not exist: {}",
            path
        )));
    }

    let terminal_type = terminal.as_deref().unwrap_or("default");

    let result = if terminal_type == "custom" {
        if let Some(custom_path) = custom_terminal_path.as_deref().filter(|s| !s.trim().is_empty()) {
            launch_detached(custom_path, &[], Some(Path::new(&path)))
        } else {
            Err(AppError::CommandFailed(
                "Custom terminal path is not configured".to_string(),
            ))
        }
    } else if cfg!(target_os = "windows") {
        launch_detached(
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
        let apple_script = format!(
            "tell application \"Terminal\"\n\
             do script \"cd '{}'\" \n\
             activate\n\
             end tell",
            path.replace('\'', "'\\''")
        );
        launch_detached("osascript", &["-e", &apple_script], None)
    } else if cfg!(target_os = "linux") {
        launch_detached("gnome-terminal", &["--working-directory", &path], None)
            .or_else(|_| launch_detached("konsole", &["--workdir", &path], None))
            .or_else(|_| {
                launch_detached("xterm", &["-e", &format!("cd \"{}\" && bash", path)], None)
            })
    } else {
        return Err(AppError::CommandFailed(
            "Unsupported operating system".to_string(),
        ));
    };

    result.map(|_| format!("Opened terminal at {}", path))
}
