import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { clientRootDirPath } from "../utils/path.js"

export async function addDevVersion(targetDir?: string): Promise<void> {
  try {
    // Use current directory if no target directory provided
    const targetDirectory = targetDir || process.cwd()
    const packageJsonPath = path.join(targetDirectory, "package.json")

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`No package.json found in ${targetDirectory}`)
      return
    }

    console.log(`Updating package.json in ${targetDirectory}`)

    // Read the package.json file
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8")
    const packageJson = JSON.parse(packageJsonContent)

    // Update or add the dependency
    const pbkPath = "file:C:/primexopRepos/pbk"
    const originalVersion =
      packageJson.dependencies?.["@digicroz/node-backend-kit"] ||
      packageJson.devDependencies?.["@digicroz/node-backend-kit"]

    // Determine if it's in dependencies or devDependencies
    let dependencyType = "dependencies"
    if (
      !packageJson.dependencies?.["@digicroz/node-backend-kit"] &&
      packageJson.devDependencies?.["@digicroz/node-backend-kit"]
    ) {
      dependencyType = "devDependencies"
    }

    // Create the section if it doesn't exist
    if (!packageJson[dependencyType]) {
      packageJson[dependencyType] = {}
    }

    // Update the dependency
    packageJson[dependencyType]["@digicroz/node-backend-kit"] = pbkPath

    // Save the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    console.log(
      `Updated @digicroz/node-backend-kit to use local version: ${pbkPath}`
    )
    if (originalVersion) {
      console.log(`Original version was: ${originalVersion}`)
    }

    // Run npm install
    console.log("Running npm install...")
    execSync("npm install", {
      stdio: "inherit",
      cwd: targetDirectory,
    })

    console.log(
      "Successfully installed the local development version of @digicroz/node-backend-kit"
    )
  } catch (error) {
    console.error("Error adding dev version:", error)
  }
}
