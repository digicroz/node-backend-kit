import fs from "fs";
import path from "path";

// Recursively checks if all internal modules have correct entries in their parent router file
const checkSubModules = (parentModuleDir: string, parentRouterFile: string) => {
    const subItems = fs.readdirSync(parentModuleDir);

    subItems.forEach((item) => {
        const itemPath = path.join(parentModuleDir, item);

        if (fs.lstatSync(itemPath).isDirectory()) {
            // If it's a directory, expect that it has a corresponding .ts file
            const subModuleRouter = path.join(itemPath, `${item}.ts`);
            if (fs.existsSync(subModuleRouter)) {
                // Check that the submodule is included in the parent router file
                const parentRouterContent = fs.readFileSync(
                    parentRouterFile,
                    "utf-8"
                );
                const expectedRouteEntry = `${item}: ${item}Routes`;

                if (!parentRouterContent.includes(expectedRouteEntry)) {
                    throw new Error(
                        `\n\n ${expectedRouteEntry}, \n\nis missing in ${path.basename(parentRouterFile)}, \n\nPath:${parentRouterFile}\n\n`
                    );
                }

                // Recursively check subdirectories
                checkSubModules(itemPath, subModuleRouter);
            } else {
                console.log(
                    `Warning: Expected ${subModuleRouter} not found in ${itemPath}`
                );
            }
        }
    });
};

// Main function to check the first level in trpcRouter.ts and recurse for internal levels
export const checkModuleRecords = (baseDir: string) => {
    const trpcRouterPath = path.join(baseDir, "trpcRouter.ts");

    // Check if trpcRouter.ts file exists
    if (!fs.existsSync(trpcRouterPath)) {
        throw new Error(`Error: trpcRouter.ts file not found in ${baseDir}`);
    }

    // Read trpcRouter.ts content
    const trpcRouterContent = fs.readFileSync(trpcRouterPath, "utf-8");

    // List of first-level directories inside /modules
    const modulesPath = path.join(baseDir, "modules");
    const modules = fs.readdirSync(modulesPath).filter((file) => {
        const moduleDir = path.join(modulesPath, file);
        return fs.lstatSync(moduleDir).isDirectory();
    });

    // Iterate over first-level modules to check for corresponding entries in trpcRouter.ts
    for (const moduleName of modules) {
        const moduleDir = path.join(modulesPath, moduleName);
        const moduleRouterFile = path.join(moduleDir, `${moduleName}.ts`);

        // Ensure the first-level module .ts file exists and is in trpcRouter.ts
        if (fs.existsSync(moduleRouterFile)) {
            const routeName = `${moduleName}: ${moduleName}Routes`;

            if (!trpcRouterContent.includes(routeName)) {
                throw new Error(
                    `\n\n ${routeName}, \n\n is missing in trpcRouter.ts \n\nPath:${trpcRouterPath}\n\n`
                );
            }

            // Recursively check submodules for this first-level module
            checkSubModules(moduleDir, moduleRouterFile);
        } else {
            console.log(
                `Warning: ${moduleRouterFile} does not exist, skipping check for ${moduleName}`
            );
        }
    }

    // console.log("All module and sub-module routes are correctly defined.");
};
