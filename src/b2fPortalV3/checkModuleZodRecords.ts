import fs from "fs";
import path from "path";

// Recursively checks if all internal Zod schemas have correct entries in their parent Zod schema file
const checkSubZodSchemas = (parentModuleDir: string, parentZodFile: string) => {
    const subItems = fs.readdirSync(parentModuleDir);

    subItems.forEach((item) => {
        const itemPath = path.join(parentModuleDir, item);

        if (fs.lstatSync(itemPath).isDirectory()) {
            // If it's a directory, expect that it has a corresponding Zod schema file
            const subZodFile = path.join(itemPath, `${item}Zod.ts`);
            if (fs.existsSync(subZodFile)) {
                // Check that the submodule's Zod schema is included in the parent Zod file
                const parentZodContent = fs.readFileSync(
                    parentZodFile,
                    "utf-8"
                );
                const expectedSchemaEntry = `${item}: ${item}ZodSchema`;

                if (!parentZodContent.includes(expectedSchemaEntry)) {
                    throw new Error(
                        `\n\n ${expectedSchemaEntry},\n\nis missing in ${path.basename(parentZodFile)},\n\nPath:${parentZodFile}\n\n`
                    );
                }

                // Recursively check subdirectories for further internal schemas
                checkSubZodSchemas(itemPath, subZodFile);
            } else {
                console.log(
                    `Warning: Expected ${subZodFile} not found in ${itemPath}`
                );
            }
        }
    });
};

// Main function to check first-level Zod schemas in zodSchemas.ts and recurse for internal levels
export const checkModuleZodRecords = (baseDir: string) => {
    const zodSchemasPath = path.join(baseDir, "zodSchemas.ts");

    // Check if zodSchemas.ts file exists
    if (!fs.existsSync(zodSchemasPath)) {
        throw new Error(`Error: zodSchemas.ts file not found in ${baseDir}`);
    }

    // Read zodSchemas.ts content
    const zodSchemasContent = fs.readFileSync(zodSchemasPath, "utf-8");

    // List of first-level directories inside /modules
    const modulesPath = path.join(baseDir, "modules");
    const modules = fs.readdirSync(modulesPath).filter((file) => {
        const moduleDir = path.join(modulesPath, file);
        return fs.lstatSync(moduleDir).isDirectory();
    });

    // Iterate over first-level modules to check for corresponding Zod schemas in zodSchemas.ts
    for (const moduleName of modules) {
        const moduleDir = path.join(modulesPath, moduleName);
        const moduleZodFile = path.join(moduleDir, `${moduleName}Zod.ts`);

        // Ensure the first-level Zod schema file exists and is in zodSchemas.ts
        if (fs.existsSync(moduleZodFile)) {
            const schemaName = `${moduleName}: ${moduleName}ZodSchema`;

            if (!zodSchemasContent.includes(schemaName)) {
                throw new Error(
                    `\n\n ${schemaName},\n\n is missing in zodSchemas.ts,\n\nPath:${zodSchemasPath}\n\n`
                );
            }

            // Recursively check submodules for this first-level module
            checkSubZodSchemas(moduleDir, moduleZodFile);
        } else {
            console.log(
                `Warning: ${moduleZodFile} does not exist, skipping check for ${moduleName}`
            );
        }
    }

    // console.log("All Zod schema entries are correctly defined.");
};
