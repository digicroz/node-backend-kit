import fs from "fs"
import path from "path"
import { execSync } from "child_process"

export async function addProdVersion(
  targetDir?: string,
  version?: string
): Promise<void> {
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

    // Determine the target version to use
    const prodVersion = version || "latest"

    // Check if package is in dependencies or devDependencies
    let dependencyType = null
    let originalVersion = null

    if (packageJson.dependencies?.["@digicroz/node-backend-kit"]) {
      dependencyType = "dependencies"
      originalVersion = packageJson.dependencies["@digicroz/node-backend-kit"]
    } else if (packageJson.devDependencies?.["@digicroz/node-backend-kit"]) {
      dependencyType = "devDependencies"
      originalVersion =
        packageJson.devDependencies["@digicroz/node-backend-kit"]
    }

    if (!dependencyType) {
      console.log(
        "@digicroz/node-backend-kit not found in dependencies or devDependencies. Will add to dependencies."
      )
      dependencyType = "dependencies"
      if (!packageJson[dependencyType]) {
        packageJson[dependencyType] = {}
      }
    }

    // Get the latest version from npm if 'latest' is specified
    let versionToUse = prodVersion
    if (prodVersion === "latest") {
      try {
        const npmViewResult = execSync(
          "npm view @digicroz/node-backend-kit version",
          { encoding: "utf-8" }
        ).trim()
        versionToUse = `^${npmViewResult}`
        console.log(`Latest npm version found: ${npmViewResult}`)
      } catch (err) {
        console.warn(
          'Failed to get latest version from npm. Using "latest" tag instead.'
        )
        versionToUse = "latest"
      }
    }

    // Update the dependency
    packageJson[dependencyType]["@digicroz/node-backend-kit"] = versionToUse

    // Save the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    console.log(
      `Updated @digicroz/node-backend-kit to use production version: ${versionToUse}`
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
      "Successfully installed the production version of @digicroz/node-backend-kit"
    )
  } catch (error) {
    console.error("Error adding production version:", error)
  }
}
