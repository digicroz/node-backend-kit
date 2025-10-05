import fs from "fs";
import path from "path";
import { join } from "path";
import { clientRootDirPath, clientSrcDirPath } from "../utils/path.js";
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git";
import { isDeveloperAdarsh } from "../configs/environment.js";
;
import { deleteAndCopy } from "./deleteAndCopy.js";
import { loadConfig } from "../utils/loadConfig.js";
import { TPbkProject } from "../types.js";
import { createMultiProgress, failProgress, startProgress, successProgress, withProgress } from "../utils/progress.js";

export const transfer2Shared = async () => {
    // Load projects from the configuration file
const config = loadConfig();

// Export projects for use in CLI tools
 let b2fPortalProjects: TPbkProject[] = config.projects;
    console.log("------------transfer2Shared Started-------------");

    try {
        const mainSpinner = startProgress("Checking main repository status");
        
        const myGit: SimpleGit = simpleGit();
        const status = await myGit.status();

        // Save the current branch name
        const currentBranch = status.current;

        // console.log(currentBranch);

        if (currentBranch !== "main") {
            failProgress(mainSpinner, `Current branch is ${currentBranch}, but it should be main.`);
            throw new Error(`Current branch is ${currentBranch}, but it should be main.`);
        }
        if (status.files.length > 0) {
            failProgress(mainSpinner, "❌ Uncommitted changes detected");
            console.log("Commit or stash your changes before proceeding.");
            process.exit(1);
        }

        // Pull the latest changes
        mainSpinner.text = "Pulling latest changes from main repository";
        await myGit.pull();
        successProgress(mainSpinner, "Main repository checked successfully");

        const repositoryPackageJsonPath = join(clientRootDirPath, "package.json");
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

        if (b2fPortalProjects.length === 0) {
            console.log("No projects found in configuration");
            return;
        }
        
        const projectProgress = createMultiProgress();
        projectProgress.start("Processing projects");
        projectProgress.setTotal(b2fPortalProjects.length);

        for (const project of b2fPortalProjects) {
            const projectSpinner = startProgress(`Processing project: ${project.projectName}`);
            
            try {
                const serverB2fPath = join(clientSrcDirPath, "serverB2f");
                // console.log('serverB2fPath', serverB2fPath);
                if (!fs.existsSync(serverB2fPath)) {
                    failProgress(projectSpinner, "serverB2fPath does not exist");
                    console.log({ serverB2fPath });
                    projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                    continue;
                }

                const projectSrcPath = join(clientSrcDirPath, project.projectBaseDirPath);
                // console.log("projectSrcpath", projectSrcPath);
                if (!fs.existsSync(projectSrcPath)) {
                    failProgress(projectSpinner, "projectSrcPath does not exist");
                    console.log({ projectSrcPath });
                    projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                    continue;
                }

                if (project.sharedBackendPath) {
                    projectSpinner.text = `Checking shared backend path for project: ${project.projectName}`;
                    
                    const sharedBackendPath = join(clientRootDirPath, project.sharedBackendPath);
                    // console.log("sharedBackendPath", sharedBackendPath);
                    if (!fs.existsSync(sharedBackendPath)) {
                        failProgress(projectSpinner, "sharedBackendPath does not exist");
                        console.log({ sharedBackendPath });
                        projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                        continue;
                    }

                    const options: Partial<SimpleGitOptions> = {
                        baseDir: path.resolve(sharedBackendPath),
                        binary: "git",
                        maxConcurrentProcesses: 6,
                    };

                    projectSpinner.text = `Checking shared backend repository status for project: ${project.projectName}`;
                    
                    const sharedBackendGit: SimpleGit = simpleGit(options);

                    let sharedBackendGitStatus = await sharedBackendGit.status();

                    // Save the current branch name
                    const currentBranch = sharedBackendGitStatus.current;

                    // console.log(currentBranch);

                    if (currentBranch !== "main") {
                        failProgress(projectSpinner, `Shared backend branch is ${currentBranch}, but it should be main.`);
                        projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                        throw new Error(
                            ` Shared backend branch is ${currentBranch}, but it should be main.`
                        );
                    }

                    projectSpinner.text = `Pulling latest changes from shared backend repository for project: ${project.projectName}`;
                    await sharedBackendGit.pull();

                    const sharedProjectSrcPath = join(
                        sharedBackendPath,
                        "src",
                        project.projectBaseDirPath
                    );
                    // console.log("sharedProjectSrcPath", sharedProjectSrcPath);
                    if (!fs.existsSync(sharedProjectSrcPath)) {
                        failProgress(projectSpinner, "sharedProjectSrcPath does not exist");
                        console.log({ sharedProjectSrcPath });
                        projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                        continue;
                    }

                    projectSpinner.text = `Copying files for project: ${project.projectName}`;
                    await deleteAndCopy(projectSrcPath, sharedProjectSrcPath);

                    projectSpinner.text = `Checking for changes in shared backend repository for project: ${project.projectName}`;
                    sharedBackendGitStatus = await sharedBackendGit.status();

                    const sharedBackendChanges = sharedBackendGitStatus.files.some((file: { path: string }) =>
                        file.path.startsWith(`src/${project.projectBaseDirPath}/`)
                    );

                    if (!sharedBackendChanges) {
                        successProgress(projectSpinner, `No changes detected in the sharedBackend directory for project: ${project.projectName}`);
                        projectProgress.incrementCompleted(`Completed: ${project.projectName} - No changes`);
                        continue;
                    }
                    
                    const repositoryCommitJsonPath = join(sharedBackendPath, "commit.json");

                    if (!fs.existsSync(repositoryCommitJsonPath)) {
                        failProgress(projectSpinner, "repositoryCommitJsonPath does not exist");
                        console.log({ sharedBackendPath });
                        projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                        return;
                    }

                    const repositoryCommitJson = JSON.parse(
                        fs.readFileSync(repositoryCommitJsonPath, "utf8")
                    );

                    if (!repositoryCommitJson.last_commit) {
                        console.log("repositoryCommitJson.last_commit does not exist");
                        console.log({ clientRootDirPath });
                    }
                    const currentDate = new Date().toLocaleString();
                    // Update last_commit
                    repositoryCommitJson.last_commit = currentDate;

                    // Write the updated JSON back to the file
                    fs.writeFileSync(
                        repositoryCommitJsonPath,
                        JSON.stringify(repositoryCommitJson, null, 4),
                        "utf8"
                    );
                    
                    projectSpinner.text = `Committing changes to shared backend repository for project: ${project.projectName}`;
                    await sharedBackendGit.add(`commit.json`);

                    // Add only the b2fPortal folder
                    await sharedBackendGit.add(`src/${project.projectBaseDirPath}/*`);

                    // Commit with the current date and time
                    const commitMessage = `${currentDate} transfer2Shared from ${repositoryPackageJson.name}`;
                    await sharedBackendGit.commit(commitMessage);

                    // Push the commit to the main branch
                    projectSpinner.text = `Pushing changes to shared backend repository for project: ${project.projectName}`;
                    await sharedBackendGit.push("origin", "main");

                    successProgress(projectSpinner, `Changes committed and pushed successfully for project: ${project.projectName}`);
                    projectProgress.incrementCompleted(`Completed: ${project.projectName}`);
                } else {
                    failProgress(projectSpinner, "sharedBackendPath is not defined");
                    projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                    console.error("sharedBackendPath is not defined");
                    process.exit(1);
                }

                if (project.sections.length === 0) {
                    console.log("no sections in " + project.projectName);
                }
            } catch (error) {
                failProgress(projectSpinner, `Error processing project: ${project.projectName}`);
                projectProgress.incrementFailed(`Failed: ${project.projectName}`);
                console.error(`Error processing project ${project.projectName}:`, error);
            }
        }
        
        projectProgress.complete();
    } catch (error: any) {
        console.error("Error while committing changes:", error.message);

        // Handle edge case where the repository might have conflicting changes
        if (error.message.includes("CONFLICT")) {
            console.error("Merge conflict detected. Please resolve conflicts manually.");
        }
    }

    console.log("------------transfer2Shared finished-------------");
};

// if (isDeveloperAdarsh) {
//     transfer2Shared();
// } else {
//     console.log("This command can only be run by authorized developers.");
// }
