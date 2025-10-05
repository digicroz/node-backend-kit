import path from "path"
import { TNbkConfig, TNbkProject, TNbkProjectSection } from "../types.js"
import fs from "fs"
import { stripComments } from "./jsonFile.js"

/**
 * Creates a visually distinct, colorful error message for config file not found errors
 * @param configPath - Path to the config file that was not found
 * @returns Formatted error message string
 */
function createConfigNotFoundErrorMessage(configPath: string): string {
  const separator = "=".repeat(80)
  const title = "CONFIG FILE NOT FOUND ERROR"

  // Color codes for terminal
  const red = "\x1b[31m"
  const yellow = "\x1b[33m"
  const cyan = "\x1b[36m"
  const reset = "\x1b[0m"
  const bold = "\x1b[1m"

  // Create suggested config example
  const configExample = JSON.stringify(
    {
      projects: [
        {
          projectName: "Your Project",
          projectBaseDirPath: "C:/path/to/your/project",
          sections: [
            {
              sectionName: "Backend",
              repository: {
                name: "your-backend-repo",
                path: "https://github.com/your-org/your-repo",
              },
              localPath: "C:/path/to/your/backend",
              isZodCreator: true,
            },
          ],
        },
      ],
      b2fPortal: false,
      checkCrossProjectImports: true,
    },
    null,
    2
  )

  return `
${red}${separator}${reset}
${red}${bold} ${title} ${reset}
${red}${separator}${reset}

${yellow}The configuration file could not be found at:${reset}
${cyan}${configPath}${reset}

${yellow}Please create a nbk.config.json file at the root of your project with the following structure:${reset}

${configExample}

${yellow}To specify a different config location, provide the path when calling nbkInit():${reset}
${cyan}nbkInit({ configPath: './path/to/your/config.json' })${reset}

${red}${separator}${reset}
`
}

/**
 * Creates a visually distinct, colorful error message for validation errors
 * @param message - The error message content
 * @returns Formatted error message string
 */
function createValidationErrorMessage(message: string): string {
  const separator = "=".repeat(80)
  const title = "CONFIG VALIDATION ERROR"

  // Color codes for terminal
  const red = "\x1b[31m"
  const yellow = "\x1b[33m"
  const green = "\x1b[32m"
  const reset = "\x1b[0m"
  const bold = "\x1b[1m"

  return `
${red}${separator}${reset}
${red}${bold} ${title} ${reset}
${red}${separator}${reset}

${yellow}${message}${reset}

${green}Please review your configuration file and fix the validation issue.${reset}

${red}${separator}${reset}
`
}

/**
 * Loads and validates the NBK configuration from a JSON file
 * @param configPath - Path to the config file (optional, defaults to nbk.config.json in current directory)
 * @returns Validated TNbkConfig object
 * @throws Error if the configuration is invalid or file doesn't exist
 */
export function loadConfig(
  configPath: string = path.join(process.cwd(), "nbk.config.json")
): TNbkConfig {
  try {
    // Check if file exists
    if (!fs.existsSync(configPath)) {
      const errorMessage = createConfigNotFoundErrorMessage(configPath)
      console.error(errorMessage)
      throw new Error(`Configuration file not found: ${configPath}`)
    }

    // Read file and strip comments
    const configString = fs.readFileSync(configPath, "utf8")
    const strippedConfig = stripComments(configString)

    // Parse JSON file
    const config = JSON.parse(strippedConfig) as TNbkConfig

    // Validate the entire config structure
    try {
      validateConfig(config)
    } catch (validationError) {
      if (validationError instanceof Error) {
        const errorMessage = createValidationErrorMessage(
          validationError.message
        )
        console.error(errorMessage)
      }
      throw validationError
    }

    return config
  } catch (error) {
    if (error instanceof SyntaxError) {
      const errorMessage = createValidationErrorMessage(
        `Invalid JSON in configuration file: ${error.message}`
      )
      console.error(errorMessage)
      throw new Error(`Invalid JSON in configuration file: ${error.message}`)
    }
    throw error
  }
}

/**
 * Validates the configuration object
 * @param config - The configuration object to validate
 * @throws Error with detailed message if validation fails
 */
function validateConfig(config: any): asserts config is TNbkConfig {
  // Check if config has projects array
  if (!config || !Array.isArray(config.projects)) {
    throw new Error('Configuration must contain a "projects" array')
  }

  // Check for b2fPortal and checkCrossProjectImports fields
  if (typeof config.b2fPortal !== "boolean") {
    throw new Error('Configuration must contain a "b2fPortal" boolean field')
  }

  if (typeof config.checkCrossProjectImports !== "boolean") {
    throw new Error(
      'Configuration must contain a "checkCrossProjectImports" boolean field'
    )
  }

  // Validate each project
  for (let i = 0; i < config.projects.length; i++) {
    const project = config.projects[i]
    validateProject(project, i)
  }
}

/**
 * Validates a project configuration
 * @param project - The project to validate
 * @param index - Index in projects array for error messages
 */
function validateProject(
  project: any,
  index: number
): asserts project is TNbkProject {
  // Required fields
  if (!project.projectName) {
    throw new Error(`Project at index ${index} is missing "projectName"`)
  }

  if (!project.projectBaseDirPath) {
    throw new Error(
      `Project "${project.projectName}" is missing "projectBaseDirPath"`
    )
  }

  if (!Array.isArray(project.sections)) {
    throw new Error(
      `Project "${project.projectName}" must contain a "sections" array`
    )
  }

  // Validate each section
  for (let j = 0; j < project.sections.length; j++) {
    validateSection(project.sections[j], project.projectName, j)
  }
}

/**
 * Validates a project section configuration
 * @param section - The section to validate
 * @param projectName - Parent project name for error messages
 * @param index - Index in sections array for error messages
 */
function validateSection(
  section: any,
  projectName: string,
  index: number
): asserts section is TNbkProjectSection {
  // Required fields
  if (!section.sectionName) {
    throw new Error(
      `Section at index ${index} in project "${projectName}" is missing "sectionName"`
    )
  }

  if (!section.repository) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}" is missing "repository"`
    )
  }

  if (!section.repository.name) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}" has repository missing "name"`
    )
  }

  if (!section.repository.path) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}" has repository missing "path"`
    )
  }

  if (!section.localPath) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}" is missing "localPath"`
    )
  }

  if (section.isZodCreator === undefined) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}" is missing "isZodCreator"`
    )
  }

  // Type checks
  if (typeof section.isZodCreator !== "boolean") {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}": "isZodCreator" must be a boolean`
    )
  }

  if (
    section.needNextJsPatch !== undefined &&
    typeof section.needNextJsPatch !== "boolean"
  ) {
    throw new Error(
      `Section "${section.sectionName}" in project "${projectName}": "needNextJsPatch" must be a boolean if provided`
    )
  }
}
