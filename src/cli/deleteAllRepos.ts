// Import necessary modules
import { promises as fs } from "fs";
import { join } from "path";
import { clientRootDirPath } from "../utils/path.js";
import { isDeveloperAdarsh } from "../configs/environment.js";
import { loadConfig } from "../utils/loadConfig.js";
import { TPbkProject } from "../types.js";

// Function to delete all files and directories within /b2fPortal
async function deleteB2fPortal(repoPath: string): Promise<void> {
    // Construct the full path to /b2fPortal directory
    const b2fPortalPath = join(repoPath, "b2fPortal");

    try {
        // Check if the directory exists
        await fs.access(b2fPortalPath);

        // Read all items in the b2fPortal directory
        const items = await fs.readdir(b2fPortalPath);

        // Iterate over each item and delete it
        for (const item of items) {
            const itemPath = join(b2fPortalPath, item);
            const stat = await fs.lstat(itemPath);

            if (stat.isDirectory()) {
                // Recursively remove directories
                await fs.rm(itemPath, { recursive: true, force: true });
            } else {
                // Remove files
                await fs.unlink(itemPath);
            }
        }

        console.log("All files and directories deleted from /b2fPortal.");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            console.log("/b2fPortal directory does not exist.");
        } else {
            console.error("Error deleting /b2fPortal:", error);
        }
    }
}

export async function deleteAllRepos(): Promise<void> {
       // Load projects from the configuration file
const config = loadConfig();

// Export projects for use in CLI tools
 let b2fPortalProjects: TPbkProject[] = config.projects;
 console.log("------------deleteAllRepos Started-------------");

 
    if (!isDeveloperAdarsh) {
        console.log("You are not allowed to run this command.");
        return;
    }
 

    for (const project of b2fPortalProjects) {
        for (const section of project.sections) {
            if (isDeveloperAdarsh) {
                const repositoryPath = join(clientRootDirPath, section.repository.path);
                console.log({repositoryPath});
                
                console.log(`\n----------------${section.repository.name} started----------------`);

                await deleteB2fPortal(repositoryPath);

                console.log(`----------------${section.repository.name} finished----------------\n`);
            }
        }
    }
}

// deleteAllRepos();
