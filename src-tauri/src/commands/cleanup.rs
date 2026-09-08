use crate::commands::projects::get_managed_project_path;
use crate::types::AppResult;
use crate::utils::get_dir_size;
use std::fs;
use std::path::Path;
use tauri::command;

/// Recursively removes temporary build directories and files from a project.
///
/// Supported items include: node_modules, dist, build, .next, target, .DS_Store, etc.
///
/// # Arguments
/// * `path` - Absolute path to the project to clean.
#[command]
pub fn clean_project(path: String) -> AppResult<String> {
    log::info!("Cleaning project at: {}", path);
    let managed_path = get_managed_project_path(&path)?;

    // Define common directories and files to clean
    let temp_dirs = vec![
        "node_modules",
        ".cache",
        "dist",
        "build",
        ".next",
        ".nuxt",
        "target", // Rust build directory
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
        "obj",    // .NET build directories
        "vendor", // PHP/Composer dependencies
        ".sass-cache",
        ".fusebox",
        ".dynamodb",
        ".serverless",
        ".terraform",
        ".terragrunt-cache",
        ".gradle",
    ];

    // Files to clean (could be expanded)
    let temp_files = vec![
        ".DS_Store",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "*.log",
    ];

    let mut total_cleaned = 0usize;
    let mut total_size = 0u64;
    let mut cleaned_dirs = Vec::new();
    let mut errors = Vec::new();

    // Clean directories
    for temp_dir in temp_dirs {
        clean_recursive(
            &managed_path,
            temp_dir,
            &mut total_cleaned,
            &mut total_size,
            &mut cleaned_dirs,
            &mut errors,
        )?;
    }

    // Clean specific files (this is a simple version, could be enhanced with glob patterns)
    if let Ok(entries) = fs::read_dir(&managed_path) {
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
                                        let file_size =
                                            fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0);
                                        if let Err(e) = fs::remove_file(&entry_path) {
                                            errors.push(format!(
                                                "Failed to remove {}: {}",
                                                entry_path.display(),
                                                e
                                            ));
                                        } else {
                                            total_cleaned += 1;
                                            total_size += file_size;
                                            cleaned_dirs.push(entry_path.display().to_string());
                                        }
                                    }
                                }
                            } else if file_name_str == *pattern {
                                let file_size =
                                    fs::metadata(&entry_path).map(|m| m.len()).unwrap_or(0);
                                if let Err(e) = fs::remove_file(&entry_path) {
                                    errors.push(format!(
                                        "Failed to remove {}: {}",
                                        entry_path.display(),
                                        e
                                    ));
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
            format!(
                "Cleaned {} items ({}), but encountered {} errors",
                total_cleaned,
                formatted_size,
                errors.len()
            )
        }
    } else if !errors.is_empty() {
        format!("Nothing cleaned. Encountered {} errors", errors.len())
    } else {
        "No temporary files or directories found to clean".to_string()
    };

    log::info!("Cleanup finished: {}", result);
    Ok(result)
}

// Helper function to recursively search for and clean directories
fn clean_recursive(
    base_path: &Path,
    target_dir: &str,
    total_cleaned: &mut usize,
    total_size: &mut u64,
    cleaned_dirs: &mut Vec<String>,
    errors: &mut Vec<String>,
) -> AppResult<()> {
    if let Ok(entries) = fs::read_dir(base_path) {
        for entry in entries.flatten() {
            let path = entry.path();

            // Check if this is a target directory to clean
            if path.is_dir() {
                if let Some(dir_name) = path.file_name() {
                    if let Some(dir_name_str) = dir_name.to_str() {
                        if dir_name_str == target_dir {
                            let dir_size = get_dir_size(&path)?;

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
                            clean_recursive(
                                &path,
                                target_dir,
                                total_cleaned,
                                total_size,
                                cleaned_dirs,
                                errors,
                            )?;
                        }
                    }
                }
            }
        }
    }
    Ok(())
}
