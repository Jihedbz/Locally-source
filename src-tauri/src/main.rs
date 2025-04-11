use std::env::consts;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::command;
use tokio::task;
use std::fs;
use once_cell::sync::Lazy;
use tauri::AppHandle;
use std::sync::Mutex;
use tauri::Manager;
use std::time::UNIX_EPOCH;
static PROJECTS_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

#[command]
fn clean_project(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    // Define common directories and files to clean
    let temp_dirs = vec![
        "node_modules",
        ".cache",
        "dist",
        "build",
        ".next",
        ".nuxt",
        "target",        // Rust build directory
        "out",
        "coverage",
        ".pytest_cache",
        "__pycache__",
        ".mypy_cache",
        ".rpt2_cache",
        ".rts2_cache",
        ".eslintcache",
        ".stylelintcache",
        ".parcel-cache",
        ".webpack",
        "bin",
        "obj",          // .NET build directories
        "vendor",       // PHP/Composer dependencies
        ".sass-cache",
        ".fusebox",
        ".dynamodb",
        ".serverless",
        ".terraform",
        ".terragrunt-cache",
        ".gradle"
    ];
    
    // Files to clean (could be expanded)
    let temp_files = vec![
        ".DS_Store",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "*.log"
    ];

    let mut total_cleaned = 0;
    let mut total_size = 0;
    let mut cleaned_dirs = Vec::new();
    let mut errors = Vec::new();

    // Clean directories
    for temp_dir in temp_dirs {
        clean_recursive(&PathBuf::from(&path), temp_dir, &mut total_cleaned, &mut total_size, &mut cleaned_dirs, &mut errors);
    }
    
    // Clean specific files (this is a simple version, could be enhanced with glob patterns)
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_file() {
                if let Some(file_name) = entry_path.file_name() {
                    if let Some(file_name_str) = file_name.to_str() {
                        for pattern in &temp_files {
                            if pattern.contains("*") {
                                // Very simple glob pattern matching for *.ext patterns
                                if pattern.starts_with("*.") {
                                    let ext = pattern.split(".").nth(1).unwrap_or("");
                                    if file_name_str.ends_with(&format!(".{}", ext)) {
                                        let file_size = fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0);
                                        if let Err(e) = fs::remove_file(&entry_path) {
                                            errors.push(format!("Failed to remove {}: {}", entry_path.display(), e));
                                        } else {
                                            total_cleaned += 1;
                                            total_size += file_size;
                                            cleaned_dirs.push(entry_path.display().to_string());
                                        }
                                    }
                                }
                            } else if file_name_str == *pattern {
                                let file_size = fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0);
                                if let Err(e) = fs::remove_file(&entry_path) {
                                    errors.push(format!("Failed to remove {}: {}", entry_path.display(), e));
                                } else {
                                    total_cleaned += 1;
                                    total_size += file_size;
                                    cleaned_dirs.push(entry_path.display().to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Format size in human-readable format
    fn format_size(size: u64) -> String {
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

    // Prepare result message
    let formatted_size = format_size(total_size);
    let result = if total_cleaned > 0 {
        if errors.is_empty() {
            format!("Cleaned {} items ({})", total_cleaned, formatted_size)
        } else {
            format!("Cleaned {} items ({}), but encountered {} errors", 
                total_cleaned, formatted_size, errors.len())
        }
    } else if !errors.is_empty() {
        format!("Nothing cleaned. Encountered {} errors", errors.len())
    } else {
        "No temporary files or directories found to clean".to_string()
    };

    Ok(result)
}

// Helper function to recursively search for and clean directories
fn clean_recursive(
    base_path: &Path, 
    target_dir: &str, 
    total_cleaned: &mut usize, 
    total_size: &mut u64,
    cleaned_dirs: &mut Vec<String>,
    errors: &mut Vec<String>
) {
    if let Ok(entries) = fs::read_dir(base_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            
            // Check if this is a target directory to clean
            if path.is_dir() {
                if let Some(dir_name) = path.file_name() {
                    if let Some(dir_name_str) = dir_name.to_str() {
                        if dir_name_str == target_dir {
                            // Calculate the size before removing
                            let dir_size = get_dir_size(&path);
                            
                            // Try to remove the directory
                            if let Err(e) = fs::remove_dir_all(&path) {
                                errors.push(format!("Failed to remove {}: {}", path.display(), e));
                            } else {
                                *total_cleaned += 1;
                                *total_size += dir_size;
                                cleaned_dirs.push(path.display().to_string());
                            }
                        } else {
                            // Recursively search in subdirectories
                            clean_recursive(&path, target_dir, total_cleaned, total_size, cleaned_dirs, errors);
                        }
                    }
                }
            }
        }
    }
}

#[tauri::command]
fn get_dir_size(path: &Path) -> u64 {
    let mut size = 0;
    
    if path.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    size += get_dir_size(&path);
                } else if path.is_file() {
                    size += fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                }
            }
        }
    }
    
    size
}



// Function to initialize the projects path once
fn init_project_path(handle: &AppHandle) {
    let mut path_guard = PROJECTS_PATH.lock().unwrap();
    if path_guard.is_none() {
        if let Ok(mut path) = handle.path().app_data_dir() {
            path.push("projects"); // Append "projects" folder

            // Check if the projects directory exists and create it if not
            if !path.exists() {
                println!("Creating projects directory: {:?}", path);
                if let Err(e) = fs::create_dir_all(&path) {
                    eprintln!("Error creating projects directory: {:?}", e);
                    // Optionally, you might want to set a flag or return an error
                    // to indicate that the directory couldn't be created.
                    *path_guard = None; // Indicate failure to initialize
                    return;
                }
            }
            *path_guard = Some(path);
        }
    }
}
// Function to get the projects path
fn get_project_path() -> Option<PathBuf> {
    PROJECTS_PATH.lock().unwrap().clone()
}

#[command]
fn get_operating_system() -> String {
  let os = consts::OS;
  os.to_string()
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


#[command]
fn open_in_explorer(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let result = if cfg!(target_os = "windows") {
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&path)
            .spawn()
    } else if cfg!(target_os = "linux") {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
    } else {
        return Err("Unsupported operating system".to_string());
    };

    match result {
        Ok(_) => Ok(format!("Opened explorer at {}", path)),
        Err(e) => Err(format!("Failed to open explorer: {}", e)),
    }
}

#[command]
fn open_in_vscode(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "code", &path])
            .spawn()
    } else if cfg!(target_os = "macos") || cfg!(target_os = "linux") {
        Command::new("code")
            .arg(&path)
            .spawn()
    } else {
        return Err("Unsupported operating system".to_string());
    };

    match result {
        Ok(_) => Ok(format!("Opened VSCode at {}", path)),
        Err(e) => Err(format!("Failed to open VSCode: {}", e)),
    }
}

