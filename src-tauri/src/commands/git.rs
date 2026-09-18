use crate::commands::projects::validate_project_dir_path;
use crate::types::{AppError, AppResult, GitStatusReport};
use crate::utils::execute_command;
use tauri::command;
use tokio::task;

fn git_command() -> &'static str {
    if cfg!(target_os = "windows") {
        "git.exe"
    } else {
        "git"
    }
}

#[command]
pub async fn get_git_status(path: String) -> AppResult<GitStatusReport> {
    let project_path = validate_project_dir_path(&path)?;

    task::spawn_blocking(move || {
        let git_binary = git_command();

        // 1. Check if inside git repository
        let is_repo = execute_command(git_binary, &["rev-parse", "--is-inside-work-tree"], Some(&project_path))
            .map(|out| out.trim() == "true")
            .unwrap_or(false);

        if !is_repo {
            return Ok(GitStatusReport::default());
        }

        // 2. Get current branch name
        let branch = execute_command(git_binary, &["branch", "--show-current"], Some(&project_path))
            .map(|out| {
                let trimmed = out.trim().to_string();
                if trimmed.is_empty() {
                    execute_command(git_binary, &["rev-parse", "--short", "HEAD"], Some(&project_path))
                        .map(|h| format!("detached@{}", h.trim()))
                        .ok()
                } else {
                    Some(trimmed)
                }
            })
            .ok()
            .flatten();

        // 3. Count modified, untracked, staged files
        let mut modified_count = 0usize;
        let mut untracked_count = 0usize;
        let mut staged_count = 0usize;

        if let Ok(status_output) = execute_command(git_binary, &["status", "--porcelain"], Some(&project_path)) {
            for line in status_output.lines() {
                if line.len() >= 2 {
                    let index_char = line.chars().next().unwrap_or(' ');
                    let work_char = line.chars().nth(1).unwrap_or(' ');

                    if index_char == '?' && work_char == '?' {
                        untracked_count += 1;
                    } else {
                        if index_char != ' ' && index_char != '?' {
                            staged_count += 1;
                        }
                        if work_char != ' ' && work_char != '?' {
                            modified_count += 1;
                        }
                    }
                }
            }
        }

        let is_clean = modified_count == 0 && untracked_count == 0 && staged_count == 0;

        // 4. Get last commit details
        let mut last_commit_hash = None;
        let mut last_commit_author = None;
        let mut last_commit_message = None;
        let mut last_commit_timestamp = None;

        if let Ok(log_output) = execute_command(
            git_binary,
            &["log", "-1", "--format=%H%n%an%n%s%n%at"],
            Some(&project_path),
        ) {
            let mut lines = log_output.lines();
            if let Some(h) = lines.next() {
                if !h.trim().is_empty() {
                    last_commit_hash = Some(h.trim().to_string());
                }
            }
            if let Some(a) = lines.next() {
                last_commit_author = Some(a.trim().to_string());
            }
            if let Some(m) = lines.next() {
                last_commit_message = Some(m.trim().to_string());
            }
            if let Some(t) = lines.next() {
                last_commit_timestamp = t.trim().parse::<u64>().ok();
            }
        }

        Ok(GitStatusReport {
            is_repo: true,
            branch,
            is_clean,
            modified_count,
            untracked_count,
            staged_count,
            last_commit_hash,
            last_commit_author,
            last_commit_message,
            last_commit_timestamp,
        })
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn git_fetch(path: String) -> AppResult<String> {
    let project_path = validate_project_dir_path(&path)?;

    task::spawn_blocking(move || {
        execute_command(git_command(), &["fetch"], Some(&project_path))
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}

#[command]
pub async fn git_pull(path: String) -> AppResult<String> {
    let project_path = validate_project_dir_path(&path)?;

    task::spawn_blocking(move || {
        execute_command(git_command(), &["pull"], Some(&project_path))
    })
    .await
    .map_err(|e| AppError::CommandFailed(format!("Task execution failed: {}", e)))?
}
