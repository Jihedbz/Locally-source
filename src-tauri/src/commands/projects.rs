use crate::types::{AppError, AppResult};
use crate::utils::{execute_command, format_npm_error, get_dir_size, ProcessManager};
use once_cell::sync::Lazy;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{command, AppHandle, Manager, State};
use tokio::task;

static PROJECTS_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

/// Initialize the projects path once
pub fn init_project_path(handle: &AppHandle) -> AppResult<()> {
    let mut path_guard = PROJECTS_PATH
        .lock()
        .map_err(|_| AppError::PermissionDenied("Failed to acquire lock".to_string()))?;
    if path_guard.is_none() {
        if let Ok(mut path) = handle.path().app_data_dir() {
            path.push("projects");

            if !path.exists() {
                fs::create_dir_all(&path).map_err(|e| AppError::Io(e))?;
            }
            *path_guard = Some(path);
        }
    }
    Ok(())
}

/// Get the projects path
pub fn get_project_path() -> AppResult<PathBuf> {
    PROJECTS_PATH
        .lock()
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
    validate_project_name(&name)?;
    init_project_path(&handle)?;
    let path = get_project_path()?;

    task::spawn_blocking(move || {
        let command = if cfg!(target_os = "windows") {
            "npx.cmd"
        } else {
            "npx"
        };
        let args = [
            "--yes",
            "@angular/cli",
            "new",
            name.as_str(),
            "--skip-install",
        ];
        execute_command(command, &args, Some(&path))
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
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
    validate_project_name(&name)?;
    let project_path = get_project_path()?;
    let project_dir = project_path.join(&name);

    if project_dir.exists() {
        return Err(AppError::PathNotFound(format!(
            "Directory '{}' already exists. Please choose a different name.",
            name
        )));
    }

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

    let project_name = name.clone();
    let mut command_args = vec!["create-next-app@latest".to_string(), name];
    command_args.extend(args);
    let command_arg_refs: Vec<&str> = command_args.iter().map(String::as_str).collect();

    execute_command(command_str, &command_arg_refs, Some(&project_path))
        .map(|_| format!("Project '{}' created successfully.", project_name))
}

/// Permanently deletes a project directory from the filesystem.
///
/// # Arguments
/// * `path` - Absolute path to the project directory.
#[command]
pub async fn delete_project(path: String) -> AppResult<String> {
    log::info!("Deleting project at: {}", path);
    let managed_path = get_managed_project_path(&path)?;

    fs::remove_dir_all(&managed_path).map_err(|e| AppError::Io(e))?;

    Ok(format!("Project deleted successfully at {}", path))
}

#[command(rename = "get_dir_size")]
pub async fn get_dir_size_command(path: String) -> AppResult<u64> {
    let path = Path::new(&path);
    get_dir_size(&path)
}

fn npm_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "npm.cmd"
    } else {
        "npm"
    }
}

fn execute_npm(path: &Path, args: Vec<String>) -> AppResult<String> {
    let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
    execute_command(npm_command(), &arg_refs, Some(path)).map_err(|e| {
        let err_msg = match e {
            AppError::CommandFailed(ref s) => format_npm_error(s),
            _ => e.to_string(),
        };
        AppError::CommandFailed(err_msg)
    })
}

