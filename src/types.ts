/**
 * Type definitions for nbk
 */

/**
 * Represents a section within a project
 */
export type TNbkProjectSection = {
  sectionName: string
  repository: {
    name: string
    path: string
  }
  localPath: string
  isZodCreator: boolean
  needNextJsPatch?: boolean
}

/**
 * Represents a project in the configuration
 */
export type TNbkProject = {
  projectName: string
  projectBaseDirPath: string
  sharedBackendPath?: string
  sections: TNbkProjectSection[]
}

/**
 * Type for nbk.config.ts file's default export,
 * which is an array of projects
 */
export type TNbkConfig = {
  projects: TNbkProject[]
  b2fPortal: boolean
  checkCrossProjectImports: boolean
}
