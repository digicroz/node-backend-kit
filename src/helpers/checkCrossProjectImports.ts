import * as fs from "fs";
import * as path from "path";
import { TPbkProject } from "../types.js";


// Helper function to find all .ts files in a directory (including subdirectories)
async function findTsFilesInDir(directoryPath: string): Promise<string[]> {
    const files: string[] = [];
    const direntArr = await fs.promises.readdir(directoryPath, { withFileTypes: true });

    for (const dirent of direntArr) {
        const fullPath = path.join(directoryPath, dirent.name);
        if (dirent.isDirectory()) {
            // Recursively search in subdirectories
            files.push(...await findTsFilesInDir(fullPath));
        } else if (dirent.isFile() && dirent.name.endsWith(".ts")) {
            // Add .ts files to the result
            files.push(fullPath);
        }
    }

    return files;
}

// Main function to validate project imports
export async function checkCrossProjectImportsFun(b2fPortalProjects:TPbkProject[]): Promise<void> {
    console.log("------------checkCrossProjectImports Started-------------");
    let clientRootDirPath = process.cwd();
    // Track number of cross-project import violations
    let crossProjectImportCount = 0;
//    console.log({clientRootDirPath});
   
    const srcDirPath = path.join(clientRootDirPath, 'src');
    const distDirPath = path.join(clientRootDirPath, 'dist');
    // Collect all project names
    const projectNames = b2fPortalProjects.map((project) => project.projectName);

    // Process each project
    for (const project of b2fPortalProjects) {
        const projectDir = path.resolve(srcDirPath, project.projectBaseDirPath);
        // console.log("Project directory:", projectDir);

        // Find all .ts files in the project directory (including subdirectories)
        const tsFiles = await findTsFilesInDir(projectDir);
        // console.log("Found .ts files:", tsFiles);

        // Process each TypeScript file
        for (const filePath of tsFiles) {
            // // console.log("Found file:", filePath); // Log the file being processed

            const content = await fs.promises.readFile(filePath, "utf-8");
            // // console.log("File content:", content); // Log the content of the file

            const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                // console.log("Import path:", importPath); // Log the import path found

                // Skip relative imports and external modules
                if (importPath.startsWith(".") || !importPath.includes("/")) {
                    continue;
                }                
                
                // Check if the import path includes another project's name
                const isCrossProjectImport = projectNames.some(
                    (otherProjectName) =>
                        otherProjectName !== project.projectName &&
                        importPath.includes(otherProjectName)
                );

                if (isCrossProjectImport) {
                    crossProjectImportCount++;
                    console.error(
                        `\n[ERROR] Invalid import detected in project "${project.projectName}":\n` +
                            `  - File: "${filePath}"\n` +
                            `  - Import Path: "${importPath}"\n`
                    );
                }
            }
        }
    }

    console.log(`------------checkCrossProjectImports Finished-------------`);
    if (crossProjectImportCount > 0) {
        console.log(`Found ${crossProjectImportCount} cross-project import violations.`);
    } else {
        console.log("No cross-project import violations detected.");
    }
}
