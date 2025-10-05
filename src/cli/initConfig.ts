import fs from 'fs';
import path from 'path';
import { clientRootDirPath } from '../utils/path.js';
import { updateVSCodeSettings } from '../utils/vscodeSettings.js';

export async function initConfig(): Promise<void> {
    const configPath = path.join(clientRootDirPath, 'pbk.config.json');
    
    // Check if pbk.config.json already exists
    if (fs.existsSync(configPath)) {
        console.log('pbk.config.json already exists in the project root.');
    } else {
        // Create pbk.config.json with default configuration
        const defaultConfig = {
            "b2fPortal": true,
            "checkCrossProjectImports": true,
            "projects": []
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('Created pbk.config.json with default configuration in the project root.');
    }

    // Update VSCode settings
    updateVSCodeSettings();
} 