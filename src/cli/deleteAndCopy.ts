import * as fs from 'fs';
import * as path from 'path';
import { startProgress, successProgress, failProgress, updateProgress } from '../utils/progress.js';
import { Ora } from 'ora';

/**
 * Deletes all files in the target directory and copies all files from source directory
 * @param sourcePath - Source directory path
 * @param targetPath - Target directory path
 */
export async function deleteAndCopy(sourcePath: string, targetPath: string): Promise<void> {
    const spinner = startProgress(`Preparing to copy files from ${path.basename(sourcePath)} to ${path.basename(targetPath)}`);
    
    try {
        // Ensure target directory exists
        if (!fs.existsSync(targetPath)) {
            updateProgress(spinner, `Creating target directory: ${targetPath}`);
            fs.mkdirSync(targetPath, { recursive: true });
        } else {
            // Delete existing files and directories in target
            updateProgress(spinner, `Cleaning target directory: ${targetPath}`);
            const items = fs.readdirSync(targetPath);
            for (const item of items) {
                const itemPath = path.join(targetPath, item);
                if (fs.lstatSync(itemPath).isDirectory()) {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(itemPath);
                }
            }
        }

        // Copy all files from source to target
        updateProgress(spinner, `Copying files from ${sourcePath} to ${targetPath}`);
        await copyDirectoryRecursive(sourcePath, targetPath, spinner);
        successProgress(spinner, `Successfully copied all files from ${path.basename(sourcePath)} to ${path.basename(targetPath)}`);
    } catch (error) {
        failProgress(spinner, `Error during deleteAndCopy operation`);
        console.error(`Error during deleteAndCopy operation:`, error);
        throw error;
    }
}

/**
 * Counts the total number of files in a directory recursively
 * @param directory - Directory to count files in
 * @returns Total number of files
 */
function countFiles(directory: string): number {
    let count = 0;
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
        const itemPath = path.join(directory, item);
        if (fs.lstatSync(itemPath).isDirectory()) {
            count += countFiles(itemPath);
        } else {
            count++;
        }
    }
    
    return count;
}

/**
 * Copies directory contents recursively
 * @param source - Source directory
 * @param target - Target directory
 * @param spinner - Progress spinner
 */
async function copyDirectoryRecursive(source: string, target: string, spinner: Ora): Promise<void> {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    
    // Get all files and directories in the source
    const items = fs.readdirSync(source);
    
    for (const item of items) {
        const sourcePath = path.join(source, item);
        const targetPath = path.join(target, item);
        
        if (fs.lstatSync(sourcePath).isDirectory()) {
            // Update progress for directories
            updateProgress(spinner, `Copying directory: ${item}`);
            // Recursively copy subdirectories
            await copyDirectoryRecursive(sourcePath, targetPath, spinner);
        } else {
            // Copy files
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}