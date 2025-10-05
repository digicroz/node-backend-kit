import fs from "fs";
import path from "path";

export function createZodFiles(directoryPath:string) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("Error accessing file:", err);
                    return;
                }
                if (stats.isDirectory()) {
                    // Recursively call for subdirectories
                    createZodFiles(filePath);
                } else if (file.endsWith(".ts") && !file.endsWith("Zod.ts")) {
                    const newFileName = `${path.parse(file).name}Zod.ts`;
                    const newFilePath = path.join(directoryPath, newFileName);
                    if (!fs.existsSync(newFilePath)) {
                        const newData = `export const ${path.parse(file).name}ZodSchema = {\n\t\n};\n`;
                        fs.writeFile(newFilePath, newData, (err) => {
                            if (err) {
                                console.error("Error creating new file:", err);
                            } else {
                                console.log(`Created ${newFileName}`);
                            }
                        });
                    } else {
                        // console.log(`${newFileName} already exists, skipping...`);
                    }
                }
            });
        });
    });
}
