import path from "path";
import { join } from "path";
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { clientRootDirPath } from "../utils/path.js";
import dotenv from "dotenv";
import { isDeveloperAdarsh } from "../configs/environment.js";
import { loadConfig } from "../utils/loadConfig.js";
import { TPbkProject } from "../types.js";


dotenv.config();

async function commitB2fPortalChanges(repoPath: string) {

    const options: Partial<SimpleGitOptions> = {
        baseDir: path.resolve(repoPath),
        binary: "git",
        maxConcurrentProcesses: 6,
    };

    const git: SimpleGit = simpleGit(options);

    try {
        // Fetch the status of the repo
        const status = await git.status();

        const b2fPortalChanges = status.files.some((file: { path: string }) => file.path.startsWith("b2fPortal/"));

        if (!b2fPortalChanges) {
            console.log(`No changes detected in the b2fPortal directory. Skipping commit.`);
            return;
        }

        // Save the current branch name
        const currentBranch = status.current;

        if (currentBranch !== "main") {
            console.error(`Current branch is ${currentBranch}, but it should be main.`);
            process.exit(1);
        }

        // Pull the latest changes
        await git.pull();

        // Add only the b2fPortal folder
        await git.add("b2fPortal/*");

        // Commit with the current date and time
        const currentDate = new Date().toLocaleString();
        const commitMessage = `${currentDate} backend portal updated`;
        await git.commit(commitMessage);

        // Push the commit to the main branch
        await git.push("origin", "main");

        console.log("Changes committed and pushed successfully");
    } catch (error: any) {
        console.error("Error while committing changes:", error.message);

        // Handle edge case where the repository might have conflicting changes
        if (error.message.includes("CONFLICT")) {
            console.error("Merge conflict detected. Please resolve conflicts manually.");
        }
    }
}

export async function gitPushAllRepos() {
     // Load projects from the configuration file
const config = loadConfig();

// Export projects for use in CLI tools
 let b2fPortalProjects: TPbkProject[] = config.projects;
    for (const project of b2fPortalProjects) {
        for (const section of project.sections) {
            if (isDeveloperAdarsh) {
                const repositoryPath = join(clientRootDirPath, section.repository.path);
                console.log(`\n----------------${section.repository.name} started----------------`);
                await commitB2fPortalChanges(repositoryPath);
                console.log(`----------------${section.repository.name} finished----------------\n`);
            }
        }
    }
}

// if (isDeveloperAdarsh) {
//     gitPushAllRepos();
// } else {
//     console.log("This command can only be run by authorized developers.");
// }