#[command]
pub async fn check_npm_availability() -> AppResult<crate::types::NpmAvailability> {
    task::spawn_blocking(move || {
        let npm = npm_command();
        let version_output = std::process::Command::new(npm).arg("--version").output();
        match version_output {
            Err(_) => Ok(crate::types::NpmAvailability {
                installed: false,
                version: None,
                online: false,
                message: Some("npm executable was not found. Please install Node.js and npm.".to_string()),
            }),
            Ok(output) if !output.status.success() => Ok(crate::types::NpmAvailability {
                installed: false,
                version: None,
                online: false,
                message: Some("npm command failed to run.".to_string()),
            }),
            Ok(output) => {
                let ver = String::from_utf8_lossy(&output.stdout).trim().to_string();
                let ping_output = std::process::Command::new(npm).arg("ping").output();
                let online = ping_output
                    .as_ref()
                    .map(|out| out.status.success())
                    .unwrap_or(false);
                let message = if online {
                    Some("npm is available and online.".to_string())
                } else {
                    Some("npm is available, but the registry is unreachable (offline).".to_string())
                };

                Ok(crate::types::NpmAvailability {
                    installed: true,
                    version: if ver.is_empty() { None } else { Some(ver) },
                    online,
                    message,
                })
            }
        }
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn init_package_json(path: String) -> AppResult<String> {
    let project_path = get_managed_project_path(&path)?;
    task::spawn_blocking(move || {
        let package_json = project_path.join("package.json");
        if package_json.exists() {
            return Ok("package.json already exists".to_string());
        }

        execute_npm(&project_path, vec!["init".to_string(), "-y".to_string()])
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn get_npm_packages(path: String) -> AppResult<Vec<crate::types::NpmPackage>> {
    let project_path = get_managed_project_path(&path)?;
    task::spawn_blocking(move || {
        let package_json = project_path.join("package.json");
        if !package_json.exists() {
            return Err(AppError::FileNotFound(
                "package.json not found in project directory".to_string(),
            ));
        }
        let content = fs::read_to_string(package_json).map_err(AppError::Io)?;
        let manifest: Value = serde_json::from_str(&content)?;
        let mut packages = Vec::new();

        for (dependency_type, field) in [
            ("production", "dependencies"),
            ("development", "devDependencies"),
        ] {
            if let Some(dependencies) = manifest.get(field).and_then(Value::as_object) {
                for (name, version) in dependencies {
                    packages.push(crate::types::NpmPackage {
                        name: name.clone(),
                        version: version.as_str().unwrap_or("unknown").to_string(),
                        dependency_type: dependency_type.to_string(),
                    });
                }
            }
        }

        packages.sort_by(|left, right| left.name.cmp(&right.name));
        Ok(packages)
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn search_npm_packages(query: String) -> AppResult<Vec<crate::types::NpmSearchResult>> {
    let query = query.trim().to_string();
    if query.is_empty() || query.len() > 100 {
        return Err(AppError::CommandFailed(
            "Search query is invalid".to_string(),
        ));
    }

    task::spawn_blocking(move || {
        let output = execute_npm(
            Path::new("."),
            vec![
                "search".to_string(),
                query,
                "--json".to_string(),
                "--searchlimit=20".to_string(),
            ],
        )?;
        let results: Vec<Value> = serde_json::from_str(&output)?;
        Ok(results
            .into_iter()
            .filter_map(|result| {
                Some(crate::types::NpmSearchResult {
                    name: result.get("name")?.as_str()?.to_string(),
                    version: result
                        .get("version")
                        .and_then(Value::as_str)
                        .unwrap_or("latest")
                        .to_string(),
                    description: result
                        .get("description")
                        .and_then(Value::as_str)
                        .map(String::from),
                    package_type: result
                        .get("packageType")
                        .and_then(Value::as_str)
                        .map(String::from),
                })
            })
            .collect())
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn get_npm_package_metadata(
    package: String,
    version: String,
) -> AppResult<crate::types::NpmPackageMetadata> {
    if package.trim().is_empty() || version.trim().is_empty() || version.starts_with('-') {
        return Err(AppError::CommandFailed(
            "Package metadata request is invalid".to_string(),
        ));
    }

    task::spawn_blocking(move || {
        let output = execute_npm(
            Path::new("."),
            vec![
                "view".to_string(),
                format!("{}@{}", package, version),
                "name".to_string(),
                "version".to_string(),
                "description".to_string(),
                "license".to_string(),
                "homepage".to_string(),
                "repository".to_string(),
                "--json".to_string(),
            ],
        )?;
        let metadata: Value = serde_json::from_str(&output)?;
        Ok(crate::types::NpmPackageMetadata {
            name: metadata
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or(&package)
                .to_string(),
            version: metadata
                .get("version")
                .and_then(Value::as_str)
                .unwrap_or(&version)
                .to_string(),
            description: metadata
                .get("description")
                .and_then(Value::as_str)
                .map(String::from),
            license: metadata
                .get("license")
                .and_then(Value::as_str)
                .map(String::from),
            homepage: metadata
                .get("homepage")
                .and_then(Value::as_str)
                .map(String::from),
            repository: metadata
                .get("repository")
                .and_then(Value::as_str)
                .map(String::from),
        })
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

fn execute_npm_with_progress(
    handle: &AppHandle,
    process_mgr: &ProcessManager,
    install_id: Option<&str>,
    path: &Path,
    args: Vec<String>,
) -> AppResult<String> {
    use std::io::{BufRead, BufReader};
    use std::process::Stdio;
    use tauri::Emitter;

    let mut command = std::process::Command::new(npm_command());
    command.current_dir(path);
    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let child = command.spawn().map_err(|e| {
        AppError::CommandFailed(format_npm_error(&e.to_string()))
    })?;

    let id = install_id.map(String::from);
    let child_arc = id.as_ref().map(|id_str| process_mgr.register(id_str.clone(), child));

    let (stdout_opt, stderr_opt) = if let Some(ref arc) = child_arc {
        if let Ok(mut guard) = arc.lock() {
            if let Some(ref mut c) = *guard {
                (c.stdout.take(), c.stderr.take())
            } else {
                (None, None)
            }
        } else {
            (None, None)
        }
    } else {
        (None, None)
    };

    let handle_clone1 = handle.clone();
    let id_clone1 = id.clone();
    let stdout_handle = stdout_opt.map(|out| {
        std::thread::spawn(move || {
            let reader = BufReader::new(out);
            let mut lines = Vec::new();
            for line in reader.lines().flatten() {
                if let Some(ref install_id) = id_clone1 {
                    let _ = handle_clone1.emit(
                        "npm-install-progress",
                        crate::types::NpmProgressPayload {
                            install_id: install_id.clone(),
                            line: line.clone(),
                            stream: "stdout".to_string(),
                        },
                    );
                }
                lines.push(line);
            }
            lines.join("\n")
        })
    });

    let handle_clone2 = handle.clone();
    let id_clone2 = id.clone();
    let stderr_handle = stderr_opt.map(|err| {
        std::thread::spawn(move || {
            let reader = BufReader::new(err);
            let mut lines = Vec::new();
            for line in reader.lines().flatten() {
                if let Some(ref install_id) = id_clone2 {
                    let _ = handle_clone2.emit(
                        "npm-install-progress",
                        crate::types::NpmProgressPayload {
                            install_id: install_id.clone(),
                            line: line.clone(),
                            stream: "stderr".to_string(),
                        },
                    );
                }
                lines.push(line);
            }
            lines.join("\n")
        })
    });

    let stdout_str = stdout_handle.and_then(|h| h.join().ok()).unwrap_or_default();
    let stderr_str = stderr_handle.and_then(|h| h.join().ok()).unwrap_or_default();

    let exit_status = if let Some(ref arc) = child_arc {
        if let Ok(mut guard) = arc.lock() {
            if let Some(ref mut c) = *guard {
                c.wait().ok()
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    if let Some(ref id_str) = id {
        process_mgr.unregister(id_str);
    }

    match exit_status {
        Some(status) if status.success() => Ok(stdout_str),
        Some(_) => {
            let combined = format!("{}\n{}", stdout_str, stderr_str);
            Err(AppError::CommandFailed(format_npm_error(&combined)))
        }
        None => {
            let combined = format!("{}\n{}", stdout_str, stderr_str);
            if combined.contains("killed") || combined.is_empty() {
                Err(AppError::CommandFailed("Operation was cancelled by user.".to_string()))
            } else {
                Err(AppError::CommandFailed(format_npm_error(&combined)))
            }
        }
    }
}

#[command]
pub async fn install_npm_package(
    path: String,
    package: String,
    version: Option<String>,
    dev: bool,
    install_id: Option<String>,
    handle: AppHandle,
    process_mgr: State<'_, ProcessManager>,
) -> AppResult<String> {
    let project_path = get_managed_project_path(&path)?;
    let package_spec = if let Some(ver) = version {
        if ver.trim().is_empty() {
            package
        } else {
            format!("{}@{}", package, ver)
        }
    } else {
        package
    };
    let mut args = vec!["install".to_string()];
    if dev {
        args.push("--save-dev".to_string());
    }
    args.push(package_spec);

    let pm = process_mgr.inner().clone();
    task::spawn_blocking(move || {
        execute_npm_with_progress(&handle, &pm, install_id.as_deref(), &project_path, args)
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn update_npm_package(
    path: String,
    package: String,
    install_id: Option<String>,
    handle: AppHandle,
    process_mgr: State<'_, ProcessManager>,
) -> AppResult<String> {
    install_npm_package(
        path,
        package,
        Some("latest".to_string()),
        false,
        install_id,
        handle,
        process_mgr,
    )
    .await
}

#[command]
pub async fn remove_npm_package(
    path: String,
    package: String,
    install_id: Option<String>,
    handle: AppHandle,
    process_mgr: State<'_, ProcessManager>,
) -> AppResult<String> {
    let project_path = get_managed_project_path(&path)?;
    let pm = process_mgr.inner().clone();
    task::spawn_blocking(move || {
        execute_npm_with_progress(
            &handle,
            &pm,
            install_id.as_deref(),
            &project_path,
            vec!["uninstall".to_string(), package],
        )
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn cancel_npm_install(
    install_id: String,
    process_mgr: State<'_, ProcessManager>,
) -> AppResult<bool> {
    let cancelled = process_mgr.cancel(&install_id);
    Ok(cancelled)
}

#[cfg(test)]
mod tests {
    use super::validate_project_name;

    #[test]
    fn accepts_safe_project_names() {
        assert!(validate_project_name("my-app_2.0").is_ok());
    }

    #[test]
    fn rejects_names_that_can_escape_the_project_directory() {
        for name in [
            "",
            " ../outside",
            "../outside",
            "--bad-option",
            "bad/name",
            "bad name",
            "CON",
            "project.",
        ] {
            assert!(validate_project_name(name).is_err(), "accepted: {name}");
        }
    }
}

pub fn validate_project_name(name: &str) -> AppResult<()> {
    let trimmed = name.trim();
    if trimmed.is_empty()
        || trimmed != name
        || !trimmed
            .chars()
            .next()
            .is_some_and(|character| character.is_ascii_alphanumeric())
    {
        return Err(AppError::CommandFailed(
            "Project name must not be empty or contain surrounding whitespace".to_string(),
        ));
    }

    let stem = trimmed
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    let reserved_name = matches!(
        stem.as_str(),
        "CON"
            | "PRN"
            | "AUX"
            | "NUL"
            | "COM1"
            | "COM2"
            | "COM3"
            | "COM4"
            | "COM5"
            | "COM6"
            | "COM7"
            | "COM8"
            | "COM9"
            | "LPT1"
            | "LPT2"
            | "LPT3"
            | "LPT4"
            | "LPT5"
            | "LPT6"
            | "LPT7"
            | "LPT8"
            | "LPT9"
    );

    if trimmed == "."
        || trimmed == ".."
        || trimmed.ends_with('.')
        || trimmed.ends_with(' ')
        || reserved_name
        || trimmed.len() > 100
    {
        return Err(AppError::CommandFailed("Invalid project name".to_string()));
    }

    if !trimmed
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.'))
    {
        return Err(AppError::CommandFailed(
            "Project names may contain only letters, numbers, hyphens, underscores, and periods"
                .to_string(),
        ));
    }

    Ok(())
}

pub fn get_managed_project_path(path: &str) -> AppResult<PathBuf> {
    let projects_path = get_project_path()?.canonicalize().map_err(AppError::Io)?;
    let candidate = Path::new(path);
    if !candidate.exists() {
        return Err(AppError::PathNotFound(format!(
            "Path does not exist: {}",
            path
        )));
    }

    let candidate = candidate.canonicalize().map_err(AppError::Io)?;
    let relative = candidate.strip_prefix(&projects_path).map_err(|_| {
        AppError::PermissionDenied(
            "The requested path is outside the managed projects directory".to_string(),
        )
    })?;

    if !candidate.is_dir() || relative.components().count() != 1 {
        return Err(AppError::PermissionDenied(
            "Only managed project directories can be modified".to_string(),
        ));
    }

    Ok(candidate)
}

#[command]
pub async fn create_react_project(name: String, handle: AppHandle) -> AppResult<String> {
    log::info!("Creating React project: {}", name);
    validate_project_name(&name)?;
    init_project_path(&handle)?;
    let path = get_project_path()?;
    let command = if cfg!(target_os = "windows") {
        "npx.cmd"
    } else {
        "npx"
    };

    task::spawn_blocking(move || {
        let args = [
            "--yes".to_string(),
            "create-vite@latest".to_string(),
            name,
            "--template".to_string(),
            "react-ts".to_string(),
        ];
        let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
        execute_command(command, &arg_refs, Some(&path))
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn create_vue_project(name: String, handle: AppHandle) -> AppResult<String> {
    log::info!("Creating Vue project: {}", name);
    validate_project_name(&name)?;
    init_project_path(&handle)?;
    let path = get_project_path()?;
    let command = if cfg!(target_os = "windows") {
        "npx.cmd"
    } else {
        "npx"
    };

    task::spawn_blocking(move || {
        let args = [
            "--yes".to_string(),
            "create-vue@latest".to_string(),
            name,
            "--default".to_string(),
            "--typescript".to_string(),
        ];
        let arg_refs: Vec<&str> = args.iter().map(String::as_str).collect();
        execute_command(command, &arg_refs, Some(&path))
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}
