import * as fs from "fs";
import * as path from "path";

/**
 * Recursively finds all .ts files in the provided directory.
 * @param dir The directory to search.
 * @returns An array of full paths to .ts files.
 */
export function getTsFiles(dir: string): string[] {
    let results: string[] = [];
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            results = results.concat(getTsFiles(fullPath));
        } else if (stat.isFile() && fullPath.endsWith(".ts") && !fullPath.endsWith(".d.ts")) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Updates import/export statements in the given file by removing a trailing `.js` extension.
 * Handles both static and dynamic import syntax.
 * @param filePath Full path to the .ts file.
 */
export function updateImports(filePath: string): void {
    const content = fs.readFileSync(filePath, "utf-8");
    let updatedContent = content;

    // Regular expression for static imports/exports e.g.:
    // import ... from 'module'
    // export ... from "module"
    const staticRegex = /((?:import|export)(?:[\s\S]*?)from\s+)(['"])([^'"]+\.js)(\2)/g;

    updatedContent = updatedContent.replace(
        staticRegex,
        (_match, before, quote, modulePath, _quote) => {
            // Remove the trailing ".js" from the module path.
            const newModulePath = modulePath.replace(/\.js$/, "");
            return `${before}${quote}${newModulePath}${quote}`;
        }
    );

    // Regular expression for dynamic imports e.g.:
    // import('module')
    const dynamicRegex = /(\bimport\(\s*)(['"])([^'"]+\.js)(\2)/g;

    updatedContent = updatedContent.replace(
        dynamicRegex,
        (_match, before, quote, modulePath, _quote) => {
            const newModulePath = modulePath.replace(/\.js$/, "");
            return `${before}${quote}${newModulePath}${quote}`;
        }
    );

    if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, "utf-8");
        // console.log(`Updated: ${filePath}`);
    }
}
