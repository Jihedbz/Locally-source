// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod config;
pub mod types;
pub mod utils;

pub use types::*;
pub use utils::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::init();
    log::info!("Starting Locally Desktop application...");

    // Set IBUS_ADDRESS environment variable to prevent connection warnings
    if std::env::var("IBUS_ADDRESS").is_err() {
        if let Ok(ibus_address) = std::process::Command::new("ibus")
            .arg("address")
            .output()
            .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
        {
            if !ibus_address.is_empty() {
                std::env::set_var("IBUS_ADDRESS", ibus_address);
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .setup(|app| {
            let handle = app.handle();
            let _ = commands::projects::init_project_path(&handle);
            app.manage(utils::ProcessManager::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::projects::create_angular_project,
            commands::projects::create_react_project,
            commands::projects::create_vue_project,
            commands::projects::create_next_project,
            commands::projects::delete_project,
            commands::projects::get_dir_size_command,
            commands::projects::check_npm_availability,
            commands::projects::init_package_json,
            commands::projects::get_npm_packages,
            commands::projects::search_npm_packages,
            commands::projects::get_npm_package_metadata,
            commands::projects::install_npm_package,
            commands::projects::update_npm_package,
            commands::projects::remove_npm_package,
            commands::projects::cancel_npm_install,
            commands::system::get_operating_system_command,
            commands::system::open_in_explorer,
            commands::system::open_in_vscode,
            commands::system::open_terminal,
            commands::system::get_last_modified_command,
            commands::cleanup::clean_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
