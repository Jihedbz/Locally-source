use crate::types::{AppError, AppResult};
use crate::utils::{execute_command, get_dir_size};
use tauri::{command, AppHandle, Manager};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::fs;
use once_cell::sync::Lazy;
use tokio::task;

static PROJECTS_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

/// Initialize the projects path once
pub fn init_project_path(handle: &AppHandle) -> AppResult<()> {
    let mut path_guard = PROJECTS_PATH.lock().map_err(|_| AppError::PermissionDenied("Failed to acquire lock".to_string()))?;
    if path_guard.is_none() {
        if let Ok(mut path) = handle.path().app_data_dir() {
            path.push("projects");

            if !path.exists() {
                fs::create_dir_all(&path)
                    .map_err(|e| AppError::Io(e))?;
            }
            *path_guard = Some(path);
        }
    }
    Ok(())
}

/// Get the projects path
pub fn get_project_path() -> AppResult<PathBuf> {
    PROJECTS_PATH.lock()
        .map_err(|_| AppError::PermissionDenied("Failed to acquire lock".to_string()))?
        .clone()
        .ok_or_else(|| AppError::PathNotFound("Projects path not initialized".to_string()))
}

/// Scaffolds a new Angular project using the Angular CLI.
/// 
/// # Arguments
/// * `name` - The name of the new project.
/// * `handle` - The Tauri application handle.
#[command]
pub async fn create_angular_project(name: String, handle: AppHandle) -> AppResult<String> {
    log::info!("Creating Angular project: {}", name);
    init_project_path(&handle)?;
    let path = get_project_path()?;
    
    let command = format!("ng new {} --skip-install", name);
    
    task::spawn_blocking(move || {
        let args = if cfg!(target_os = "windows") {
            vec!["/C", command.as_str()]
        } else {
            vec!["-c", command.as_str()]
        };
        execute_command(
            if cfg!(target_os = "windows") { "cmd" } else { "sh" },
            &args,
            Some(&path)
        )
    }).await.map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

/// Scaffolds a new Next.js project using create-next-app.
/// 
/// # Arguments
/// * `name` - The name of the project.
/// * `typescript` - "yes" or "no".
/// * `eslint` - "yes" or "no".
/// * `tailwind` - "yes" or "no".
/// * `src` - "yes" or "no".
/// * `app_router` - "yes" or "no".
/// * `turbopack` - "yes" or "no".
#[command]
pub async fn create_next_project(
    name: String,
    typescript: String,
    eslint: String,
    tailwind: String,
    src: String,
    app_router: String,
    turbopack: String,
) -> AppResult<String> {
    log::info!("Creating Next.js project: {}", name);
    let project_path = get_project_path()?;
    let project_dir = project_path.join(&name);

    if project_dir.exists() {
        return Err(AppError::PathNotFound(format!(
            "Directory '{}' already exists. Please choose a different name.",
            name
        )));
    }

    fs::create_dir_all(&project_dir)
        .map_err(|e| AppError::Io(e))?;

    let mut args: Vec<String> = vec![];
    
    // Handle all yes/no options explicitly
    if typescript == "yes" {
        args.push("--typescript".into());
    } else if typescript == "no" {
        args.push("--javascript".into());
    }

    if eslint == "yes" {
        args.push("--eslint".into());
    } else if eslint == "no" {
        args.push("--no-eslint".into());
    }

    if tailwind == "yes" {
        args.push("--tailwind".into());
    } else if tailwind == "no" {
        args.push("--no-tailwind".into());
    }

    if src == "yes" {
        args.push("--src-dir".into());
    } else if src == "no" {
        args.push("--no-src-dir".into());
    }

    if app_router == "yes" {
        args.push("--app".into());
    } else if app_router == "no" {
        args.push("--no-app".into());
    }

    if turbopack == "yes" {
        args.push("--turbopack".into());
    } else if turbopack == "no" {
        args.push("--no-turbopack".into());
    }

    // Always add these flags
    args.push("--no-import-alias".into());
    args.push("--skip-install".into());
    args.push("-y".into());

    let command_str = if cfg!(target_os = "windows") {
        "npx.cmd"
    } else {
        "npx"
    };

    execute_command(
        command_str,
        &["create-next-app@latest", &name, &args.join(" ")],
        Some(&project_path)
    )
    .map(|_| format!("Project '{}' created successfully.", name))
}

/// Permanently deletes a project directory from the filesystem.
/// 
/// # Arguments
/// * `path` - Absolute path to the project directory.
#[command]
pub async fn delete_project(path: String) -> AppResult<String> {
    log::info!("Deleting project at: {}", path);
    if !Path::new(&path).exists() {
        return Err(AppError::PathNotFound(format!("Path does not exist: {}", path)));
    }

    fs::remove_dir_all(&path)
        .map_err(|e| AppError::Io(e))?;

    Ok(format!("Project deleted successfully at {}", path))
}

#[command(rename = "get_dir_size")]
pub async fn get_dir_size_command(path: String) -> AppResult<u64> {
    let path = Path::new(&path);
    get_dir_size(&path)
}