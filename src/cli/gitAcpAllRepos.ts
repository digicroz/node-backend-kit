import fs from "fs";
import { join } from "path";
import path from "path";
import readline from "node:readline";
import { clientRootDirPath } from "../utils/path.js";
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { isDeveloperAdarsh } from "../configs/environment.js";
import { TPbkProject } from "../types.js";
import { loadConfig } from "../utils/loadConfig.js";
import { createMultiProgress, failProgress, startProgress, successProgress, updateProgress } from "../utils/progress.js";

const getAllPaths = () => {
    try {
           // Load projects from the configuration file
const config = loadConfig();

// Export projects for use in CLI tools
 let b2fPortalProjects: TPbkProject[] = config.projects;
 
        const allPaths = [];
        allPaths.push(clientRootDirPath);
        for (const project of b2fPortalProjects) {
            if (project.sharedBackendPath) {
                const sharedBackendPath = join(clientRootDirPath, project.sharedBackendPath);
                if (!fs.existsSync(sharedBackendPath)) {
                    console.log("sharedBackendPath does not exist");
                    console.log({ sharedBackendPath });
                    return [];
                }
                allPaths.push(sharedBackendPath);
            }
            for (const section of project.sections) {
                if (section.repository.path) {
                    const repositoryPath = join(clientRootDirPath, section.repository.path);
                    if (!fs.existsSync(repositoryPath)) {
                        console.log("repositoryPath does not exist");
                        console.log({ repositoryPath });
                        return [];
                    }
                    allPaths.push(repositoryPath);
                }
            }
        }
        return allPaths;
    } catch (error) {
        console.log(error);
        return [];
    }
};

const runAcpCommands = async (repoPath: string, message: string) => {
    try {
        const repositoryPackageJsonPath = join(repoPath, "package.json");
        if (!fs.existsSync(repositoryPackageJsonPath)) {
            console.log("repositoryPackageJsonPath does not exist");
            console.log({ repositoryPackageJsonPath });
            return;
        }
        const repositoryPackageJson = JSON.parse(
            fs.readFileSync(repositoryPackageJsonPath, "utf8")
        );
        if (!repositoryPackageJson.name) {
            console.log("repositoryPackageJson.name does not exist");
            console.log({ repositoryPackageJson });
            return;
        }
        
        const spinner = startProgress(`Running ACP in ${repositoryPackageJson.name}`);

        const options: Partial<SimpleGitOptions> = {
            baseDir: path.resolve(repoPath),
            binary: "git",
            maxConcurrentProcesses: 6,
        };
        const git: SimpleGit = simpleGit(options);
        updateProgress(spinner, `${repositoryPackageJson.name}: fetching ...`);

        await git.fetch();
        updateProgress(spinner, `${repositoryPackageJson.name}: Checking status ...`);

        let status = await git.status();

        // Save the current branch name
        const currentBranch = status.current;

        // console.log(currentBranch);

        if (currentBranch !== "main") {
            failProgress(spinner, `Current branch is ${currentBranch}, but it should be main.`);
            console.log(`Repo: ${repoPath}`);
            process.exit(1);
        }
        
        if (status.files.length > 0) {
            updateProgress(spinner, `${repositoryPackageJson.name}: Adding files ...`);
            await git.add(".");
            updateProgress(spinner, `${repositoryPackageJson.name}: Committing changes ...`);
            await git.commit(message);
        }

        updateProgress(spinner, `${repositoryPackageJson.name}: pulling ...`);

        await git.pull();
        updateProgress(spinner, `${repositoryPackageJson.name}: Checking status ...`);

        status = await git.status();

        // Check for new uncommitted changes after pulling
        if (status.files.length > 0) {
            updateProgress(spinner, `${repositoryPackageJson.name}: Adding files after pull ...`);
            await git.add(".");
            updateProgress(spinner, `${repositoryPackageJson.name}: Committing changes after pull ...`);
            await git.commit(message);
        }
        
        updateProgress(spinner, `${repositoryPackageJson.name}: pushing ...`);
        await git.push();

        successProgress(spinner, `Running ACP in ${repositoryPackageJson.name} Finished`);
    } catch (error: any) {
        console.error("Error while committing changes:", error.message);

        // Handle edge case where the repository might have conflicting changes
        if (error.message.includes("CONFLICT")) {
            console.error("Merge conflict detected. Please resolve conflicts manually.");
        }
    }
};

export const gitAcpAllRepos = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    function askQuestion(query: string): Promise<string> {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    }

    try {
        let commitMessage = await askQuestion("Enter Commit Message: ");
        rl.close();
        if (commitMessage.trim() === "") {
            commitMessage = "Git Acp All Repos";
        }

        console.log("------------gitAcpAllRepos Started-------------");

        const allPaths = getAllPaths();
        
        if (allPaths.length === 0) {
            console.log("No valid repositories found. Exiting.");
            return;
        }
        
        const progress = createMultiProgress();
        progress.start("Processing repositories");
        progress.setTotal(allPaths.length);
        
        for (const repoPath of allPaths) {
            try {
                await runAcpCommands(repoPath, `${new Date().toLocaleString()} : ${commitMessage}`);
                progress.incrementCompleted();
            } catch (error) {
                progress.incrementFailed();
                console.error(`Error processing repository: ${repoPath}`, error);
            }
        }
        
        progress.complete();
        console.log("------------gitAcpAllRepos Ended-------------");
    } catch (error) {
        console.log(error);
    }
};

// if (isDeveloperAdarsh) {
//     gitAcpAllRepos();
// } else {
//     console.log("This command can only be run by authorized developers.");
// }