use std::path::Path;
use std::process::{Command, Stdio};
use tauri::command;
use tokio::task;
use std::fs;

use std::time::{UNIX_EPOCH};

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
async fn create_project(name: String, path: String, template: String) -> Result<String, String> {
    // Debug: Log the received path
    println!("Received project path: {:?}", path);

    let command = match template.as_str() {
        "React" => format!("npx create-react-app {}", name),
        "Angular" => format!("ng new {} --skip-install", name),
        _ => return Err("Invalid template".to_string()),
    };

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
async fn create_next_project(name: String, path: String, typescript: String, 
                            eslint: String, tailwind: String, src: String, 
                            app_router: String, turbopack: String, alias: String) -> Result<String, String> {
    // Debug: Log the received path
    println!("Received project path: {:?}", path);

    let typescript_reformed = match typescript.as_str() {
        "yes" => format!("--typescript"),
        "no" => format!("--js"),
        _ => return Err("Invalid typescript".to_string()),
    };

    let eslint_reformed = match eslint.as_str() {
        "yes" => format!("--eslint"),
        "no" => format!("--no-eslint"),
        _ => return Err("Invalid eslint".to_string()),
    };

    let tailwind_reformed = match tailwind.as_str() {
        "yes" => format!("--tailwind"),
        "no" => format!("--no-tailwind"),
        _ => return Err("Invalid tailwind".to_string()),
    };

    let src_reformed = match src.as_str() {
        "yes" => format!("--src"),
        "no" => format!("--no-src"),
        _ => return Err("Invalid src".to_string()),
    };

    let alias_reformed = if alias == "no" {
        "--no-alias".to_string()
    } else {
        format!("--import-alias {}", alias)
    };
    

    let turbopack_reformed = match turbopack.as_str() {
        "yes" => format!("--turbopack"),
        "no" => format!("--no-turbopack"),
        _ => return Err("Invalid app router".to_string()),
    };

    let app_router_reformed = match app_router.as_str() {
        "yes" => format!("--turbopack"),
        "no" => format!("--no-turbopack"),
        _ => return Err("Invalid app router".to_string()),
    };




    let command = format!(
        "npx create-next-app@latest {} {} {} {} {} {} {} {}",
        name, 
        typescript_reformed, 
        eslint_reformed, 
        tailwind_reformed, 
        src_reformed, 
        app_router_reformed, 
        turbopack_reformed, 
        alias_reformed
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




fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .invoke_handler(tauri::generate_handler![create_project, get_last_modified, get_folder_size, create_next_project])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
