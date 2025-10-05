import fs from 'fs';
import path from 'path';
import { clientRootDirPath } from '../utils/path.js';
import { loadConfig } from '../utils/loadConfig.js';

export async function createInitWorkspaceShellFile(): Promise<void> {
  try {
    // Load configuration
    const configPath = path.join(clientRootDirPath, 'pbk.config.json');
    const config = loadConfig(configPath);
    
    if (!config) {
      console.error('Configuration file not found or invalid');
      return;
    }

    // Create shell script content with escaped bash variables using $ prefix
    let shellScriptContent = `#!/usr/bin/bash

current_path=\$(pwd)
echo "Current path is: \$current_path"

# Function to select editor
select_editor() {
    # Default editor
    EDITOR="code"
    
    # Array of options
    options=("VSCode" "Cursor" "Trae")
    selected=0
    
    # Function to print menu
    print_menu() {
        for i in "\${!options[@]}"; do
            if [ \$i -eq \$selected ]; then
                echo "> \${options[\$i]}"
            else
                echo "  \${options[\$i]}"
            fi
        done
    }
    
    # Print initial menu
    echo "Select editor (default: VSCode in 10 seconds):"
    print_menu
    
    # Start timer in background
    (sleep 10; kill -USR1 \$$) & timer_pid=\$!
    
    # Handle timer expiration
    trap 'selected=0; break' USR1
    
    # Read keys
    while true; do
        read -rsn1 key
        case "\$key" in
            A) # Up arrow
                ((selected--))
                [ \$selected -lt 0 ] && selected=\$((\${#options[@]}-1))
                clear
                echo "Select editor (default: VSCode in 10 seconds):"
                print_menu
                ;;
            B) # Down arrow
                ((selected++))
                [ \$selected -ge \${#options[@]} ] && selected=0
                clear
                echo "Select editor (default: VSCode in 10 seconds):"
                print_menu
                ;;
            "") # Enter key
                kill \$timer_pid 2>/dev/null
                break
                ;;
        esac
    done
    
    # Kill timer if it's still running
    kill \$timer_pid 2>/dev/null
    
    # Set editor based on selection
    if [ \$selected -eq 1 ]; then
        EDITOR="cursor"
    elif [ \$selected -eq 2 ]; then
        EDITOR="trae"
    fi
    
    echo "Selected: \${options[\$selected]}"
    return \$selected
}

# Call select editor function
select_editor
EDITOR_CHOICE=\$?

# Store the editor command
if [[ \$EDITOR_CHOICE -eq 1 ]]; then
    EDITOR_CMD="cursor"
elif [[ \$EDITOR_CHOICE -eq 2 ]]; then
    EDITOR_CMD="trae"
else
    EDITOR_CMD="code"
fi

echo "Editor command: \$EDITOR_CMD"

`;

    // Add project paths from configuration
    for (const project of config.projects) {
      shellScriptContent += `\n# Project: ${project.projectName}\n`;
      shellScriptContent += `cd ${project.projectBaseDirPath}\n`;
      shellScriptContent += `\$EDITOR_CMD .\n`;
      
      // Add sections if they have repository paths
      for (const section of project.sections) {
        if (section.repository && section.repository.path) {
          shellScriptContent += `\ncd ${section.repository.path}\n`;
          shellScriptContent += `\$EDITOR_CMD .\n`;
        }
      }
      
      // Return to original directory after each project
      shellScriptContent += `\ncd \$current_path\n`;
    }
    
    // Save shell script to file
    const shellScriptPath = path.join(clientRootDirPath, 'initWorkspace.sh');
    fs.writeFileSync(shellScriptPath, shellScriptContent, { mode: 0o755 }); // Set execute permissions
    
    console.log(`Shell script created at: ${shellScriptPath}`);
    console.log('Remember to make it executable with: chmod +x initWorkspace.sh');
  } catch (error) {
    console.error('Error creating workspace init shell file:', error);
  }
} 