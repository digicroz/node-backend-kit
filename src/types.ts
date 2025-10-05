/**
 * Type definitions for pbk
 */

/**
 * Represents a section within a project
 */
export type TPbkProjectSection = {
    sectionName: string;
    repository: {
        name: string;
        path: string;
    };
    localPath: string;
    isZodCreator: boolean;
    needNextJsPatch?: boolean;
};

/**
 * Represents a project in the configuration
 */
export type TPbkProject = {
    projectName: string;
    projectBaseDirPath: string;
    sharedBackendPath?: string;
    sections: TPbkProjectSection[];
};

/**
 * Type for pbk.config.ts file's default export,
 * which is an array of projects
 */
export type TPbkConfig = {
    projects: TPbkProject[];
    b2fPortal: boolean;
    checkCrossProjectImports: boolean;
};