import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Utility functions for working with paths in the backend kit
 */

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Calculate common paths
export const packageRootDirPath = join(__dirname, '..', '..'); 
export const packageSrcDirPath = join(packageRootDirPath, 'src');
export const packageDistDirPath = join(packageRootDirPath, 'dist');

export const  clientRootDirPath = process.cwd()
export const clientSrcDirPath = join(clientRootDirPath, 'src');
export const clientDistDirPath = join(clientRootDirPath, 'dist');