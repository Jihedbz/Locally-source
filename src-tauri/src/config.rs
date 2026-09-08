use crate::types::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub project_path: Option<String>,
    pub theme: String,
    pub log_level: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            project_path: None,
            theme: "system".to_string(),
            log_level: "info".to_string(),
        }
    }
}

pub fn get_config_path(handle: &AppHandle) -> AppResult<PathBuf> {
    let mut path = handle
        .path()
        .app_config_dir()
        .map_err(|e| AppError::CommandFailed(format!("Failed to get app config dir: {}", e)))?;
    fs::create_dir_all(&path).map_err(|e| AppError::Io(e))?;
    path.push("config.json");
    Ok(path)
}

pub fn load_config(handle: &AppHandle) -> AppResult<AppConfig> {
    let path = get_config_path(handle)?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(path).map_err(|e| AppError::Io(e))?;
    let config = serde_json::from_str(&content).map_err(|e| AppError::SerializationError(e))?;
    Ok(config)
}

pub fn save_config(handle: &AppHandle, config: &AppConfig) -> AppResult<()> {
    let path = get_config_path(handle)?;
    let content =
        serde_json::to_string_pretty(config).map_err(|e| AppError::SerializationError(e))?;
    fs::write(path, content).map_err(|e| AppError::Io(e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.theme, "system");
        assert_eq!(config.log_level, "info");
        assert_eq!(config.project_path, None);
    }
}
