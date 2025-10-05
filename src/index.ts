/**
 * Main entry point for the package
 */

import * as fs from "fs"
import * as path from "path"
import { TNbkConfig, TNbkProject } from "./types.js"
import { b2fPortalInit } from "./b2fPortalV3/b2fPortal.js"
import { checkCrossProjectImportsFun } from "./helpers/checkCrossProjectImports.js"
import { loadConfig } from "./utils/loadConfig.js"

export function greet(name: string): string {
  return `Hello, ${name}!`
}

/**
 * Initializes the nbk by loading configuration from a JSON file.
 * This is the primary initialization method for the library.
 *
 * @param {Object} options - Initialization options
 * @param {string} [options.configPath] - Path to the JSON config file (defaults to nbk.config.json in current directory)
 * @returns {TNbkConfig} The loaded and validated configuration
 * @throws {Error} If the configuration is invalid or file doesn't exist
 */
export async function nbkInit(
  options: {
    configPath?: string
  } = {}
): Promise<TNbkConfig> {
  // Set default options
  const { configPath = path.join(process.cwd(), "nbk.config.json") } = options

  try {
    // Load and validate config
    const config = loadConfig(configPath)
    if (!config) {
      return {} as TNbkConfig
    }
    console.log(
      `Successfully loaded configuration with ${config.projects.length} projects`
    )

    // Initialize features based on config flags
    if (config.b2fPortal) {
      await b2fPortalInit(config.projects)
    }

    if (config.checkCrossProjectImports) {
      await checkCrossProjectImportsFun(config.projects)
    }

    return config
  } catch (error) {
    console.error("Failed to initialize nbk:", error)
    throw error
  }
}

// When using ES modules with TypeScript, you need to include the .js extension
// in import statements, even though the source file has a .ts extension
// This is because Node.js will look for .js files at runtime

export * from "./types.js"
