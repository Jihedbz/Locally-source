use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::command;
use tokio::task;
use std::fs;
use once_cell::sync::Lazy;
use tauri::AppHandle;
use std::sync::Mutex;
use tauri::Manager;
use std::time::{UNIX_EPOCH};
use std::collections::HashMap;

static PROJECTS_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

// Function to initialize the projects path once
fn init_project_path(handle: &AppHandle) {
    let mut path_guard = PROJECTS_PATH.lock().unwrap();
    if path_guard.is_none() {
        if let Ok(mut path) = handle.path().app_data_dir() {
            path.push("projects"); // Append "projects" folder
            *path_guard = Some(path);
        }
    }
}

// Function to get the projects path
fn get_project_path() -> Option<PathBuf> {
    PROJECTS_PATH.lock().unwrap().clone()
}





#[command]
fn get_last_modified(dir_path: String) -> Option<u64> {
    let mut latest_mtime = 0;

    if let Ok(entries) = fs::read_dir(&dir_path) {
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
        Some(latest_mtime)
    } else {
        None
    }
}


#[tauri::command]
fn get_folder_size(path: String) -> u64 {
    fn calculate_size(dir: &Path) -> u64 {
        let mut total_size = 0;

        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let metadata = entry.metadata();
                if let Ok(meta) = metadata {
                    if meta.is_file() {
                        total_size += meta.len(); // Get file size in bytes
                    } else if meta.is_dir() {
                        total_size += calculate_size(&entry.path()); // Recurse into folder
                    }
                }
            }
        }
        total_size
    }

    calculate_size(Path::new(&path))
}



#[command]
async fn create_angular_project(name: String, handle: AppHandle) -> Result<String, String> {
    // Debug: Log the received path

    init_project_path(&handle);

    // Get the projects path
    let Some(path) = get_project_path() else {
        return Err("Failed to resolve app data directory".to_string());
    };


    println!("Received project path: {:?}", path);

    let command = format!("ng new {} --skip-install", name);

    println!("Running command: {} in {:?}", command, path);

    let result = task::spawn_blocking(move || {
        let output = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", &command])
                .current_dir(path) // Ensure we're using the correct project directory
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| {
                    println!("Command execution failed: {}", e);
                    e.to_string()
                })?
        } else {
            Command::new("sh")
                .arg("-c")
                .arg(&command)
                .current_dir(path) // Ensure we're using the correct project directory
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| {
                    println!("Command execution failed: {}", e);
                    e.to_string()
                })?
        };

        if output.status.success() {
            Ok(format!("Project '{}' created successfully", name))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            println!("Project creation failed:\nSTDOUT: {}\nSTDERR: {}", stdout, stderr);
            Err(format!("Error creating project: {}", stderr.trim()))
        }
    }).await;

    result.map_err(|e| e.to_string())?
}




#[command]
async fn create_next_project(
    name: String,
    typescript: String,
    eslint: String,
    tailwind: String,
    src: String,
    app_router: String,
    turbopack: String,
    handle: AppHandle
) -> Result<String, String> {

    init_project_path(&handle);

    // Get the projects path
    let Some(path) = get_project_path() else {
        return Err("Failed to resolve app data directory".to_string());
    };

    // Debug: Log the received path
    println!("Received project path: {:?}", path);

    // Helper function to handle the option transformation
    fn transform_option(option: &str, yes_flag: &str, no_flag: &str) -> Result<String, String> {
        match option {
            "yes" => Ok(yes_flag.to_string()),
            "no" => Ok(no_flag.to_string()),
            _ => Err(format!("Invalid option: {}", option)),
        }
    }

    // Create a HashMap to handle the options
    let mut options: HashMap<&str, (String, String)> = HashMap::new();
    options.insert("typescript", ("--typescript".to_string(), "--js".to_string()));
    options.insert("eslint", ("--eslint".to_string(), "--no-eslint".to_string()));
    options.insert("tailwind", ("--tailwind".to_string(), "--no-tailwind".to_string()));
    options.insert("src", ("--src-dir".to_string(), "--no-src-dir".to_string()));
    options.insert("turbopack", ("--turbopack".to_string(), "--no-turbopack".to_string()));
    options.insert("app_router", ("--app".to_string(), "--no-app".to_string()));

    // Collect all the options
    let mut command_parts = vec![name.clone()];

    for (key, (yes_flag, no_flag)) in options.iter() {
        let option_value = match key {
            &"typescript" => &typescript,
            &"eslint" => &eslint,
            &"tailwind" => &tailwind,
            &"src" => &src,
            &"turbopack" => &turbopack,
            &"app_router" => &app_router,
            _ => unreachable!(),
        };

        match transform_option(option_value, &yes_flag, &no_flag) {
            Ok(flag) => command_parts.push(flag),
            Err(err) => return Err(err),
        }
    }

    let command = format!(
        "npx create-next-app@latest {} --no-import-alias --skip-install",
        command_parts.join(" ")
    );

    println!("Running command: {} in {:?}", command, path);

    let result = task::spawn_blocking(move || {
        let output = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", &command])
                .current_dir(path) // Ensure we're using the correct project directory
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| e.to_string())?
        } else {
            Command::new("sh")
                .arg("-c")
                .arg(&command)
                .current_dir(path) // Ensure we're using the correct project directory
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| e.to_string())?
        };

        if output.status.success() {
            Ok(format!("Project '{}' created successfully", name))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);
            println!("Project creation failed:\nSTDOUT: {}\nSTDERR: {}", stdout, stderr);
            Err(format!("Error creating project: {}", stderr.trim()))
        }
    }).await;

    result.map_err(|e| e.to_string())?
}




fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![create_angular_project, get_last_modified, get_folder_size, create_next_project])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
