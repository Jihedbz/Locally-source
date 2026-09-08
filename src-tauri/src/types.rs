use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: String,
    pub r#type: String,
    pub created_at: String,
    pub pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmPackage {
    pub name: String,
    pub version: String,
    pub dependency_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmSearchResult {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub package_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmPackageMetadata {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub license: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmAvailability {
    pub installed: bool,
    pub version: Option<String>,
    pub online: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmProgressPayload {
    pub install_id: String,
    pub line: String,
    pub stream: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpmVulnerabilityAdvisory {
    pub name: String,
    pub title: Option<String>,
    pub url: Option<String>,
    pub severity: String,
    pub range: Option<String>,
    pub cwe: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpmFixAvailable {
    pub name: Option<String>,
    pub version: Option<String>,
    pub is_sem_ver_major: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NpmVulnerabilityItem {
    pub name: String,
    pub severity: String,
    pub is_direct: bool,
    pub range: Option<String>,
    pub effects: Vec<String>,
    pub via: Vec<String>,
    pub fix_available: Option<NpmFixAvailable>,
    pub advisories: Vec<NpmVulnerabilityAdvisory>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpmAuditSummary {
    pub info: u64,
    pub low: u64,
    pub moderate: u64,
    pub high: u64,
    pub critical: u64,
    pub total: u64,
    pub total_dependencies: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpmAuditReport {
    pub summary: NpmAuditSummary,
    pub vulnerabilities: Vec<NpmVulnerabilityItem>,
}


#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Path does not exist: {0}")]
    PathNotFound(String),

    #[error("Command execution failed: {0}")]
    CommandFailed(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("JSON serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
