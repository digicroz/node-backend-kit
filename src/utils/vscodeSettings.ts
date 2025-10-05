import fs from 'fs';
import path from 'path';
import { clientRootDirPath } from './path.js';
import { cleanTrailingCommas, stripComments } from './jsonFile.js';

interface VSCodeSettings {
    "files.associations"?: {
        [key: string]: string;
    };
    [key: string]: any;
}



export function updateVSCodeSettings(): void {
    const vscodeDir = path.join(clientRootDirPath, '.vscode');
    const settingsPath = path.join(vscodeDir, 'settings.json');

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Read existing settings or create new ones
    let settings: VSCodeSettings = {};
    let existingContent = '';
    
    if (fs.existsSync(settingsPath)) {
        try {
            existingContent = fs.readFileSync(settingsPath, 'utf-8');
            // Clean the content before parsing
            let cleanedContent = stripComments(existingContent);
             cleanedContent = cleanTrailingCommas(existingContent);
            // Try to parse the cleaned content
            settings = JSON.parse(cleanedContent);
        } catch (error) {
            if (error instanceof SyntaxError) {
                // Extract position information from the error message
                const positionMatch = error.message.match(/position (\d+)/);
                const position = positionMatch ? parseInt(positionMatch[1]) : 0;
                
                // Calculate line and column
                const lines = existingContent.slice(0, position).split('\n');
                const line = lines.length;
                const column = lines[lines.length - 1].length + 1;
                
                console.error(`JSON Parse Error at line ${line}, column ${column}`);
                console.error(`Error details: ${error.message}`);
                
                // Keep the existing content as is
                console.log('Keeping existing settings file unchanged due to parse error');
                return;
            }
            console.warn('Error reading .vscode/settings.json:', error);
            return;
        }
    }

    // Create a deep copy of existing settings to preserve all data
    const updatedSettings = JSON.parse(JSON.stringify(settings));

    // Initialize files.associations if it doesn't exist
    if (!updatedSettings["files.associations"]) {
        updatedSettings["files.associations"] = {};
    }

    // Only add pbk.config.json association if not already present
    if (!updatedSettings["files.associations"]["pbk.config.json"]) {
        updatedSettings["files.associations"]["pbk.config.json"] = "jsonc";
        console.log('Added pbk.config.json association to .vscode/settings.json');
    } else {
        console.log('pbk.config.json association already exists in .vscode/settings.json');
    }

    // Only write to file if changes were made
    if (JSON.stringify(settings) !== JSON.stringify(updatedSettings)) {
        try {
            fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 4));
        } catch (error) {
            console.error('Error writing to settings file:', error);
            console.log('Keeping existing settings file unchanged');
        }
    }
} 