#[command]
fn open_terminal(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "start", "cmd.exe", "/K", &format!("cd /d \"{}\"", path)])
            .spawn()
    } else if cfg!(target_os = "macos") {
        // Create an AppleScript that opens Terminal and runs a cd command
        let apple_script = format!(
            "tell application \"Terminal\"\n\
             do script \"cd '{}'\" \n\
             activate\n\
             end tell",
            path.replace("'", "'\\''") // Escape single quotes for AppleScript
        );
        
        Command::new("osascript")
            .arg("-e")
            .arg(apple_script)
            .spawn()
    } else if cfg!(target_os = "linux") {
        // Try to determine which terminal emulator to use
        if Command::new("which").arg("gnome-terminal").output().map(|output| output.status.success()).unwrap_or(false) {
            Command::new("gnome-terminal")
                .args(["--working-directory", &path])
                .spawn()
        } else if Command::new("which").arg("konsole").output().map(|output| output.status.success()).unwrap_or(false) {
            Command::new("konsole")
                .args(["--workdir", &path])
                .spawn()
        } else if Command::new("which").arg("xterm").output().map(|output| output.status.success()).unwrap_or(false) {
            Command::new("xterm")
                .args(["-e", &format!("cd {} && bash", path)])
                .spawn()
        } else {
            return Err("No supported terminal emulator found".to_string());
        }
    } else {
        return Err("Unsupported operating system".to_string());
    };

    match result {
        Ok(_) => Ok(format!("Opened terminal at {}", path)),
        Err(e) => Err(format!("Failed to open terminal: {}", e)),
    }
}

#[command]
fn delete_project(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    match fs::remove_dir_all(path.clone()) {
        Ok(_) => Ok(format!("Project deleted successfully at {}", path)),
        Err(e) => Err(format!("Failed to delete project: {}", e)),
    }
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
) -> Result<String, String> {
    if let Some(project_path) = get_project_path() {
        let project_dir = project_path.join(&name);

        // Check if the directory already exists
        if project_dir.exists() {
            return Err(format!("Directory '{}' already exists. Please choose a different name.", name));
        }

        if let Err(e) = fs::create_dir_all(&project_dir) {
            return Err(format!("Failed to create project directory: {}", e));
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
            args.push("--no-app".into());  // Use pages router if app router is "no"
        }
        
        if turbopack == "yes" {
            args.push("--turbopack".into());
        } else if turbopack == "no" {
            args.push("--no-turbopack".into());
        }
        
        // Always add these flags
        args.push("--no-import-alias".into());
        args.push("--skip-install".into());

        let command_str = if cfg!(target_os = "windows") {
            "npx.cmd"
        } else {
            "npx"
        };

        println!("Running command: {} create-next-app@latest {} {} in {:?}", 
                 command_str, 
                 name, 
                 args.join(" "), 
                 &project_path);

        // Create a command that inherits stdio to prevent hanging
        let output = Command::new(command_str)
            .arg("create-next-app@latest")
            .arg(&name)
            .args(&args)
            .current_dir(&project_path)
            .stdin(Stdio::inherit())  // Allow stdin for any interactive prompts
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;

        if output.status.success() {
            Ok(format!("Project '{}' created successfully.", name))
        } else {
            let status_code = output.status.code().unwrap_or(-1);
            Err(format!("Project creation failed with exit code: {}", status_code))
        }
    } else {
        Err("Projects path not initialized.".into())
    }
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .setup(|app| {
            let handle = app.handle();
            init_project_path(&handle);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![create_angular_project, get_last_modified, create_next_project, get_operating_system, delete_project
            , open_in_explorer, open_in_vscode, open_terminal, clean_project, get_dir_size])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}