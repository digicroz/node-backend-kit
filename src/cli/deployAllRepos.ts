import fs from "fs"
import { join } from "path"
import path from "path"
import { execSync } from "child_process"
import { clientRootDirPath } from "../utils/path.js"
import { simpleGit, SimpleGit, SimpleGitOptions } from "simple-git"
import { isDeveloperAdarsh } from "../configs/environment.js"
import { loadConfig } from "../utils/loadConfig.js"
import { TNbkProject } from "../types.js"
import {
  createMultiProgress,
  startProgress,
  successProgress,
  failProgress,
  withProgress,
} from "../utils/progress.js"

const getAllPaths = () => {
  try {
    // Load projects from the configuration file
    const config = loadConfig()

    // Export projects for use in CLI tools
    let b2fPortalProjects: TNbkProject[] = config.projects

    const allPaths = []
    allPaths.push(clientRootDirPath)
    for (const project of b2fPortalProjects) {
      if (project.sharedBackendPath) {
        const sharedBackendPath = join(
          clientRootDirPath,
          project.sharedBackendPath
        )

        if (!fs.existsSync(sharedBackendPath)) {
          console.log("sharedBackendPath does not exist")
          console.log({ sharedBackendPath })

          return []
        }
        allPaths.push(sharedBackendPath)
      }
      for (const section of project.sections) {
        if (section.repository.path) {
          const repositoryPath = join(
            clientRootDirPath,
            section.repository.path
          )
          if (!fs.existsSync(repositoryPath)) {
            console.log("repositoryPath does not exist")
            console.log({ repositoryPath })

            return []
          }
          allPaths.push(repositoryPath)
        }
      }
    }
    return allPaths
  } catch (error) {
    console.log(error)
    return []
  }
}

const checkRepo = async (repoPath: string) => {
  try {
    const repositoryPackageJsonPath = join(repoPath, "package.json")
    if (!fs.existsSync(repositoryPackageJsonPath)) {
      console.log("repositoryPackageJsonPath does not exist")
      console.log({ repoPath })
      return
    }
    const repositoryPackageJson = JSON.parse(
      fs.readFileSync(repositoryPackageJsonPath, "utf8")
    )
    if (!repositoryPackageJson.name) {
      console.log("repositoryPackageJson.name does not exist")
      console.log({ repoPath })
      return
    }
    if (!repositoryPackageJson.scripts?.deploy) {
      console.log("deploy script does not exist, skipping....")
      console.log({ repoPath })
      return
    }

    const spinner = startProgress(
      `Checking Repo: ${repositoryPackageJson.name}`
    )

    const options: Partial<SimpleGitOptions> = {
      baseDir: path.resolve(repoPath),
      binary: "git",
      maxConcurrentProcesses: 6,
    }
    const git: SimpleGit = simpleGit(options)
    spinner.text = `${repositoryPackageJson.name}: fetching ...`

    await git.fetch()
    spinner.text = `${repositoryPackageJson.name}: Checking status ...`

    let status = await git.status()

    // Save the current branch name
    const currentBranch = status.current

    // console.log(currentBranch);

    if (currentBranch !== "main") {
      failProgress(
        spinner,
        `Current branch is ${currentBranch}, but it should be main.`
      )
      console.log(`Repo: ${repoPath}`)
      process.exit(1)
    }
    if (status.files.length > 0) {
      failProgress(spinner, "❌ Uncommitted changes detected")
      console.log(`Repo: ${repoPath}`)
      process.exit(1)
    }

    spinner.text = `${repositoryPackageJson.name}: pulling ...`

    await git.pull()
    spinner.text = `${repositoryPackageJson.name}: Checking status ...`
    status = await git.status()

    // Check for new uncommitted changes after pulling
    if (status.files.length > 0) {
      failProgress(spinner, "❌ Uncommitted changes detected after pull")
      console.log(`Repo: ${repoPath}`)
      process.exit(1)
    } else {
      spinner.text = `${repositoryPackageJson.name}: pushing ...`

      await git.push()
    }

    spinner.text = `${repositoryPackageJson.name}: fetching branches...`

    const branches = await git.branch(["-r"])

    // Check if stable branch exists in remote
    if (!branches.all.includes("origin/stable")) {
      failProgress(spinner, "stable branch does not exist")
      console.log(`Repo: ${repoPath}`)
      process.exit(1)
    }

    successProgress(
      spinner,
      `Checking Repo: ${repositoryPackageJson.name} Finished`
    )
  } catch (error: any) {
    console.error("Error while committing changes:", error.message)

    // Handle edge case where the repository might have conflicting changes
    if (error.message.includes("CONFLICT")) {
      console.error(
        "Merge conflict detected. Please resolve conflicts manually."
      )
    }
  }
}

const runDeployCommand = async (repoPath: string) => {
  try {
    const repositoryPackageJsonPath = join(repoPath, "package.json")
    if (!fs.existsSync(repositoryPackageJsonPath)) {
      console.log("repositoryPackageJsonPath does not exist")
      console.log({ repoPath })
      return
    }
    const repositoryPackageJson = JSON.parse(
      fs.readFileSync(repositoryPackageJsonPath, "utf8")
    )
    if (!repositoryPackageJson.name) {
      console.log("repositoryPackageJson.name does not exist")
      console.log({ repoPath })
      return
    }
    if (!repositoryPackageJson.scripts?.deploy) {
      console.log("deploy script does not exist, skipping....")
      console.log({ repoPath })
      return
    }

    const spinner = startProgress(`Deploying: ${repositoryPackageJson.name}`)

    try {
      execSync("npm run deploy", { cwd: repoPath, stdio: "pipe" })
      successProgress(
        spinner,
        `Deployment successful: ${repositoryPackageJson.name}`
      )
    } catch (error) {
      failProgress(spinner, `Deployment failed: ${repositoryPackageJson.name}`)
      throw error
    }
  } catch (error) {
    console.error(`Deployment failed for ${repoPath}`, error)
  }
}

export const deployAllRepos = async () => {
  console.log("------------deployAll Started-------------")
  try {
    const allPaths = getAllPaths()

    if (allPaths.length === 0) {
      console.log("No valid repositories found. Exiting.")
      return
    }

    const progress = createMultiProgress()
    progress.start("Starting repository checks")
    progress.setTotal(allPaths.length)

    // First check all repos
    for (const repoPath of allPaths) {
      try {
        await checkRepo(repoPath)
        progress.incrementCompleted()
      } catch (error) {
        progress.incrementFailed()
        console.error(`Error checking repository: ${repoPath}`, error)
      }
    }

    progress.complete("Repository checks completed")

    // Then deploy all repos
    const deployProgress = createMultiProgress()
    deployProgress.start("Starting deployments")
    deployProgress.setTotal(allPaths.length)

    for (const repoPath of allPaths) {
      try {
        await runDeployCommand(repoPath)
        deployProgress.incrementCompleted()
      } catch (error) {
        deployProgress.incrementFailed()
        console.error(`Error deploying repository: ${repoPath}`, error)
      }
    }

    deployProgress.complete("Deployments completed")
  } catch (error) {
    console.log(error)
  }

  console.log("------------deployAll Ended-------------")
}

// if (isDeveloperAdarsh) {
//     deployAllRepos();
// } else {
//     console.log("This command can only be run by authorized developers.");
// }
