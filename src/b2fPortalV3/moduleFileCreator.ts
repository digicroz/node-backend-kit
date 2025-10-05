import * as fs from "fs";
import * as path from "path";

// Function to check if a directory contains a .ts file and create it if necessary
export function createModuleFiles(baseDir: string) {
    // Read the contents of the base directory
    const items = fs.readdirSync(baseDir);

    // Iterate through each item in the base directory
    items.forEach((item) => {
        const itemPath = path.join(baseDir, item);

        // Check if the item is a directory
        if (fs.statSync(itemPath).isDirectory()) {
            const tsFilePath = path.join(itemPath, `${item}.ts`);

            // Prepare the content
            const importStatement =
                ` import { trpcRouter } from` + ` "@global/trpc/trpc.js";`;
            const fileContent = `\n\n export const ${item}Routes = trpcRouter({});\n`;

            // Ensure that the directory contains a .ts file with the same name as the directory
            if (!fs.existsSync(tsFilePath)) {
                // If the file does not exist, create it with the import and content
                fs.writeFileSync(tsFilePath, importStatement + fileContent);
                console.log(
                    `File ${tsFilePath} created with import and default content.`
                );
            } else {
                // Check if the .ts file is empty
                const fileStats = fs.statSync(tsFilePath);
                if (fileStats.size === 0) {
                    // Add the import statement and export function only if the file is empty
                    fs.writeFileSync(tsFilePath, importStatement + fileContent);
                    // console.log(
                    //     `File ${tsFilePath} was empty and import and default content were added.`
                    // );
                } else {
                    // console.log(
                    //     `File ${tsFilePath} already exists and is not empty. No changes made.`
                    // );
                }
            }

            // Recursively call the function to check subdirectories
            createModuleFiles(itemPath);
        }
    });
}
