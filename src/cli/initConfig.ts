import fs from "fs"
import path from "path"
import { clientRootDirPath } from "../utils/path.js"
import { updateVSCodeSettings } from "../utils/vscodeSettings.js"

export async function initConfig(): Promise<void> {
  const configPath = path.join(clientRootDirPath, "nbk.config.json")

  // Check if nbk.config.json already exists
  if (fs.existsSync(configPath)) {
    console.log("nbk.config.json already exists in the project root.")
  } else {
    // Create nbk.config.json with default configuration
    const defaultConfig = {
      b2fPortal: true,
      checkCrossProjectImports: true,
      projects: [],
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    console.log(
      "Created nbk.config.json with default configuration in the project root."
    )
  }

  // Update VSCode settings
  updateVSCodeSettings()
}
