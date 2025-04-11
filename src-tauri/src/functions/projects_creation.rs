
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